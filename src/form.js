// "List My Flat" form: collect fields, pick a location, save a pin to Firestore.
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, ensureSignedIn, isFirebaseConfigured } from './firebase.js';
import {
  PATNA_BOUNDS,
  LAT_LNG_DECIMALS,
  RENT_MIN,
  RENT_MAX,
  FEEDBACK_MAX,
} from './config.js';

let map;
let onSaved = () => {}; // called after a pin is saved so the map can refresh
let chosen = null; // { lat, lng }
let prevChosen = null; // snapshot so "Cancel" can restore the pre-pick location
let pickMarker = null;
let pickListener = null;
let AdvancedMarkerElement = null;

const $ = (sel) => document.querySelector(sel);
const round = (n) => {
  const f = 10 ** LAT_LNG_DECIMALS;
  return Math.round(n * f) / f;
};
const inPatna = (lat, lng) =>
  lat >= PATNA_BOUNDS.south &&
  lat <= PATNA_BOUNDS.north &&
  lng >= PATNA_BOUNDS.west &&
  lng <= PATNA_BOUNDS.east;

export function setupForm(mapInstance, savedCallback) {
  map = mapInstance;
  onSaved = savedCallback || (() => {});

  const overlay = $('#form-overlay');
  const form = $('#flat-form');

  $('#list-flat-btn').addEventListener('click', openSheet);
  $('#form-close').addEventListener('click', closeSheet);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeSheet();
  });

  // Conditional fields.
  form.listingType.addEventListener('change', syncConditional);
  form.availableKind.addEventListener('change', syncConditional);
  syncConditional();

  // Feedback counter.
  form.feedback.addEventListener('input', () => {
    $('#feedback-count').textContent = `${form.feedback.value.length} / ${FEEDBACK_MAX}`;
  });

  // Location.
  $('#use-gps').addEventListener('click', useGps);
  $('#pick-map').addEventListener('click', startPickOnMap);
  $('#pick-cancel').addEventListener('click', cancelPickOnMap);
  $('#pick-done').addEventListener('click', confirmPickOnMap);

  form.addEventListener('submit', onSubmit);
}

function openSheet() {
  $('#form-overlay').hidden = false;
  if (isFirebaseConfigured()) {
    // Kick off anonymous sign-in early so submit is instant.
    ensureSignedIn().catch((err) => console.error('Sign-in failed', err));
  }
}

function closeSheet() {
  $('#form-overlay').hidden = true;
}

function syncConditional() {
  const form = $('#flat-form');
  const isRoom = form.listingType.value === 'room' || form.listingType.value === 'flatmate';
  document.querySelectorAll('[data-when-room]').forEach((el) => (el.hidden = !isRoom));
  document.querySelector('[data-when-date]').hidden = form.availableKind.value !== 'date';
}

// --- Location handling ---
function setLocDisplay(text) {
  $('#loc-display').textContent = text;
}

