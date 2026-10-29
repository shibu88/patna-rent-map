// Cluster pins with a custom bubble: "N flats" and, when any are available,
// "X AVBL" with a green glow.
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { isAvailable } from './pins.js';

const clusterRenderer = {
  render({ count, position, markers }) {
    const availCount = markers.reduce(
      (n, mk) => n + (mk.__pin && isAvailable(mk.__pin) ? 1 : 0),
      0
    );

    const el = document.createElement('div');
    el.className = 'cluster-bubble' + (availCount ? ' has-avbl' : '');
    el.innerHTML =
      `<span class="cluster-count">${count} flats</span>` +
      (availCount ? `<span class="cluster-avbl">${availCount} AVBL</span>` : '');

    return new google.maps.marker.AdvancedMarkerElement({
      position,
      content: el,
      zIndex: 1000 + count, // keep bigger clusters on top
    });
  },
};

export function clusterPins(map, markers) {
  return new MarkerClusterer({ map, markers, renderer: clusterRenderer });
}
