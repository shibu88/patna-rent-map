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

## Step 8 — "Add Your Flat" form redesign (button inputs, per screenshots)  ← PLAN (awaiting approval)

Redesign the "List My Flat" bottom sheet to match the three screenshots: tap-button inputs
instead of dropdowns, a maintenance toggle, red `*` on required fields and grey `(optional)`
on the rest, same dark colour scheme (keep the green `--accent`, not the screenshot's purple).

### Confirmed decisions
- Keep **all** current fields (listing type, food/gender pref, available-from, society, locality) —
  just restyle them. BHK buttons = **1,2,3,4,5+** (no 1RK). Furnishing = **3** buttons
  (Furnished / Semi / Unfurnished). Contact = **phone required, email optional**.
- Heading → **"Add Your Flat"**; footer = **Cancel** + primary **List My Flat** (saves on the same
  page; no "Proceed →" step). Location (GPS / Pick on map) stays at the bottom as before.
- Remove the **Pets allowed** row (field `petFriendly` still saved as `null`; no rules change for it).

### New fields (not in the current data model)
- `parking` (number of cars, **required** in the form), `phone` (string, **required**),
  `email` (string, optional). "Never shown publicly" note under phone/email.

### ⚠️ One decision for you — where phone/email are stored
`pins` is **world-readable** (CLAUDE.md: "anyone can read pins"), so anything saved there is
technically readable by anyone, which contradicts "never shown publicly".
- **(A) Simple:** store `phone`/`email` on the pin. Easy, but they are public in Firestore reads.
- **(B) Private (recommended):** store them in a separate `contacts/{autoId}` collection whose
  rules allow signed-in create but **no public read**. Pins stay fully public; contacts stay private.
  Slightly more code (second write + a rules block). Parking stays on the pin either way.

**Please pick A or B when you approve.** The checklist below assumes **B**; if you choose A it gets simpler.

### Tasks
- [ ] `index.html` — rebuild `#flat-form` body: convert BHK, listing type, furnishing, gated,
      "who lives here", food pref, gender pref, available-from, (and rooms-available) to button groups
      backed by hidden inputs (keeps `FormData` working). Maintenance → a toggle switch. Add
      Parking, Phone, Email inputs. Label each field with a red `*` or grey `(optional)` marker.
      Remove the Pets row. Heading → "Add Your Flat"; footer → Cancel + "List My Flat".
- [ ] `src/style.css` — `.btn-group` buttons (reuse the chip look: transparent → green when `.active`),
      `.req` (red) / `.opt` (grey) label markers, a toggle-switch style, parking/contact hints.
- [ ] `src/form.js` — wire button groups (click → set hidden input + `.active`, re-run conditional
      logic for listing type / available-from); read maintenance from the toggle; read + validate
      parking (≥0), phone (required), email (optional); require furnishing + gated; default
      occupant/food/gender to `any` when unset. Submit button text → "List My Flat". Add Cancel.
      Save `parking`/`phone`/`email` (phone/email via the chosen storage option).
- [ ] `src/spot.js` — add `parking:null` (and, for option A, `phone:null`, `email:null`) to the pin
      so it still matches the `hasOnly` rules.
- [ ] `firestore.rules` — add `parking` (+ `phone`,`email` for option A) to the `hasOnly` key list and
      add optional-value validators. (Option B adds a `contacts` match block instead.)
- [ ] `src/config.js` — add any new constants (e.g. `PARKING_MAX`).
- [ ] CLAUDE.md — add the new fields to the data-model table so the contract stays accurate.
- [ ] `npm run build` compiles; **STOP** for your browser test.

### Refinements from the 4th screenshot (confirmed)
- Chosen storage: **B** (private `contacts` collection). Required marker = just a red `*` (no "(required)" text).
- **Available from** → buttons **ASAP / Next month / Flexible** (default ASAP). Stored as
  `'asap' | 'next_month' | 'flexible'`; `pins.js isAvailable()` + `detail.js availableText()` learn these.
- **Preferred tenants (optional)** (was "Who lives here?") → **Family / Bachelors / No preference**
  (default "No preference" = `occupantType:'any'`).
- Parking hint shortened to "Enter 0 if there's no parking." Phone placeholder "10-digit mobile";
  contact hint "Private — only shared with matched seekers."
- **Email now shows a red `*` in the screenshot**, contradicting the earlier "email optional" choice.
  Following the newest screenshot: **email required** (flagged to the user to flip if unintended).
- Footer submit label "List My Flat", kept green (our `--accent`), not the screenshot's purple.
- Fields with a built-in default (available-from, preferred tenants, food, gender, maintenance toggle)
  carry no `*`; truly-required picks (BHK, furnishing, gated) start with nothing selected.

Notes: `detail.js` gains an availability-label update and a "Parking" row (public info); phone/email are
never shown (they live in the private `contacts` collection). The `firebase deploy --only firestore:rules`
for the rules change is yours to run.

## Step 9 — Pin detail panel redesign + comments  ← PLAN (awaiting approval)

Rebuild the marker-click detail panel to match the two screenshots, rendering **only real stored
pin data** (nothing hardcoded). Confirmed: **skip** the email-alert card; **build** real comments;
**match the screenshots exactly** (no locality / parking / food-gender / listing-type shown).

### Layout (top → bottom)
- Header: small "MONTHLY RENT" label + big **₹amount**; top-right icon buttons **share · report (flag) · close**.
- **Chips** (coloured dot + text), each only if the field has a value:
  `N BHK` · furnishing · `Maintenance Incl./Extra` (from `maintenanceIncluded`) · `Gated Society`/`Not Gated` ·
  tenants (`Family`/`Bachelors`, from `occupantType`; hidden when `any`) · `N mo deposit`.
- **Meta row** (icon + muted text): `Society: <society>` · `<sqft> sq.ft` · `Pinned <N>d ago` (from `createdAt`).
- **Get directions** → Google Maps directions link to the pin's lat/lng.
- **Context card**: for `pinKind:'rent'` → the "Not for rent — pinned for transparency" card with a
  "See flats currently available →" link (closes panel + turns on the To-Let filter). For
  `pinKind:'tolet'` → a short availability card from `availableFrom`.
- **Community rating**: "No ratings yet — tap to rate ›" or "★ x.x (n)"; tapping reveals the existing
  1–5 star control. (Report reasons move behind the top flag icon.)
- **Comments**: list of stored comments (newest first, "Nd ago") + an input and **Post** button.

### Tasks
- [ ] `src/pins.js` — `addComment(pinId, text)` + `loadComments(pinId)` (query by `pinId`, sort
      client-side by `createdAt` desc → no composite index). Import `addDoc`, `query`, `where`.
- [ ] `src/detail.js` — rewrite `showDetail()` for the layout above; add a `timeAgo()` helper; wire
      share (Web Share API / copy link), directions, the flag→report toggle, star rating, and comment post.
- [ ] `index.html` — simplify the `#detail-sheet` to a single scroll container the panel fills
      (header/close/share/report render inside it).
- [ ] `src/style.css` — detail-panel styles: chips with coloured dots, meta row, cards, rating row,
      comments list + composer. Keep the dark **green** scheme (not the screenshot's purple).
- [ ] `src/main.js` — `openDetail` loads comments and passes `onComment`; re-render the list after a post.
- [ ] `firestore.rules` — new `comments` block: public read; signed-in create (pinId string, uid ==
      auth.uid, text 1–500 chars, server `createdAt`); no update; owner delete. **Deploy is yours to run.**
- [ ] `npm run build` compiles; **STOP** for your browser test.

Notes: comments are a new `comments/{autoId}` collection (added to CLAUDE.md data model). The email-alert
card is intentionally omitted (needs Cloud Functions, unavailable on Spark).

## Review

### Step 8 — "Add Your Flat" form redesign (code done, build clean; awaiting browser test)
- **`index.html`**: rebuilt the `#flat-form` body. Dropdowns → tap **button groups** (BHK, listing
  type, rooms-available, furnishing, gated, available-from, preferred tenants, food, gender), each
  backed by a hidden `<input>` so `FormData` is unchanged. Added a **maintenance toggle** switch,
  **Parking** (₹-style unit suffix "cars"), **Email** and **Phone** inputs, a ₹ prefix on rent and a
  "sq.ft" suffix on area. Removed the **Pets** row and the old date picker. Every label now shows a
  red `*` (`.req`) or grey `(optional)` (`.opt`). Heading → "Add Your Flat"; footer → **Cancel** +
  **List My Flat**.
- **`src/form.js`**: `setupButtonGroups()` wires clicks → hidden input + `.active` highlight (and
  re-runs the room/flatmate conditional for listing type); maintenance read from the toggle;
  validation for BHK, furnishing, gated, parking (≥0), locality, email (regex), phone (≥10 digits);
  defaults occupant/food/gender to `any`. On save it writes the pin, then best-effort writes
  phone/email to the private **`contacts`** collection. Submit label "List My Flat"; `resetForm`
  restores each button group's highlight.
- **`src/spot.js`**: added `parking: null` so To-Let pins still match the `hasOnly` rules.
- **`src/pins.js` / `src/detail.js`**: `isAvailable()` + `availableText()` learn `next_month` /
  `flexible`; detail panel gained a **Parking** row (phone/email are never shown).
- **`firestore.rules`**: `parking` added to the pins schema + validator (0–20); new **`contacts`**
  block — signed-in create with validation, owner-only read, no update/delete, **not public**.
- **`src/config.js`**: `PARKING_MAX`, `AVAILABLE_FROM_OPTIONS`. **CLAUDE.md**: data model updated
  (`parking`, new `availableFrom` values, `contacts` collection, pets note).
- `npm run build` compiles clean.

**Two things to know before testing:**
1. **Email and phone are both required** (confirmed), and both are stored only in the private
   `contacts` collection — never in `pins`, so they are never public or shown on the map.
2. The private `contacts` write only succeeds once you **deploy the updated rules**
   (`firebase deploy --only firestore:rules`). Until then the pin still saves fine; the contact write
   is best-effort and just logs a warning. **STOP here for your browser test.**

### Step 9 — Pin detail panel redesign + comments (code done, build clean)
- **`src/detail.js`** rewritten to match the screenshots: MONTHLY RENT header + big ₹amount with
  share / report / close icon buttons; coloured info chips (BHK, furnishing, Maintenance Incl./Extra,
  Gated, tenants, deposit — each only when the field has a value); meta row (Society · sqft · "Pinned
  Nd ago"); Get directions; a context card ("Not for rent" for `rent` pins, availability for `tolet`);
  community rating (tap-to-rate reveals the stars); and a comments thread. Added `timeAgo()`; wired
  share (Web Share / clipboard), directions, flag→report toggle, rating, and comment post.
- **`src/pins.js`**: `loadComments(pinId)` (query by pinId, sort newest-first client-side — no index)
  and `addComment(pinId, text)`.
- **`src/main.js`**: `openDetail` loads rating + comments independently (`Promise.allSettled`, so a
  denied comments read doesn't wipe the rating); `handleComment` posts then re-opens the panel;
  "See flats currently available" calls `applyToLetFilter()`.
- **`src/filters.js`**: `applyToLetFilter()` — select To-Let only + open the panel.
- **Map-click fix**: tapping the map now closes the open Filters panel (`main.js`).
- **`index.html`**: `#detail-sheet` simplified to a single scroll container the panel fills.
- **`src/style.css`**: replaced the old detail styles with the new panel (chips, meta, cards, rating,
  comments); detail sheet is now a **floating rounded card** with a transparent dark-blue glass
  background + blur.
- **`firestore.rules`**: new `comments` block (public read; signed-in create with validation; no
  update; author delete). **`.claude/claude.md`**: documented the `comments` collection + rule.
- Email-alert card intentionally omitted (needs Cloud Functions, unavailable on Spark).
- `npm run build` compiles clean. Reminder: run `firebase deploy --only firestore:rules` so comments
  read/write works.

### Earlier review notes


### Change — top/filter bar now centered + transparent (floats over the map)
- Request: make the filter bar centred and transparent like the reference (bengaluru.rent).
- Fix (`style.css`): `#topbar` lost its solid full-width panel (removed `background: var(--panel)`,
  border-bottom, box-shadow) → now `background: transparent` + `align-items: center`. Each control
  keeps its own pill: the search box, the `⚙ Filters` button, and the `#filter-panel` (now
  `width: min(100%, 560px)` so it's a centred card). `#result-count` got a text-shadow to stay
  readable over the map.
- Verified in browser: brand + search + Filters/count are centred and float over the map with no
  solid bar; the Filters panel opens as a centred card. Build clean.

### Change — markers now point to the exact location (teardrop tail)
- Request: pins should show the precise spot (reference = map-pin/teardrop). The old label sat
  centred on the point (`transform: translateY(-50%)`), so the exact location was ambiguous.
- Fix: wrapped the price label in a `.pin-marker` column with a downward CSS-triangle tail; removed
  the centring transform. The marker's bottom-centre anchor is now the tail tip = exact coordinate.
  Tail inherits `--pin-color` (green rent / orange to-let). Did the same for clusters: `.cluster-marker`
  wrapper + tail (green tip when any flat is available). `pins.js`, `cluster.js`, `style.css`.
- Kept the rent text on the pin (the map's whole point) rather than switching to an icon-only pin.
- Verified in browser: single pins (e.g. "2BHK · ₹18K") and clusters ("2 flats", "4 flats") show a
  crisp tail pointing at the spot. Build clean.

### Bugfix — new "List My Flat" pins didn't show until a page reload
- Root cause: `setupForm(map)` took no refresh callback and `onSubmit` never re-rendered markers after
  `addDoc`, so pins added via the main form only appeared on a manual reload. (The Spot-a-To-Let flow
  already refreshed via its callback — that's why the inconsistency.)
- Fix: added a shared `reloadPins()` in `main.js` (re-reads pins + re-applies filters) and passed it to
  both `setupForm(map, reloadPins)` and `setupSpot(map, reloadPins)`. `form.js` now stores `onSaved`
  and `await`s it after a successful save (before the alert).
- Verified in browser on the dev server: saved two pins back-to-back; the result count went 4→5→6 and
  the new markers (incl. "2BHK · ₹18K") appeared immediately with no reload. Build clean.

### Change — removed photo upload (user choice; Storage unavailable on Spark)
- Per user decision, removed the Photos section entirely rather than keep a broken/slow path:
  `index.html` (Photos fieldset), `form.js` (storage imports, `selectedImages`, `onImagesChange`,
  `clearImagePreviews`, `uploadImages`, `withTimeout`, the upload block in `onSubmit`, reset cleanup),
  `style.css` (image preview/thumb rules + `fieldset.images` from shared selectors). `imageUrls: []`
  stays on the pin (data model + rules unchanged). Build clean; verified in browser the form goes
  feedback → Location → Save with no Photos section. Deploy still pending (user runs prod deploy).

### Bugfix — "Save pin" fails when photos are attached (systematic debug)
- Reproduced on the live site: a pin with rent + locality + location but **no photos saved fine**
  ("1 flats", green 2BHK·₹12K marker). A direct authenticated Storage upload test from the page
  **hung for 45s and timed out** — Firebase Storage (bucket `patna-rent-map.firebasestorage.app`)
  is not functional on the free Spark plan.
- Root cause: `form.js onSubmit` uploaded photos **before** `addDoc`, with no timeout and the upload
  fatal to the whole save. So any attached photo → `uploadBytes` hangs → the write never happens
  and the user sees no save. (Without photos the path is skipped and saving works.)
- Fix (`form.js`): photo upload is now best-effort — wrapped in its own try/catch with a 15s
  `withTimeout`. On failure/timeout the pin saves **without** photos and the success alert notes
  "Photos could not be uploaded…". The no-photo path is unchanged. Build compiles.
- Deploy was blocked by the environment's production-deploy policy this time — user runs
  `netlify deploy --prod --dir dist` (or it goes out once GitHub→Netlify auto-deploy is linked).
- Follow-up options for the user: enable Firebase Storage (needs Blaze) to actually host photos,
  or remove the photo upload UI entirely while on Spark.

### Fix — Netlify badge over the FAB + stale live site (deployed)
- The live site was still the pre-toolbar deploy (no right-side buttons) because auto-deploy isn't
  linked yet; and Netlify injects a free-tier "Powered by Netlify" badge (`/.netlify/scripts/hud`,
  `data-account-tier="free"`) bottom-right, which sat over the "+ List My Flat" button. The badge is
  injected by Netlify, not in our HTML, so it can't be removed in code (only by upgrading the plan).
- Fix: moved Google's zoom control to `LEFT_BOTTOM` (`map.js`) and raised `#list-flat-btn` to
  `bottom: 58px` (`style.css`) so the bottom-right stays clear of the badge. Built and deployed to
  production via `netlify deploy --prod` (deploy 6ae35249). Verified in-browser: toolbar is live and
  the button no longer overlaps the badge.
- Note: this was a manual CLI deploy (builds locally with `.env`). GitHub→Netlify auto-deploy still
  needs the user to (1) set the `VITE_*` env vars on Netlify and (2) link the repo in the UI.

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
