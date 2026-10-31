// "Spot a To-Let": tap the toolbar button, tap the map where you saw a To-Let
// board, then a short sheet (BHK, rent, locality) saves a pin with
// pinKind:'tolet'. All other pin fields are defaulted so the write passes the
// same Firestore validation as the full "List My Flat" form.
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, ensureSignedIn, isFirebaseConfigured } from './firebase.js';
import { PATNA_BOUNDS, LAT_LNG_DECIMALS, RENT_MIN, RENT_MAX, FEEDBACK_MAX } from './config.js';

let map;
let onSaved = () => {};
let chosen = null; // { lat, lng }
let tempMarker = null;
let clickListener = null;
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

export function setupSpot(mapInstance, savedCallback) {
  map = mapInstance;
  onSaved = savedCallback || (() => {});

  $('#tb-tolet').addEventListener('click', startSpot);
  $('#spot-hint-cancel').addEventListener('click', cancelSpot);
  $('#spot-close').addEventListener('click', closeSheet);
  const overlay = $('#spot-overlay');
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeSheet();
  });
  $('#spot-form').addEventListener('submit', onSubmit);
}

// Enter placing mode: show the hint and wait for a map tap.
async function startSpot() {
  if (!isFirebaseConfigured()) {
    alert('Saving is disabled until Firebase keys are set in .env.');
    return;
  }
  if (!AdvancedMarkerElement) {
    ({ AdvancedMarkerElement } = await google.maps.importLibrary('marker'));
  }
  ensureSignedIn().catch((err) => console.error('Sign-in failed', err)); // warm up auth

  $('#tb-tolet').classList.add('active');
  $('#spot-hint').hidden = false;
  if (clickListener) clickListener.remove();
  clickListener = map.addListener('click', (e) => {
    setChosen(e.latLng.lat(), e.latLng.lng());
    $('#spot-hint').hidden = true;
    clickListener.remove();
    clickListener = null;
    $('#spot-overlay').hidden = false;
  });
}

function cancelSpot() {
  $('#spot-hint').hidden = true;
  $('#tb-tolet').classList.remove('active');
  if (clickListener) {
    clickListener.remove();
    clickListener = null;
  }
  removeTempMarker();
  chosen = null;
}

function setChosen(lat, lng) {
  const rLat = round(lat);
  const rLng = round(lng);
  chosen = { lat: rLat, lng: rLng };
  drawTempMarker(rLat, rLng);
  $('#spot-loc').textContent = inPatna(rLat, rLng)
    ? `Location: ${rLat}, ${rLng} (rounded for privacy)`
    : `⚠️ ${rLat}, ${rLng} is outside Patna — tap inside Patna.`;
}

function drawTempMarker(lat, lng) {
  if (!AdvancedMarkerElement) return;
  if (!tempMarker) {
    tempMarker = new AdvancedMarkerElement({ map, position: { lat, lng } });
  } else {
    tempMarker.position = { lat, lng };
    tempMarker.map = map;
  }
}

function removeTempMarker() {
  if (tempMarker) tempMarker.map = null;
}

function closeSheet() {
  $('#spot-overlay').hidden = true;
  $('#tb-tolet').classList.remove('active');
  removeTempMarker();
}

function showErr(msg) {
  const el = $('#spot-err');
  el.textContent = msg;
  el.hidden = false;
}

async function onSubmit(e) {
  e.preventDefault();
  $('#spot-err').hidden = true;

  const form = e.target;
  const f = Object.fromEntries(new FormData(form).entries());

  if (!chosen) return showErr('Tap the map to set the location first.');
  if (!inPatna(chosen.lat, chosen.lng)) return showErr('Location must be inside Patna.');
  const rent = Number(f.rentAmount);
  if (!rent || rent < RENT_MIN || rent > RENT_MAX)
    return showErr(`Rent must be between ₹${RENT_MIN} and ₹${RENT_MAX}.`);
  if (!f.locality.trim()) return showErr('Locality is required.');
  if ((f.feedback || '').length > FEEDBACK_MAX) return showErr('Note is too long.');

  // Full pin shape: pinKind 'tolet', available now, everything else defaulted.
  const pin = {
    lat: chosen.lat,
    lng: chosen.lng,
    pinKind: 'tolet',
    listingType: 'whole_flat',
    bhk: f.bhk,
    rentAmount: rent,
    rentPerRoom: null,
    roomsAvailable: null,
    depositMonths: null,
    sqft: null,
    parking: null,
    availableFrom: 'asap',
    furnished: null,
    gated: null,
    petFriendly: null,
    maintenanceIncluded: null,
    occupantType: 'any',
    prefFood: 'any',
    prefGender: 'any',
    locality: f.locality.trim(),
    society: '',
    feedback: (f.feedback || '').trim(),
    imageUrls: [],
    ownerUid: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const btn = $('#spot-submit');
  btn.disabled = true;
  btn.textContent = 'Saving…';
  try {
    const user = await ensureSignedIn();
    pin.ownerUid = user.uid;
    await addDoc(collection(db, 'pins'), pin);
    form.reset();
    chosen = null;
    closeSheet();
    await onSaved();
    alert('Thanks! Your To-Let pin was saved.');
  } catch (err) {
    console.error(err);
    showErr('Could not save. Check your connection and try again.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save To-Let';
  }
}
