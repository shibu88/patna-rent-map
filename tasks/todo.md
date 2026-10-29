# Patna Rent Map — Tasks

A crowdsourced map of flat rents in Patna. Build one step at a time; stop after each for browser testing.

## Step 1 — Scaffold + dark map + Places search  ← DONE (awaiting browser test)
- [x] Vite vanilla-JS scaffold (package.json, index.html, src/) in place
- [x] Add deps: `firebase`, `@googlemaps/markerclusterer` (installed; not yet imported)
- [x] `.gitignore` (`.env`, `node_modules`, `dist`)
- [x] `.env.example` with all `VITE_*` keys blank + comments
- [x] `src/config.js` with constants (centre, zoom, bbox, rent range, above-avg, enums)
- [x] `index.html`: mobile-first viewport, map container, top search bar
- [x] `src/map.js`: async-load Maps JS API with Map ID, dark map centred on Patna, zoom 12
- [x] Places `PlaceAutocompleteElement` — India-only, Patna-biased; move map on select (`src/search.js`)
- [x] `src/main.js` wiring + mobile-first CSS (`src/style.css`)
- [x] `npm install`, `npm run build` (compiles), dev server boots — user to fill `.env` + browser test

## Step 2 — Firebase + anon auth + "List My Flat" form  ← PLAN (awaiting approval)

Scope (from CLAUDE.md build order): initialise Firebase, sign in anonymously, and a
"List My Flat" form that saves a pin with lat/lng from "Use GPS" or "Pick on map".

Implemented in earlier turns (code complete, build passes):
- [x] `src/firebase.js` — init only when keys present (`isFirebaseConfigured`), exports `db`/`auth`, `ensureSignedIn()` (anonymous)
- [x] "+ List My Flat" button + bottom-sheet form markup in `index.html`
- [x] `src/form.js` — all data-model fields; location via "Use GPS" (geolocation) and "Pick on map" (tap to drop a draggable Advanced Marker)
- [x] lat/lng rounded to 3 decimals; client validation (rent range, feedback length, Patna bbox)
- [x] Save to `pins/{autoId}` with `ownerUid` + server `createdAt`/`updatedAt`
- [x] Wired into `src/main.js`; `npm run build` compiles
- [x] Bugfix: `[hidden]` now wins over CSS `display` (form open/close + pick-on-map), verified in browser

Open items to finish Step 2:
- [ ] **You:** set temporary Firestore rules allowing `write: if request.auth != null` (DB is in locked mode → "Missing or insufficient permissions"). Real validated rules land in Step 6.
- [ ] Confirm one end-to-end save succeeds (doc appears in `pins`) in the browser
- [~] (Optional polish) inline toast instead of `alert()` — SKIPPED per choice B (keep `alert()`)

Note: two fields were added beyond the original CLAUDE.md data model at your request —
`roomsAvailable` (dropdown 1–9, room/flatmate only) and `imageUrls` (Firebase Storage
upload, ≤5 images). See the revision notes in the Review section below.

## Step 3 — Load pins, custom Advanced Markers, clustering  ← CODE DONE (blocked on Firestore read rules for visual test)
- [x] src/pins.js (read all pins/ratings/reports once, join in browser; hide 3+ reports)
- [x] Custom marker label "2BHK · 12K" (rent K/L), colour by pinKind, ★ avg, red reports chip
- [x] src/cluster.js (markerclusterer: "N flats" + "X AVBL" green glow)
- [x] Pin detail panel on marker click (src/detail.js)
- [x] Wire into main.js; build passes
- [x] Deployed interim Firestore rules via CLI (`firebase deploy --only firestore:rules`) → reads/writes work
- [x] VERIFIED end-to-end in browser: save succeeds, `Loaded 1 pin(s)`, green "2BHK · ₹15K" marker renders, detail panel opens with correct fields

## Step 4 — Filter panel  ← DONE (verified in browser)
- [x] Filter toggle + panel markup in index.html (BHK chips, rent range, listing, furnished, food, gender, available-only)
- [x] src/filters.js (state + matchesFilters + wiring, live-apply, Reset)
- [x] main.js: keeps allPins, re-clusters filtered subset on change, shows result count
- [x] Verified: BHK multi-select (0 of 1 → 1 flats), rent max (0 of 1), Reset (back to 1 flats)

