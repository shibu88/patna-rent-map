// Approximate Patna Metro alignment, hand-placed from public knowledge of the
// published two-corridor plan. NOT survey-accurate and NOT for navigation — a
// rough visual guide only. Patna Metro is still under construction. Swap this
// file for an official GeoJSON when one is available.
//
// Each station row is [name, lng, lat] (GeoJSON order: longitude first).

const CORRIDOR_1 = [
  // East–West (Bailey Road corridor): Danapur Cantonment → Khemni Chak.
  ['Danapur Cantonment', 85.045, 25.6],
  ['Saguna More', 85.065, 25.603],
  ['RPS More', 85.082, 25.606],
  ['Patliputra', 85.098, 25.609],
  ['Rukanpura', 85.11, 25.611],
  ['Raja Bazar', 85.12, 25.612],
  ['Patna Zoo', 85.128, 25.609],
  ['Vikas Bhawan', 85.135, 25.611],
  ['Vidyut Bhawan', 85.142, 25.61],
  ['Patna Junction', 85.138, 25.602],
  ['Mithapur', 85.145, 25.593],
  ['Ramkrishna Nagar', 85.16, 25.585],
  ['Jaganpura', 85.172, 25.582],
  ['Khemni Chak', 85.178, 25.593],
];

const CORRIDOR_2 = [
  // Patna Junction → New ISBT (Bairiya), via Gandhi Maidan and Rajendra Nagar.
  ['Patna Junction', 85.138, 25.602],
  ['Akashvani', 85.14, 25.607],
  ['Gandhi Maidan', 85.144, 25.617],
  ['PMCH', 85.155, 25.62],
  ['Patna University', 85.165, 25.622],
  ['Moin ul Haq Stadium', 85.168, 25.615],
  ['Rajendra Nagar', 85.165, 25.608],
  ['Malahi Pakri', 85.17, 25.602],
  ['Khemni Chak', 85.178, 25.593],
  ['Bhoothnath', 85.19, 25.595],
  ['Zero Mile', 85.2, 25.598],
  ['New ISBT', 85.212, 25.6],
];

// Line colour per corridor (used by the overlay styler).
export const METRO_COLORS = {
  'corridor-1': '#e4572e', // red line
  'corridor-2': '#2d7ff9', // blue line
};

// Build a LineString (the alignment) plus a Point per station.
function corridorFeatures(stations, corridor) {
  const line = {
    type: 'Feature',
    properties: { kind: 'line', corridor },
    geometry: {
      type: 'LineString',
      coordinates: stations.map(([, lng, lat]) => [lng, lat]),
    },
  };
  const points = stations.map(([name, lng, lat]) => ({
    type: 'Feature',
    properties: { kind: 'station', corridor, name },
    geometry: { type: 'Point', coordinates: [lng, lat] },
  }));
  return [line, ...points];
}

export const METRO_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    ...corridorFeatures(CORRIDOR_1, 'corridor-1'),
    ...corridorFeatures(CORRIDOR_2, 'corridor-2'),
  ],
};
