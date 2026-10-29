// Loads the Google Maps JS API and creates the dark Patna map.
import { GOOGLE_MAPS_KEY, GOOGLE_MAP_ID, MAP_CENTER, MAP_ZOOM } from './config.js';

// Official dynamic-library bootstrap loader. Installs google.maps.importLibrary
// so we can lazily await just the libraries we need. Runs once.
let bootstrapped = false;
function bootstrapMapsApi() {
  if (bootstrapped) return;
  bootstrapped = true;
  ((g) => {
    let h,
      a,
      k,
      p = 'The Google Maps JavaScript API',
      c = 'google',
      l = 'importLibrary',
      q = '__ib__',
      m = document,
      b = window;
    b = b[c] || (b[c] = {});
    const d = b.maps || (b.maps = {}),
      r = new Set(),
      e = new URLSearchParams(),
      u = () =>
        h ||
        (h = new Promise(async (f, n) => {
          a = m.createElement('script');
          e.set('libraries', [...r] + '');
          for (k in g)
            e.set(
              k.replace(/[A-Z]/g, (t) => '_' + t[0].toLowerCase()),
              g[k]
            );
          e.set('callback', c + '.maps.' + q);
          a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
          d[q] = f;
          a.onerror = () => (h = n(Error(p + ' could not load.')));
          a.nonce = m.querySelector('script[nonce]')?.nonce || '';
          m.head.append(a);
        }));
    d[l]
      ? console.warn(p + ' only loads once. Ignoring:', g)
      : (d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)));
  })({ key: GOOGLE_MAPS_KEY, v: 'weekly' });
}

// Create and return the dark map centred on Patna.
export async function createMap(container) {
  bootstrapMapsApi();
  const { Map } = await google.maps.importLibrary('maps');
  return new Map(container, {
    center: MAP_CENTER,
    zoom: MAP_ZOOM,
    mapId: GOOGLE_MAP_ID, // Advanced Markers come from the cloud Map ID
    colorScheme: 'DARK', // dark base map; only applied at creation time (ColorScheme enum lives in "core")
    disableDefaultUI: true,
    zoomControl: true,
    gestureHandling: 'greedy', // one-finger pan/zoom on mobile
    clickableIcons: false,
  });
}