## Step 5 — Ratings, reports, "Above avg" badge  ← DONE (verified in browser)
- [x] pins.js: ratePin / reportPin / getUserInteraction (doc id pinId_uid); isAboveAvg (haversine + median)
- [x] detail.js: star rating (1-5) + report reason buttons, reflect user's existing rating/report
- [x] "Above avg" badge in detail (1.3× median same-BHK within 2 km, min 4 comparables) — code done
- [x] main.js: open detail via handler, refresh data after rate/report
- [x] Verified: rated 4★ → ★ 4.0 (1) badge + marker ★ 4.0; reported → "1 report" badge, marker chip "1", buttons replaced by "Reported: Not available"

## Step 6 — Firestore rules + deploy  ← DONE (live)
- [x] Hardened firestore.rules (full validation, owner-only edit/delete, one rating/report per user via doc id)
- [x] Deployed via `firebase deploy --only firestore:rules` (compiled OK)
- [x] Verified: valid pin still saves under strict rules (3BHK/₹22000); reads/rate/report still work
- [x] netlify.toml (build npm run build, publish dist, NODE_VERSION 20, SPA redirect); .netlify gitignored
- [x] Created site + deployed to production: https://patna-rent-map.netlify.app (deploy 6ae1128d8de00de189817c7a)
- [x] Live QA: dark map renders, 2 pins load, markers + ratings/report chip show, anonymous auth signs in on the live domain
- [ ] Follow-up (user, Google Cloud): restrict Maps API key to referrers localhost + patna-rent-map.netlify.app

## Step 7 — Right-side map toolbar (Spot a To-Let · Metro · Satellite · Green Cover)  ← PLAN (awaiting approval)

From the reference image: a floating vertical toolbar on the right edge of the map with four
icon+label buttons. "More" is intentionally skipped (keep it minimal). Each button is independent.

Design decisions (confirmed with user):
- Spot a To-Let = **both** a quick-add action **and** a to-let filter.
- Metro + Green Cover = **small hardcoded approximate GeoJSON** bundled as static data (public
  knowledge only; never fetched/copied from bengaluru.rent). Clearly labelled "approximate".
- More menu = skipped for now.

Constraint found in `firestore.rules`: every pin must carry all field keys, and `rentAmount`
(500–500000) + `locality` (len>0) are required. So quick-add collects BHK + rent + locality
(+ optional feedback) and defaults all other fields — **no rules change needed**.

### 7a — Toolbar shell + Satellite (simplest, test first)  ← DONE
- [x] `index.html`: added `#toolbar` with 4 icon+label buttons, right edge, vertically centred.
- [x] `src/style.css`: toolbar styling (dark rounded buttons, green active state).
- [x] `src/toolbar.js`: new module `setupToolbar(map)`; **Satellite** toggles roadmap(dark) ⇄ hybrid.
- [x] `src/main.js`: calls `setupToolbar(map)` after the map is created.
- [x] Build compiles.

### 7b — Metro + Green Cover overlays  ← DONE
- [x] `src/data/patna-metro.js`: approximate Corridor-1 & Corridor-2 lines + station points.
- [x] `src/data/patna-green.js`: approximate polygons for 5 major green spaces.
- [x] `src/overlays.js`: each on its own `google.maps.Data` layer; `toggleMetro()` / `toggleGreen()`.
- [x] Wired **Metro** and **Green Cover** buttons in `toolbar.js` (independent toggles + active state).
- [x] Build compiles.

### 7c — Spot a To-Let (quick-add + filter)  ← DONE (awaiting browser test)
- [x] `src/spot.js`: tap button → hint → tap map → short sheet (BHK, rent, locality; note optional)
      → saves pin with `pinKind:'tolet'`, `availableFrom:'asap'`, all other fields defaulted.
