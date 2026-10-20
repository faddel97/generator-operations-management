# GOM facility map replacement

The `/tracking` entry point now uses the isolated facility map module in `src/components/facility-map` and `src/lib/facility-map`. The previous MapLibre screen is not imported by this route. The rest of GOM retains its existing authentication, navigation, generator records, DSE readings, and tracking ingestion services.

## Original drawing

`Modular-SS-Layout-original.pdf` is a byte-for-byte copy of the supplied one-page PDF (SHA-256 `B0297E333FD7450739D4DAF2D881091BC46E2E87D48E0D01B0186596B7A5928E`). Its native page is 6429 × 4500 points. `scripts/build-facility-tiles.py` renders the *whole PDF page*, including its FreeText callouts, then creates 636 WebP tiles at zoom levels 0–4 in `public/facility-map/tiles`. The original PDF is not altered. Leaflet `CRS.Simple` uses stable source-image coordinates for tiles and overlays.

The PDF has 153 text callouts containing 148 distinct engineering codes. `scripts/extract-facility-annotations.py` extracts these as a searchable index; duplicate code labels are grouped. A code search focuses its annotation box, which is explicitly flagged as **not** a verified equipment or building position. Chinese labels embedded in the background image have no text data in the PDF. The administrator translation tool accepts a verified English translation and a tight label rectangle, then displays it on a separate layer. Untranslated labels remain pending review.

## Operational data

The server snapshot reads existing GOM `generators`, `dse_readings`, `tracking_assets`, current tracking observations, devices, and users. Real fuel values include source and reading date; liters are calculated only when a real capacity and percentage exist. Tracking positions appear on this PDF only after an administrator publishes GPS-to-image calibration with at least four spread survey control points and a low residual error. Manual map observations remain labeled as manual. Tracker staleness and offline status come from the existing tracking service. Updates use an authenticated 20-second polling fallback.

Apply `supabase/migrations/20261020_facility_map.sql` after the two 20261018 tracking migrations to enable administrator locations, image calibration, manual observations, checkout/return, fuel observations, translations, road graph editing, and audit logs. New locations and roads start unverified. Parking areas need administrator review before checkout. A manually confirmed return is marked returned only when its point falls inside the approved parking tolerance; otherwise the attempt is recorded and the checkout remains open as not returned or overdue. A database constraint prevents two open checkouts for one asset. Road directions use only verified, connected, unrestricted segments permitted for the relevant travel mode. No route, distance, or ETA is invented when the graph is incomplete.

No hardware provider, camera feed, surveyed calibration, or verified road graph is supplied with the PDF. Those connections require site data and administrator review. The replacement deliberately shows Unknown or Not Connected until records exist.

## Fictional stakeholder demonstration

Demo mode runs entirely in browser memory and never posts its records to GOM tables. It seeds 100 fictional assets (55 mobile, 45 fixed), 25 demonstration facility points, 20 return areas, and 18 fictional operators. Six launchable scenarios cover search and recovery, unreturned equipment, critical fuel, movement, return, and cross-entity search. Start, pause, speed, updates, and reset controls produce repeatable activity. The demonstration roads are illustrative traces; they are not the verified operational route graph. All demo records use `DEMO-` IDs or explicit demo labels.

## Verification

Run `npm run build`, `npm run lint -- --quiet`, and `npm run test:tracking`. For the browser smoke test, run a local server in GOM demo mode on port 3003 and execute `node scripts/check-facility-map.cjs` with `PLAYWRIGHT_MODULE` set to an installed Playwright package. The browser test checks tiles, zoom, pan, search (assets, D1, parking, original PDF code), scenarios, simulated return, real/demo isolation, unauthorized writes, and mobile overflow. Screenshots are saved under ignored `tmp/facility-map-qa/`.
