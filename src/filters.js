// Filter panel: BHK, rent range, listing type, furnished, food, gender,
// and "available only". Live-applies on change via a callback.
import { isAvailable } from './pins.js';

const $ = (sel) => document.querySelector(sel);

const state = {
  bhk: new Set(), // empty = all
  pinKind: new Set(), // empty = all ("rent" paid / "tolet" spotted)
  rentMin: null,
  rentMax: null,
  listingType: 'any',
  furnished: 'any',
  food: 'any',
  gender: 'any',
  availableOnly: false,
};

let onChange = () => {};

export function setupFilters(changeCallback) {
  onChange = changeCallback;

  $('#filter-toggle').addEventListener('click', () => {
    const panel = $('#filter-panel');
    panel.hidden = !panel.hidden;
  });

  // BHK chips (multi-select).
  $('#bhk-chips').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-bhk]');
    if (!btn) return;
    const v = btn.dataset.bhk;
    if (state.bhk.has(v)) {
      state.bhk.delete(v);
      btn.classList.remove('active');
    } else {
      state.bhk.add(v);
      btn.classList.add('active');
    }
    onChange();
  });

  // Type chips (Rent paid / To-Let; multi-select).
  $('#kind-chips').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-kind]');
    if (!btn) return;
    const v = btn.dataset.kind;
    if (state.pinKind.has(v)) {
      state.pinKind.delete(v);
      btn.classList.remove('active');
    } else {
      state.pinKind.add(v);
      btn.classList.add('active');
    }
    onChange();
  });

  $('#f-rent-min').addEventListener('input', (e) => {
    state.rentMin = e.target.value === '' ? null : Number(e.target.value);
    onChange();
  });
  $('#f-rent-max').addEventListener('input', (e) => {
    state.rentMax = e.target.value === '' ? null : Number(e.target.value);
    onChange();
  });
  $('#f-listing').addEventListener('change', (e) => {
    state.listingType = e.target.value;
    onChange();
  });
  $('#f-furnished').addEventListener('change', (e) => {
    state.furnished = e.target.value;
    onChange();
  });
  $('#f-food').addEventListener('change', (e) => {
    state.food = e.target.value;
    onChange();
  });
  $('#f-gender').addEventListener('change', (e) => {
    state.gender = e.target.value;
    onChange();
  });
  $('#f-available').addEventListener('change', (e) => {
    state.availableOnly = e.target.checked;
    onChange();
  });

  $('#f-reset').addEventListener('click', resetFilters);
}

function resetFilters() {
  state.bhk.clear();
  state.pinKind.clear();
  state.rentMin = null;
  state.rentMax = null;
  state.listingType = 'any';
  state.furnished = 'any';
  state.food = 'any';
  state.gender = 'any';
  state.availableOnly = false;

  document
    .querySelectorAll('#filter-panel .chips button.active')
    .forEach((b) => b.classList.remove('active'));
  $('#f-rent-min').value = '';
  $('#f-rent-max').value = '';
  $('#f-listing').value = 'any';
  $('#f-furnished').value = 'any';
  $('#f-food').value = 'any';
  $('#f-gender').value = 'any';
  $('#f-available').checked = false;
  onChange();
}

export function matchesFilters(pin) {
  if (state.bhk.size && !state.bhk.has(pin.bhk)) return false;
  if (state.pinKind.size && !state.pinKind.has(pin.pinKind)) return false;
  if (state.rentMin != null && pin.rentAmount < state.rentMin) return false;
  if (state.rentMax != null && pin.rentAmount > state.rentMax) return false;
  if (state.listingType !== 'any' && pin.listingType !== state.listingType) return false;
  if (state.furnished !== 'any' && pin.furnished !== state.furnished) return false;
  if (state.food === 'veg' && pin.prefFood !== 'veg') return false;
  // Gender: show flats that accept the chosen gender (its own pref, or "any").
  if (state.gender !== 'any' && pin.prefGender !== state.gender && pin.prefGender !== 'any') return false;
  if (state.availableOnly && !isAvailable(pin)) return false;
  return true;
}