- [x] `index.html`: spot sheet + hint markup + a `Type: Rent paid / To-Let` chip group in filters.
- [x] `src/filters.js`: added `pinKind` filter state + `matchesFilters` rule; included in Reset.
- [x] `src/main.js`: passes a refresh callback so a new to-let pin appears immediately.
- [x] `src/style.css`: spot sheet + hint reuse the existing form/hint styles (extended selectors).
- [x] Build compiles; dev server serves the new markup.
- [ ] STOP — browser test: drop a to-let pin (orange marker), filter to To-Let only.

### 7d — Wrap up
- [x] `npm run build` compiles.
- [ ] Manual browser pass of all four buttons (user).
- [x] Review section updated.

## Review

### Bugfix — "Pick on map" has no next step and can't pinpoint (systematic debug, verified in browser)
- Reproduced in Chrome: the old flow closed the form, showed a one-line hint, and auto-reopened the
  form on the **first** map tap. Root causes: (1) no confirmation step — one imprecise tap ended
  picking, and on devices where a tap reads as a pan (`gestureHandling: 'greedy'`) the map just
  "bubbled around" and no pin dropped; (2) the form instantly re-covered the map, so the draggable
  marker couldn't be used to fine-tune; (3) the Cancel button hid the hint but never reopened the
  form, leaving the user stuck.
- Fix (`form.js` + `index.html` + `style.css`): Pick-on-map is now a real step. The control bar
  stays up with live coordinates and two buttons — **Cancel** and a primary **Use this location**
  (disabled until a pin is placed). The map stays open so you can tap again or **drag the marker**
  to pinpoint; the form only returns when you confirm. Cancel restores the pre-pick location; both
  buttons reliably reopen the form. Snapshot `prevChosen` supports the restore.
- Verified in Chrome end-to-end: Pick on map → bar shows "Use this location"; tap → red pin drops,
  text updates to "Pin at 25.586, 85.15 — drag it or tap again to adjust", button enables; Use this
  location → form reopens showing "Chosen: 25.586, 85.15". Build compiles.

### Step 7 (right-side map toolbar) — awaiting final browser test
- Added a floating right-side toolbar (`#toolbar`) with four icon+label buttons matching the
  reference image: **Spot a To-Let**, **Metro**, **Satellite**, **Green Cover** (no "More").
  Inline-SVG icons; dark rounded buttons that highlight green while active. `src/toolbar.js` is the
  new UI module, called from `main.js`.
- **Satellite** (`toolbar.js`): toggles the base map between the dark roadmap and `hybrid`
  (satellite + labels) via `map.setMapTypeId`. The dark Map-ID style returns on toggle-off.
- **Metro / Green Cover** (`src/overlays.js` + `src/data/patna-metro.js`, `src/data/patna-green.js`):
  each overlay renders on its own `google.maps.Data` layer, built lazily and toggled independently.
  Metro = two coloured corridor polylines (red/blue) + white station dots (name on hover).
  Green cover = translucent green polygons over 5 major parks. **Both datasets are approximate,
  hand-placed from public knowledge — clearly commented as not survey-accurate.** Swap in official
  GeoJSON later and the overlays pick it up unchanged.
- **Spot a To-Let** (`src/spot.js`): tap the button → "tap where you saw the board" hint → map tap
  drops a temp marker and opens a short bottom sheet (BHK, rent, locality required; note optional).
  Saves a pin with `pinKind:'tolet'`, `availableFrom:'asap'`, and every other field defaulted so the
  write passes the **existing** Firestore rules (no rules change). lat/lng rounded to 3 dp and
  Patna-bbox checked, same as the full form. On save it reloads pins so the orange marker appears.
- **To-Let filter**: new `Type: Rent paid / To-Let` chip group in the filter panel; `filters.js`
  gained a `pinKind` multi-select that mirrors the BHK chips and is cleared on Reset.
- CSS reuse: the spot sheet and hint reuse the existing `#form-overlay` / `#pick-hint` styles via
  extended selectors (no duplicated rules).
- `npm run build` compiles. Remaining: user browser test (drop a To-Let, toggle each overlay).

