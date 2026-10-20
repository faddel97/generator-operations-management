# GPS tracking integration contract

The `/tracking` page now defaults to an operational WGS84 MapLibre workspace. It never seeds IMI boundaries or real equipment positions. The former synthetic 4 km × 3 km yard is available only through **Open simulation**. Its geometry, positions, fuel quantities, timestamps and alerts are **not IMI operational data**. Simulation state is saved to `.local-data/tracking-simulation.json` in local development. It is separate from Supabase production tables and is not suitable as a shared serverless production simulation store.

The four primary zone names/functions are based on [IMI's facilities overview](https://www.imi-ksa.com/our-facilities-and-capabilities/). The supplied map viewport is only a reference; published boundaries and internal equipment locations are not derived from that page.

## Production preparation

1. Apply `supabase/migrations/20261018_tracking_foundation.sql`, then `supabase/migrations/20261018_tracking_operational.sql` to the existing Supabase project after `supabase/schema.sql`. These are additive and do not alter generator identities.
2. Choose an organization-approved map tile provider. Set `NEXT_PUBLIC_TRACKING_STREET_TILES` to its licensed raster URL template; optionally set `NEXT_PUBLIC_TRACKING_SATELLITE_TILES`. These URLs are browser-visible and must not contain secret keys. Use a provider that supports referrer-restricted public tokens or an approved internal tile proxy. Until configured, the geographic canvas deliberately shows a configuration warning rather than fictional roads or unapproved satellite imagery.
3. An administrator should verify the IMI site against approved mapping/survey data, draw or import the perimeter, review the calculated area, save a draft, then publish. A later draft does not replace the published operational geometry until publication. Draw/import Zones A–D only after the perimeter is published. Their records are seeded without polygons. Geometry is marked `operator configured — not survey verified` until an authoritative survey replaces it.
4. Register a tracking asset in the dashboard, linking `generator_id` when it corresponds to an existing generator. This preserves the generator's inspections and maintenance history. A tracker is optional, and no position is invented for an untracked asset.
5. Operators may place a manual position on the approved map and record uncertainty. This is stored with a user ID and source `manual`, not mistaken for a GPS fix.
6. An administrator can select a registered asset, choose **Register GPS tracker**, enter its hardware ID/IMEI and receive a one-time random device token. Only its SHA-256 digest is stored in `tracking_devices`. Copy the token once to the trusted gateway. Use the same dialog to rotate or deactivate it. Keep `SUPABASE_SERVICE_ROLE_KEY` only on the server.
7. Configure a vendor adapter to send validated fixes to `/api/tracking/ingest`. The adapter must keep the device token confidential and use HTTPS.

## Availability and location semantics

Zone A–D cards and the **Zone availability** panel derive their counts from stored tracking assets, positions, published zone polygons, and explicitly recorded availability. `registered_zone_id` is an administrative assignment; `locatedZoneId` is calculated only from a reported coordinate and a published polygon. Availability (`available`, `in_use`, `maintenance`, `unknown`) is independent of GPS connection and generator health. Unknown is the default; no inference is made from the generator `healthy/attention/critical/offline` status. The panel can therefore answer both *where last reported* and *whether recorded as available* without conflating the two.

The operational UI polls every 20 seconds. Positions older than five minutes are labelled stale and older than thirty minutes offline. These thresholds should be field-configured for each device/reporting interval before operational use. Manual observations are explicitly labelled and do not establish a live tracker connection. Once the second migration is applied, a current-position trigger records yard exits and configured zone entry/exit events only when two successive fixes exist and geometry is published. It ignores unconfigured zones.

The current workspace loads up to 2,000 tracking assets, with a visible warning if this limit is reached. Before scaling beyond that, add server-side zone aggregates, viewport-based position queries, and load tests rather than treating capped client-side counts as complete.

## Device ingress

`POST /api/tracking/ingest` with `Authorization: Bearer <device token>` and JSON:

```json
{
  "hardwareId": "imei-or-vendor-id",
  "eventId": "unique-device-event-id",
  "recordedAt": "2026-10-18T09:00:00.000Z",
  "latitude": 24.0,
  "longitude": 46.0,
  "accuracyM": 8,
  "speedKph": 12,
  "headingDegrees": 90,
  "fuelPercent": 65
}
```

The example coordinates are protocol examples only, not IMI yard coordinates. The endpoint checks device identity, credential digest, value ranges, and timestamp window. The database function stores unique historical events, ignores duplicate IDs, and advances the current position only when a newer timestamp arrives. Its response reports `inserted`, `current`, and `position_id`.

Do not expose the service role key in a tracker, browser, or vendor dashboard. A vendor such as Traccar needs a server-side adapter translating its device messages into this generic contract. The first vendor adapter must define retry behavior, event ID stability, credential rotation, rate limits, and delivery monitoring.

## Simulation contract

Authenticated users can GET `/api/tracking/simulation` and POST `{"action":"start|pause|advance|reset|acknowledge"}` to the same route. Acknowledgment includes `alertId`. The UI polls through advances while running. Reproducible movement fixes, zone transitions, alerts and history use the same snapshot structure. These actions never write production tracking tables.

## Remaining deployment work

Migrations have not been applied by this code change. An approved basemap, verified site boundaries, hardware, credentials, vendor adapters, restricted-zone definitions, automated device disconnection/freshness alerts and load tests still require implementation or field data. Geofence SQL has not been exercised against the target Supabase database. History playback steps through recorded fixes only; it does not invent travel paths between sparse observations. Simulation persistence is local-development-only. Neither meter-level accuracy nor fuel calibration can be confirmed in software alone.
