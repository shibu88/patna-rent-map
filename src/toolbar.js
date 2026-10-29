// Right-side map toolbar: Spot a To-Let, Metro, Satellite, Green Cover.
// Steps 7a–7b wire Satellite, Metro and Green Cover. Spot a To-Let lands in 7c.
import { toggleMetro, toggleGreen } from './overlays.js';

const $ = (sel) => document.querySelector(sel);

export function setupToolbar(map) {
  setupSatellite(map);
  setupToggle('#tb-metro', () => toggleMetro(map));
  setupToggle('#tb-green', () => toggleGreen(map));
}

// Generic on/off button: `action` returns the new visible state; reflect it.
function setupToggle(sel, action) {
  const btn = $(sel);
  if (!btn) return;
  btn.addEventListener('click', () => {
    const on = action();
    btn.classList.toggle('active', on);
  });
}

// Satellite: toggle the base map between the dark roadmap and hybrid (satellite
// with labels). The dark style (Map ID + colorScheme) returns when we switch back.
function setupSatellite(map) {
  const btn = $('#tb-satellite');
  if (!btn) return;
  let on = false;
  btn.addEventListener('click', () => {
    on = !on;
    map.setMapTypeId(on ? 'hybrid' : 'roadmap');
    btn.classList.toggle('active', on);
  });
}
