# GPS tracking module audit

Audited 18 October 2026 against the existing Next.js/Supabase repository. This describes code, not a verified installation at the yard.

## Existing architecture

- `/tracking` is a protected page inside the existing application shell. The sidebar includes it for all four roles.
- `src/components/tracking/tracking-dashboard.tsx` is the whole tracking implementation. It contains five hardcoded sample assets, eleven illustrative site features, status cards, a CSS/SVG diagram, filters, a detail card, a table, and sample alert text.
- There are no tracking API routes, services, device adapters, GPS tables, or spatial database relationships. The `generators` and `sites` tables are the operational asset records but have no coordinate fields. The current tracking list is unrelated to those records.
- The map uses React state, absolute positioned HTML, and an SVG road drawing. No map package or provider is installed. The 12 km² claim is a label only; the percentages are not surveyed coordinates.
- Clicking markers, dragging, zooming, filtering, and stepping the illustration work in the browser. There is no persisted position or real feed. The step button changes marker coordinates only in memory. Reload resets it.

## Feature and UX assessment

| Feature | State before refactor | Gap |
| --- | --- | --- |
| Asset lookup | Small input over map; searches only visible demo markers | Search is not the first task and has no result list or focus action |
| Last seen and zone | Free-form hardcoded strings | No timestamps, freshness rule, zone lookup, or accuracy |
| Map | CSS and SVG illustration | No geographic coordinates, real boundary, imagery, marker clustering, or meaningful scale |
| Fuel and telemetry | Hardcoded values | No sensor binding, reading time, calibration, or missing-data distinction |
| History and alerts | Static trail and text | No event storage, playback, or acknowledgment |
| Simulation | In-memory marker offset | Does not exercise a tracking ingestion pipeline or persist across page loads |
| Security | Page uses the protected layout | There are no GPS endpoints or row policies to protect yet |

Four large statistic cards and a second table take attention away from locating an asset. The map is constrained to one side of a dense two-column layout. An offline asset can still show a marker without a prominent last-known warning. The sample roads, places, and fuel amounts may be mistaken for a real IMI survey.

## Performance and security concerns

- Re-rendering every marker on every pointer move is acceptable for five examples but will not scale to 1,000–5,000 assets. Drag state should be held in a ref, and future real maps should use viewport filtering or clustering.
- A physical tracker must never hold a Supabase service key or write directly as an application user. Device credentials must be revocable and telemetry must be validated server side.
- Location history is sensitive operational information. Production tables need RLS, explicit role checks, bounded queries, indexes, and retention rules.
- `next-env.d.ts` is modified by local Next.js tooling and is unrelated to tracking.

## Improvement direction

Preserve the protected route, navigation entry, existing roles, application colors, Supabase architecture, and all generator/site records. Refactor the tracking component into a map-first workspace with search, status and zone filters, explicit demo labeling, selected asset details, history, and a small summary strip. Build a deterministic synthetic yard without real coordinates or satellite claims. Keep the same page for future production data, which should show an honest empty state until configured.

## 18 October 2026 operational redesign update

The follow-up audit found that the intermediate implementation still made the synthetic SVG yard the default and presented a blank "live" switch. The current implementation defaults to a real WGS84 MapLibre canvas; the SVG diagram remains isolated in simulation. No purported IMI roads, buildings, operational polygons or asset positions are generated. The supplied viewport is used solely to center the map. An approved raster tile URL and two database migrations are required before production use. The four published zone names/functions are seeded without geometry. Search, current position, manual observation, asset registration, generator linking, availability updates, GIS configuration and observed-fix history are now wired to stored records. Outstanding geofence automation and device-field validation are recorded in the integration guide.

For eventual devices, use versioned additive tables for tracked assets, devices, zones, positions, and alerts; keep `generator_id` as an optional link to an existing generator. A server-side ingestion boundary should validate identity, time, coordinates, duplication, and ordering before updating current position. Real yard geometry, vendor protocol, map provider, SIMs, sensor calibration, and deployment of migrations remain field/deployment prerequisites.
