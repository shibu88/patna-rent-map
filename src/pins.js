// Load all pins/ratings/reports once and join them in the browser,
// then build custom Advanced Markers.
import { collection, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, ensureSignedIn } from './firebase.js';
import {
  HIDE_REPORT_THRESHOLD,
  PIN_KIND_COLORS,
  ABOVE_AVG_RADIUS_KM,
  ABOVE_AVG_MIN_COMPARABLES,
  ABOVE_AVG_RATIO,
} from './config.js';

// --- Data load + join ---
export async function loadPins() {
  const [pinsSnap, ratingsSnap, reportsSnap] = await Promise.all([
    getDocs(collection(db, 'pins')),
    getDocs(collection(db, 'ratings')),
    getDocs(collection(db, 'reports')),
  ]);

  // Average rating per pin.
  const ratingAgg = {}; // pinId -> { sum, count }
  ratingsSnap.forEach((d) => {
    const r = d.data();
    if (!r || typeof r.rating !== 'number' || !r.pinId) return;
    const a = ratingAgg[r.pinId] || (ratingAgg[r.pinId] = { sum: 0, count: 0 });
    a.sum += r.rating;
    a.count += 1;
  });

  // Report count per pin.
  const reportAgg = {}; // pinId -> count
  reportsSnap.forEach((d) => {
    const r = d.data();
    if (!r || !r.pinId) return;
    reportAgg[r.pinId] = (reportAgg[r.pinId] || 0) + 1;
  });

  const pins = [];
  pinsSnap.forEach((d) => {
    const data = d.data();
    const reportCount = reportAgg[d.id] || 0;
    if (reportCount >= HIDE_REPORT_THRESHOLD) return; // hidden by default
    const agg = ratingAgg[d.id];
    pins.push({
      id: d.id,
      ...data,
      avgRating: agg ? agg.sum / agg.count : 0,
      ratingCount: agg ? agg.count : 0,
      reportCount,
    });
  });
  return pins;
}

// --- Formatting helpers (shared with the detail panel) ---
const trim1 = (x) => (Math.round(x * 10) / 10).toString();

export function formatRent(n) {
  if (!n || n <= 0) return '—';
  if (n >= 100000) return `${trim1(n / 100000)}L`;
  if (n >= 1000) return `${trim1(n / 1000)}K`;
  return String(n);
}

export function bhkLabel(bhk) {
  return bhk === '1RK' ? '1RK' : `${bhk}BHK`;
}

// Available = marked ASAP, or a date that is today or later. null = occupied.
export function isAvailable(pin) {
  const a = pin.availableFrom;
  if (!a) return false;
  if (a === 'asap') return true;
  const t = Date.parse(a);
  return !Number.isNaN(t) && t >= Date.now() - 86400000;
}

// --- Ratings & reports (one per user per pin; doc id = pinId_uid) ---
export async function ratePin(pinId, rating) {
  const user = await ensureSignedIn();
  await setDoc(doc(db, 'ratings', `${pinId}_${user.uid}`), {
    pinId,
    uid: user.uid,
    rating,
    createdAt: serverTimestamp(),
  });
}

export async function reportPin(pinId, reason) {
  const user = await ensureSignedIn();
  await setDoc(doc(db, 'reports', `${pinId}_${user.uid}`), {
    pinId,
    uid: user.uid,
    reason,
    createdAt: serverTimestamp(),
  });
}

// What the current user has already done to this pin.
export async function getUserInteraction(pinId) {
  const user = await ensureSignedIn();
  const [rSnap, repSnap] = await Promise.all([
    getDoc(doc(db, 'ratings', `${pinId}_${user.uid}`)),
    getDoc(doc(db, 'reports', `${pinId}_${user.uid}`)),
  ]);
  return {
    rating: rSnap.exists() ? rSnap.data().rating : null,
    reported: repSnap.exists() ? repSnap.data().reason : null,
  };
}

// --- "Above avg" badge: rent > ratio × median of same-BHK pins within radius ---
function haversineKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function median(nums) {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function isAboveAvg(pin, allPins) {
  const comps = allPins.filter(
    (p) => p.id !== pin.id && p.bhk === pin.bhk && haversineKm(pin, p) <= ABOVE_AVG_RADIUS_KM
  );
  if (comps.length < ABOVE_AVG_MIN_COMPARABLES) return false;
  return pin.rentAmount > ABOVE_AVG_RATIO * median(comps.map((p) => p.rentAmount));
}

// --- Marker building ---
let markerLib = null;
async function getMarkerLib() {
  return markerLib || (markerLib = await google.maps.importLibrary('marker'));
}

export async function createPinMarkers(pins, onClick) {
  const { AdvancedMarkerElement } = await getMarkerLib();
  return pins.map((pin) => {
    // Wrapper is a map-pin: the label sits on top, a tail points down so its
    // tip (the marker's bottom-centre anchor) lands on the exact coordinate.
    const el = document.createElement('div');
    el.className = 'pin-marker';
    el.style.setProperty('--pin-color', PIN_KIND_COLORS[pin.pinKind] || PIN_KIND_COLORS.rent);

    let inner = `<span class="pin-main">${bhkLabel(pin.bhk)} · ₹${formatRent(pin.rentAmount)}</span>`;
    if (pin.ratingCount) inner += `<span class="pin-star">★ ${pin.avgRating.toFixed(1)}</span>`;
    if (pin.reportCount) inner += `<span class="pin-reports">${pin.reportCount}</span>`;
    el.innerHTML = `<div class="pin-label">${inner}</div>`;

    const marker = new AdvancedMarkerElement({
      position: { lat: pin.lat, lng: pin.lng },
      content: el,
    });
    marker.__pin = pin; // used by the cluster renderer and click handler
    marker.addListener('click', () => onClick(pin));
    return marker;
  });
}
