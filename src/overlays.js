// Map overlays toggled from the toolbar: Patna Metro (approx.) and Green Cover
// (approx.). Each lives on its own google.maps.Data layer so they toggle
// independently of each other and of the pins. Built lazily on first use.
import { METRO_GEOJSON, METRO_COLORS } from './data/patna-metro.js';
import { GREEN_GEOJSON } from './data/patna-green.js';

let metroLayer = null;
let greenLayer = null;

function buildMetro() {
  const layer = new google.maps.Data();
  layer.addGeoJson(METRO_GEOJSON);
  layer.setStyle((feature) => {
    const color = METRO_COLORS[feature.getProperty('corridor')] || '#e4572e';
    if (feature.getProperty('kind') === 'station') {
      return {
        title: feature.getProperty('name'), // hover tooltip
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 4.5,
          fillColor: '#ffffff',
          fillOpacity: 1,
          strokeColor: color,
          strokeWeight: 2,
        },
        zIndex: 20,
      };
    }
    return { strokeColor: color, strokeWeight: 4, strokeOpacity: 0.9, zIndex: 10 };
  });
  return layer;
}

function buildGreen() {
  const layer = new google.maps.Data();
  layer.addGeoJson(GREEN_GEOJSON);
  layer.setStyle({
    fillColor: '#2ecc71',
    fillOpacity: 0.28,
    strokeColor: '#2ecc71',
    strokeWeight: 1.2,
    strokeOpacity: 0.85,
    clickable: false,
    zIndex: 5,
  });
  return layer;
}

// Toggle helpers return the new state (true = now visible) so the toolbar can
// reflect it with an active highlight.
export function toggleMetro(map) {
  if (!metroLayer) metroLayer = buildMetro();
  const show = metroLayer.getMap() == null;
  metroLayer.setMap(show ? map : null);
  return show;
}

export function toggleGreen(map) {
  if (!greenLayer) greenLayer = buildGreen();
  const show = greenLayer.getMap() == null;
  greenLayer.setMap(show ? map : null);
  return show;
}
