// Central config for Patna Rent Map. One place for all tunable constants.

// --- Keys (from .env via Vite) ---
export const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;
export const GOOGLE_MAP_ID = import.meta.env.VITE_GOOGLE_MAP_ID;

// --- Map ---
export const MAP_CENTER = { lat: 25.5941, lng: 85.1376 }; // Patna
export const MAP_ZOOM = 12;

// Patna bounding box. Used to bias search, clamp pins, and mirror the
// Firestore security rules. Roughly covers Patna district.
export const PATNA_BOUNDS = {
  south: 25.35,
  west: 84.9,
  north: 25.75,
  east: 85.45,
};

// --- Privacy / validation ---
export const LAT_LNG_DECIMALS = 3; // round to ~100 m before saving
export const RENT_MIN = 500;
export const RENT_MAX = 500000;
export const FEEDBACK_MAX = 500;
export const PARKING_MAX = 20; // max car spots the form/rules accept

// --- Images ---
export const MAX_IMAGES = 5;
export const MAX_IMAGE_MB = 5;

// --- "Above avg" badge ---
export const ABOVE_AVG_RADIUS_KM = 2;
export const ABOVE_AVG_MIN_COMPARABLES = 4;
export const ABOVE_AVG_RATIO = 1.3;

// --- Pins / rendering ---
export const HIDE_REPORT_THRESHOLD = 3; // pins with this many reports are hidden
export const PIN_KIND_COLORS = {
  rent: '#39d98a', // someone shares what they pay
  tolet: '#f5a623', // spotted To-Let board
};

// --- Enums (single source of truth for form + rules + rendering) ---
export const PIN_KINDS = ['rent', 'tolet'];
export const LISTING_TYPES = ['whole_flat', 'room', 'flatmate'];
export const BHK_OPTIONS = ['1RK', '1', '2', '3', '4', '5+'];
export const FURNISHED_OPTIONS = ['unfurnished', 'semi', 'full'];
export const AVAILABLE_FROM_OPTIONS = ['asap', 'next_month', 'flexible'];
export const OCCUPANT_TYPES = ['family', 'bachelors', 'any'];
export const FOOD_PREFS = ['veg', 'any'];
export const GENDER_PREFS = ['male', 'female', 'any'];
export const REPORT_REASONS = ['wrong_rent', 'not_available', 'fake', 'other'];