### Step 1 (scaffold + dark map + Places search)
- Scaffolded a Vite vanilla-JS project in place (no framework): `package.json`, `index.html`, `src/`.
- `src/config.js` holds every tunable constant (map centre/zoom, Patna bbox, rounding, rent range, above-avg thresholds, all enums) — one source of truth used by later steps and the rules.
- `src/map.js` loads the Maps JS API with the official dynamic-library bootstrap (key read from `.env`, never hard-coded) and creates a dark map via the cloud Map ID, centred on Patna at zoom 12, mobile-friendly (`gestureHandling: greedy`).
- `src/search.js` mounts a Places API (New) `PlaceAutocompleteElement`, restricted to India and biased to Patna; on select it moves the map to the chosen place.
- `src/main.js` wires it together and shows a friendly on-screen error if the Maps key/Map ID is missing. `src/style.css` is mobile-first dark.
- Keys isolated in `.env` (git-ignored); `.env.example` documents every var. `firebase` and `@googlemaps/markerclusterer` installed for later steps.
- Verified: `npm run build` compiles; dev server boots and serves the page.

### Step 2 (Firebase + anon auth + "List My Flat" form)
- `src/firebase.js` initialises Firebase only when keys are present (`isFirebaseConfigured`), exposes `db`/`auth`, and `ensureSignedIn()` resolves with the anonymous user (signs in if needed).
- `index.html` gains a floating "+ List My Flat" button and a mobile bottom-sheet form covering every field in the data model (pin kind, listing type, BHK, rent, rent/room, deposit, sqft, available-from, furnished, gated/pet/maintenance, occupant type, food/gender pref, locality, society, feedback).
- `src/form.js`: opens/closes the sheet, shows conditional fields (rent-per-room for room/flatmate, date picker when "on a date"), a 500-char feedback counter, location via "Use GPS" (geolocation) or "Pick on map" (tap to drop a draggable Advanced Marker). Lat/lng rounded to 3 decimals, validated against rent range, feedback length, and the Patna bounding box. On submit it anon-signs-in, stamps `ownerUid` + server `createdAt`/`updatedAt`, and `addDoc`s to `pins`.
- `src/main.js` wires the form after the map; warns in console if Firebase keys are missing (form still opens, save disabled).
- Verified: `npm run build` compiles; dev server optimised firebase deps with no errors.
- Needs for live test: fill `VITE_FIREBASE_*` in `.env`, enable Anonymous sign-in, create Firestore, and allow authenticated writes temporarily (real rules land in Step 6).

### Step 2 form revisions (per request)
- Removed the "Pin kind" UI row; `pinKind` still saved, defaulting to `"rent"` (kept in data model for marker colour + rules).
- Added "Rooms available" (dropdown 1–9, integers) shown only for room/flatmate, above "Rent per room" → saved as `roomsAvailable` (number|null).
- Added photo upload (Firebase Storage): file input + thumbnail previews, max 5 images, max 5 MB each; uploaded to `pin-images/{uid}/...` on submit, download URLs saved as `imageUrls` on the pin. New `storage` export in firebase.js; `MAX_IMAGES`/`MAX_IMAGE_MB` in config.js.
- Data-model additions beyond CLAUDE.md spec: `roomsAvailable`, `imageUrls` (will be reflected in Step 6 Firestore rules + a storage.rules file).

### Step 3 (load pins, markers, clustering) + rules unblock
- Root cause of the save/read failure: rules published in the Firebase console never went live on the `(default)` DB (reads AND writes denied). Confirmed via network (project `patna-rent-map`, `(default)`) and a live auth probe (valid anon user + token).
- Fix: added `firestore.rules` (interim: public read, signed-in write), `firebase.json`, `.firebaserc` (default project), and deployed with `firebase deploy --only firestore:rules`. Full per-field validation still to come in Step 6.
- `src/pins.js` loads pins/ratings/reports once, joins in browser, hides 3+ reports, builds Advanced Markers. `src/cluster.js` clusters with "N flats" / "X AVBL" glow. `src/detail.js` renders a tap-to-open detail sheet.
- Verified in Chrome: a saved 2BHK/₹15K pin renders as a green marker and its detail panel shows the correct fields.
- Note: the success `alert()` blocks browser automation (had to reload to dismiss); harmless for real users but a reason to revisit the toast later.

