// App entry point. Step 1: dark Patna map + Places search bar.
import './style.css';
import { GOOGLE_MAPS_KEY, GOOGLE_MAP_ID } from './config.js';
import { createMap } from './map.js';
import { setupSearch } from './search.js';
import { setupForm } from './form.js';
import { setupToolbar } from './toolbar.js';
import { setupSpot } from './spot.js';
import {
  loadPins,
  createPinMarkers,
  isAboveAvg,
  getUserInteraction,
  ratePin,
  reportPin,
} from './pins.js';
import { clusterPins } from './cluster.js';
import { setupDetail, showDetail, hideDetail } from './detail.js';
import { setupFilters, matchesFilters } from './filters.js';
import { isFirebaseConfigured } from './firebase.js';

let allPins = [];
let clusterer = null;

async function renderPins(map) {
  try {
    allPins = await loadPins();
    console.info(`Loaded ${allPins.length} pin(s).`);
    clusterer = clusterPins(map, []);
    setupFilters(() => applyFilters());
    await applyFilters();
  } catch (err) {
    console.error('Could not load pins:', err);
  }
}

async function applyFilters() {
  if (!clusterer) return;
  const filtered = allPins.filter(matchesFilters);
  const markers = await createPinMarkers(filtered, openDetail);
  clusterer.clearMarkers();
  clusterer.addMarkers(markers);
  updateResultCount(filtered.length, allPins.length);
}

// Re-read all pins and re-render markers (used after a new pin is saved).
async function reloadPins() {
  allPins = await loadPins();
  await applyFilters();
}

async function openDetail(pin) {
  const aboveAvg = isAboveAvg(pin, allPins);
  let userInteraction = { rating: null, reported: null };
  try {
    userInteraction = await getUserInteraction(pin.id);
  } catch (err) {
    console.error('Could not read your previous rating/report:', err);
  }
  showDetail(pin, {
    aboveAvg,
    userInteraction,
    onRate: (rating) => handleRate(pin, rating),
    onReport: (reason) => handleReport(pin, reason),
  });
}

async function handleRate(pin, rating) {
  try {
    await ratePin(pin.id, rating);
  } catch (err) {
    console.error(err);
    alert('Could not save your rating.');
    return;
  }
  await refreshAfterInteraction(pin.id);
}

async function handleReport(pin, reason) {
  try {
    await reportPin(pin.id, reason);
  } catch (err) {
    console.error(err);
    alert('Could not submit your report.');
    return;
  }
  await refreshAfterInteraction(pin.id);
}

// Reload data (so averages / report counts / hiding update) and refresh the panel.
async function refreshAfterInteraction(pinId) {
  allPins = await loadPins();
  await applyFilters();
  const updated = allPins.find((p) => p.id === pinId);
  if (updated) openDetail(updated);
  else hideDetail(); // pin now hidden (3+ reports)
}

function updateResultCount(shown, total) {
  const el = document.getElementById('result-count');
  if (el) el.textContent = shown === total ? `${total} flats` : `${shown} of ${total}`;
}

function showConfigError(msg) {
  const el = document.getElementById('app-error');
  if (el) {
    el.textContent = msg;
    el.hidden = false;
  }
  console.error(msg);
}

async function init() {
  if (!GOOGLE_MAPS_KEY || !GOOGLE_MAP_ID) {
    showConfigError(
      'Missing Google Maps config. Fill VITE_GOOGLE_MAPS_KEY and VITE_GOOGLE_MAP_ID in .env, then restart the dev server.'
    );
    return;
  }

  try {
    const map = await createMap(document.getElementById('map'));
    await setupSearch(document.getElementById('search'), map);
    setupForm(map, reloadPins);
    setupToolbar(map);
    setupSpot(map, reloadPins);
    setupDetail();

    if (isFirebaseConfigured()) {
      await renderPins(map);
    } else {
      console.warn('Firebase keys missing in .env — the form opens but saving/loading is disabled until VITE_FIREBASE_* are set.');
    }
  } catch (err) {
    showConfigError('Could not load the map. Check your Google Maps key/Map ID and browser console.');
    console.error(err);
  }
}

init();
