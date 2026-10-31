# Patna Rent Map

A crowdsourced map of flat rents in Patna. Tenants and owners pin what a flat rents for; visitors browse, filter, rate and report pins. Modelled on the architecture of bengaluru.rent, but with our own data and our own code. Never fetch from or copy data from bengaluru.rent.

## Workflow

1. First, think through the problem. Read the codebase and write a plan in tasks/todo.md.
2. The plan should be a checklist of todo items.
3. Check in with me before starting work. I'll verify the plan.
4. Then complete the todos one by one, marking them off as you go.
5. At every step, give me a high-level explanation of what you changed.
6. Keep every change simple and minimal. Avoid big rewrites.
7. At the end, add a review section in todo.md summarizing the changes.
8. Work one build-order step at a time (see "Build order" below) and stop after each so I can test it in the browser.
9. Before any git commit, confirm `.env` is listed in `.gitignore` and is not staged.

## Stack

- Vite + vanilla JavaScript (ES modules), no framework
- Google Maps JavaScript API with a cloud Map ID (dark style), Advanced Markers (`AdvancedMarkerElement`), not the deprecated `google.maps.Marker`
- Google Places Autocomplete (Places API New) for the search bar, restricted to India and biased to Patna
- `@googlemaps/markerclusterer` for clustering
- Firebase: Firestore (data) and Authentication (anonymous sign-in for writes; Google sign-in optional later). Stay on the free Spark plan: no Cloud Functions.
- Hosted on Netlify (build `npm run build`, publish `dist`)

## Config

- Keys live in `.env` as `VITE_GOOGLE_MAPS_KEY`, `VITE_GOOGLE_MAP_ID`, `VITE_FIREBASE_*`. Commit `.env.example`, never `.env`.
- Google Maps key and Map ID come from Google Cloud project `patna-rent-map-512807`. Firebase is the separate project `patna-rent-map`.
- Map centre: Patna, lat 25.5941, lng 85.1376, zoom 12.

## Data model (Firestore)

### `pins/{autoId}`
| field | type | notes |
|---|---|---|
| lat, lng | number | **rounded to 3 decimals before saving** (privacy, ~100 m) |
| pinKind | "rent" \| "tolet" | rent = someone shares what they pay; tolet = spotted To-Let board |
| listingType | "whole_flat" \| "room" \| "flatmate" | |
| bhk | "1RK" \| "1" \| "2" \| "3" \| "4" \| "5+" | |
| rentAmount | number | monthly, INR |
| rentPerRoom | number \| null | for room/flatmate |
| depositMonths | number \| null | |
| sqft | number \| null | |
| parking | number \| null | car spots (0 = none); 0–20 |
| availableFrom | "asap" \| "next_month" \| "flexible" \| ISO date \| null | null = occupied, not available |
| furnished | "unfurnished" \| "semi" \| "full" \| null | |
| gated, petFriendly, maintenanceIncluded | boolean \| null | petFriendly kept in model; no UI (Pets row removed) |
| occupantType | "family" \| "bachelors" \| "any" | |
| prefFood | "veg" \| "any" | |
| prefGender | "male" \| "female" \| "any" | |
| locality, society | string | |
| feedback | string | max 500 chars |
| ownerUid | string | auth uid of creator |
| createdAt, updatedAt | timestamp | server timestamps |

### `ratings/{pinId}_{uid}`
`{ pinId, uid, rating (1-5), createdAt }`. Doc id prevents rating the same pin twice.

### `reports/{pinId}_{uid}`
`{ pinId, uid, reason ("wrong_rent" | "not_available" | "fake" | "other"), createdAt }`. Doc id prevents double reports.

### `contacts/{autoId}`
`{ pinId, phone, email, ownerUid, createdAt }`. Private lister contact details collected by the "Add Your Flat" form. **Not publicly readable** — only the owner can read their own; never shown on the map. Kept separate from `pins` (which is world-readable) so phone/email stay private.

### `comments/{autoId}`
`{ pinId, uid, text (1–500 chars), createdAt }`. Public comment thread shown in the pin detail panel. Anyone signed-in can create; no updates; author can delete. Loaded per-pin on panel open (queried by `pinId`, sorted newest-first client-side — no composite index needed).

## Architecture

- On page load, read **all** pins, ratings and reports once (three collection reads), then join in the browser by `pinId`: average rating per pin, report count per pin. No per-viewport queries.
- Clustering, filtering and badges all run client-side.
- Cluster bubble shows "N flats" and, when any are available, "X AVBL" (green glow).
- Single pin label: "2BHK · 12K" (format rent as K / L). Colour by pinKind. Show ★ average and a red "N reports" chip when present.
- "Above avg" badge: compare with pins of the same `bhk` within `ABOVE_AVG_RADIUS_KM` (2) using haversine; require at least `ABOVE_AVG_MIN_COMPARABLES` (4); flag if rent > `ABOVE_AVG_RATIO` (1.3) × median. Keep these as named constants in one config file.
- Pins with 3+ reports are hidden by default.
- Later (not now): if Firestore reads grow, publish a single aggregated JSON snapshot (like a `get-pins` endpoint) and load that instead of three collections.

## Security rules (firestore.rules)

- Anyone can read `pins`, `ratings`, `reports`.
- Create requires `request.auth != null`; `ownerUid` must equal `request.auth.uid`; validate types, enums, rent range (500–500000), feedback length, and that lat/lng fall within a Patna bounding box.
- Update/delete a pin only by its owner.
- `ratings` and `reports` doc id must equal `pinId + "_" + request.auth.uid`; no updates to reports.
- `contacts` is **not** publicly readable: read only by the owner (`ownerUid == uid`); signed-in create with validation; no update/delete.
- `comments` is publicly readable; signed-in create (`uid == request.auth.uid`, text 1–500, server `createdAt`); no update; author-only delete.

## Build order (do one step at a time; stop and let me test each)

1. Vite scaffold, `.env.example`, dark map centred on Patna, Places search bar.
2. Firebase init, anonymous auth, "List My Flat" form that saves a pin (with lat/lng from "Use GPS" or "Pick on map").
3. Load all pins, custom Advanced Markers, clustering.
4. Filter panel (BHK, rent range, listing type, furnished, food/gender, available only).
5. Ratings, reports, "Above avg" badge.
6. `firestore.rules` + `firebase deploy --only firestore:rules`, then Netlify deploy.

## Conventions

- Mobile-first layout; must work well on a phone.
- Small modules: `map.js`, `pins.js`, `cluster.js`, `filters.js`, `form.js`, `firebase.js`, `config.js`.
- No secrets in code. Explain any new dependency before adding it.