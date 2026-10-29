// Top search bar using Places API (New) PlaceAutocompleteElement.
// Restricted to India, biased to Patna; moves the map to the chosen place.
import { PATNA_BOUNDS, MAP_ZOOM } from './config.js';

export async function setupSearch(container, map) {
  const { PlaceAutocompleteElement } = await google.maps.importLibrary('places');

  const autocomplete = new PlaceAutocompleteElement({
    includedRegionCodes: ['in'], // India only
    locationBias: PATNA_BOUNDS, // bias results toward Patna
  });
  autocomplete.id = 'place-autocomplete';
  container.appendChild(autocomplete);

  // gmp-select fires when the user picks a prediction.
  autocomplete.addEventListener('gmp-select', async ({ placePrediction }) => {
    const place = placePrediction.toPlace();
    await place.fetchFields({ fields: ['location', 'viewport'] });

    if (place.viewport) {
      map.fitBounds(place.viewport);
    } else if (place.location) {
      map.setCenter(place.location);
      map.setZoom(Math.max(map.getZoom(), MAP_ZOOM + 2));
    }
  });

  return autocomplete;
}