### Step 4 (filter panel)
- Added a "⚙ Filters" toggle + a collapsible panel in the top bar: BHK multi-select chips, min/max rent, listing type, furnished, food, gender, "available only", and Reset. A live result count ("N flats" / "X of N") sits next to the toggle.
- `src/filters.js` holds filter state and `matchesFilters(pin)`; every control live-applies via a callback. Gender filter matches the pin's own preference or "any"; food "Veg only" matches veg pins.
- `src/main.js` now keeps `allPins` and one clusterer, and on any filter change rebuilds markers for the filtered subset (`clearMarkers` + `addMarkers`).
- Verified in Chrome against the saved 2BHK pin: BHK chip 1 → 0, chips 1+2 → 1, rent max 10000 → 0, Reset → 1.

### Step 5 (ratings, reports, above-avg)
- `pins.js`: `ratePin` / `reportPin` (setDoc at `{pinId}_{uid}` → one per user), `getUserInteraction` (reads the user's own rating/report), `isAboveAvg` (haversine within 2 km, median of same-BHK, min 4 comparables, flag if rent > 1.3×).
- `detail.js`: 5-star rating control + four report-reason buttons; reflects the user's existing rating (filled stars) and hides report buttons once reported ("Reported: <reason>"); adds the "Above avg" badge.
- `main.js`: marker click → `openDetail` (computes above-avg + user interaction); after rate/report it reloads all data, re-applies filters, and refreshes/closes the panel (closes if the pin crossed 3 reports).
- Verified in Chrome: 4★ rating persisted and showed as ★ 4.0 on the badge and marker; a report added the "1 report" badge + marker chip and locked further reporting.
- Not live-tested (needs more data): hiding at 3+ reports (needs 3 distinct users) and the Above-avg badge (needs ≥4 same-BHK pins within 2 km) — both are code-complete.
- Test data left on the saved pin from verification: one 4★ rating and one "not_available" report (from the anon user).

### Step 6 (hardened rules + Netlify deploy) — all 6 steps complete
- Replaced the interim rules with production `firestore.rules`: public read; `create` requires auth + `ownerUid == uid` + a full `validPin()` check (key allow-list, Patna bbox, enums, rent 500–500000, text lengths, ≤5 images, server timestamps); owner-only `update`/`delete`; ratings/reports keyed `pinId_uid` (one each per user), reports have no `update`. Deployed with the CLI.
- Verified strict rules don't reject valid writes (saved a 3BHK/₹22000 pin live-backend).
- `netlify.toml` + `netlify sites:create` + `netlify deploy --prod` → https://patna-rent-map.netlify.app. Live QA passed: map, pins, markers, rating/report chips, and anonymous sign-in all work on the deployed domain.
- Security follow-ups for the user: restrict the Maps API key to referrers (localhost + the netlify domain); optionally add the netlify domain to Firebase Auth authorized domains (needed only if Google sign-in is added later). `.env` keys are intentionally baked into the client bundle (normal for Vite front-ends; protected by referrer + Firestore/Storage rules, not secrecy).
- Open/optional: image upload needs Firebase Storage (Blaze) enabled + storage.rules; swap the success `alert()` for a toast; two test pins + a test rating/report remain in Firestore from verification.

### Bugfix — "saving doesn't work" (systematic debug, verified in browser)
- Root cause (code): id/class `display` rules overrode the HTML `hidden` attribute, so `#form-overlay` and conditional labels ignored `hidden`. The sheet never closed → "Pick on map" couldn't close it → no location could be set → save blocked. Fixed with one rule: `[hidden] { display: none !important; }`.
- Verified in Chrome: form hidden on load; Pick-on-map closes sheet; dropping a pin set `25.586, 85.143 (rounded)`; conditional fields hide.
- Second cause (config, user action): with the code fixed, the write reaches Firebase and anon sign-in works, but Firestore returns `Missing or insufficient permissions` — the DB is in locked mode. User must set temporary signed-in-write rules until Step 6 deploys the real rules.
