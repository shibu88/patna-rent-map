// Approximate green cover for Patna: major parks / green spaces as rough
// rectangles, hand-placed from public knowledge. NOT survey-accurate — a visual
// aid only. Swap for an official parks GeoJSON when available.

// Rough rectangle polygon around a centre (dLng/dLat are half-widths in degrees).
function rect(name, lng, lat, dLng, dLat) {
  return {
    type: 'Feature',
    properties: { name },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [lng - dLng, lat - dLat],
          [lng + dLng, lat - dLat],
          [lng + dLng, lat + dLat],
          [lng - dLng, lat + dLat],
          [lng - dLng, lat - dLat],
        ],
      ],
    },
  };
}

export const GREEN_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    rect('Eco Park (Rajdhani Vatika)', 85.108, 25.611, 0.004, 0.0022),
    rect('Sanjay Gandhi Jaivik Udyan (Patna Zoo)', 85.128, 25.607, 0.006, 0.004),
    rect('Gandhi Maidan', 85.1445, 25.6175, 0.0045, 0.003),
    rect('Buddha Smriti Park', 85.1375, 25.6035, 0.0022, 0.0016),
    rect('S.K. Memorial / Energy Park', 85.137, 25.619, 0.0025, 0.0018),
  ],
};