function useGps() {
  if (!navigator.geolocation) {
    setLocDisplay('GPS not available on this device.');
    return;
  }
  setLocDisplay('Getting your location…');
  navigator.geolocation.getCurrentPosition(
    (pos) => setChosen(pos.coords.latitude, pos.coords.longitude),
    () => setLocDisplay('Could not get GPS. Try "Pick on map".'),
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

// Enter pick mode: hide the form, keep the map open, and let the user tap to
// place the pin and drag/tap again to adjust. The form only reopens when they
// confirm with "Use this location" (or cancel).
async function startPickOnMap() {
  if (!AdvancedMarkerElement) {
    ({ AdvancedMarkerElement } = await google.maps.importLibrary('marker'));
  }
  prevChosen = chosen; // so Cancel can restore the previous choice
  closeSheet();
  setPickText('Tap the map to place your pin, then drag it to adjust.');
  $('#pick-done').disabled = !chosen; // allow confirming at once if already placed
  $('#pick-hint').hidden = false;
  if (pickListener) pickListener.remove();
  pickListener = map.addListener('click', (e) => {
    setChosen(e.latLng.lat(), e.latLng.lng());
    $('#pick-done').disabled = false;
    setPickText(`Pin at ${chosen.lat}, ${chosen.lng} — drag it or tap again to adjust.`);
  });
}

function setPickText(text) {
  const el = $('#pick-hint-text');
  if (el) el.textContent = text;
}

// Leave pick mode and reopen the form. `commit` keeps the placed location;
// otherwise the pre-pick location (if any) is restored.
function endPickOnMap(commit) {
  $('#pick-hint').hidden = true;
  if (pickListener) {
    pickListener.remove();
    pickListener = null;
  }
  if (!commit) {
    chosen = prevChosen;
    if (chosen) {
      drawPickMarker(chosen.lat, chosen.lng);
      setLocDisplay(`Chosen: ${chosen.lat}, ${chosen.lng} (rounded for privacy)`);
    } else {
      if (pickMarker) pickMarker.map = null;
      setLocDisplay('No location chosen yet');
    }
  }
  $('#form-overlay').hidden = false; // always return to the form
}

function confirmPickOnMap() {
  endPickOnMap(true);
}

function cancelPickOnMap() {
  endPickOnMap(false);
}

function setChosen(lat, lng) {
  const rLat = round(lat);
  const rLng = round(lng);
  chosen = { lat: rLat, lng: rLng };
  if (!inPatna(rLat, rLng)) {
    setLocDisplay(`⚠️ ${rLat}, ${rLng} is outside Patna — pick a spot inside Patna.`);
  } else {
    setLocDisplay(`Chosen: ${rLat}, ${rLng} (rounded for privacy)`);
  }
  drawPickMarker(rLat, rLng);
}

function drawPickMarker(lat, lng) {
  if (!AdvancedMarkerElement) return;
  if (!pickMarker) {
    pickMarker = new AdvancedMarkerElement({ map, position: { lat, lng }, gmpDraggable: true });
    pickMarker.addListener('dragend', () => {
      const p = pickMarker.position;
      setChosen(p.lat, p.lng);
    });
  } else {
    pickMarker.position = { lat, lng };
    pickMarker.map = map;
  }
}

// --- Submit ---
function showErr(msg) {
  const el = $('#form-err');
  el.textContent = msg;
  el.hidden = false;
}

function triState(v) {
  if (v === 'true') return true;
  if (v === 'false') return false;
  return null;
}
const numOrNull = (v) => (v === '' || v == null ? null : Number(v));

async function onSubmit(e) {
  e.preventDefault();
  $('#form-err').hidden = true;

  if (!isFirebaseConfigured()) {
    showErr('Firebase keys are not set in .env — cannot save yet.');
    return;
  }

  const form = e.target;
  const f = Object.fromEntries(new FormData(form).entries());

  // Validation.
  if (!chosen) return showErr('Please choose a location (Use GPS or Pick on map).');
  if (!inPatna(chosen.lat, chosen.lng)) return showErr('Location must be inside Patna.');
  const rent = Number(f.rentAmount);
  if (!rent || rent < RENT_MIN || rent > RENT_MAX)
    return showErr(`Rent must be between ₹${RENT_MIN} and ₹${RENT_MAX}.`);
  if (!f.locality.trim()) return showErr('Locality is required.');
  if (f.feedback.length > FEEDBACK_MAX) return showErr('Feedback is too long.');

  const isRoom = f.listingType === 'room' || f.listingType === 'flatmate';
  let availableFrom = null;
  if (f.availableKind === 'asap') availableFrom = 'asap';
  else if (f.availableKind === 'date') availableFrom = f.availableDate || null;

  const pin = {
    lat: chosen.lat,
    lng: chosen.lng,
    pinKind: 'rent', // field kept in the data model; UI row removed, defaults to "rent"
    listingType: f.listingType,
    bhk: f.bhk,
    rentAmount: rent,
    roomsAvailable: isRoom ? numOrNull(f.roomsAvailable) : null,
    rentPerRoom: isRoom ? numOrNull(f.rentPerRoom) : null,
    depositMonths: numOrNull(f.depositMonths),
    sqft: numOrNull(f.sqft),
    availableFrom,
    furnished: f.furnished || null,
    gated: triState(f.gated),
    petFriendly: triState(f.petFriendly),
    maintenanceIncluded: triState(f.maintenanceIncluded),
    occupantType: f.occupantType,
    prefFood: f.prefFood,
    prefGender: f.prefGender,
    locality: f.locality.trim(),
    society: f.society.trim(),
    feedback: f.feedback.trim(),
    imageUrls: [], // kept in the data model; photo upload is disabled for now
    ownerUid: '', // set after sign-in below
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const submitBtn = $('#form-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving…';
  try {
    const user = await ensureSignedIn();
    pin.ownerUid = user.uid;
    await addDoc(collection(db, 'pins'), pin);
    resetForm(form);
    closeSheet();
    await onSaved(); // refresh the map so the new pin appears immediately
    alert('Thanks! Your pin was saved.');
  } catch (err) {
    console.error(err);
    showErr('Could not save. Check your connection and Firestore rules, then try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save pin';
  }
}

function resetForm(form) {
  form.reset();
  chosen = null;
  if (pickMarker) pickMarker.map = null;
  setLocDisplay('No location chosen yet');
  $('#feedback-count').textContent = `0 / ${FEEDBACK_MAX}`;
  syncConditional();
}
