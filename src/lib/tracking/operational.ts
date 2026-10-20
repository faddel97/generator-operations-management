import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { pointInGeoPolygon, type GeoPolygon } from "@/lib/tracking/geo";
import {
  FACILITY_KEY,
  ZONE_DEFINITIONS,
  type OperationalAsset,
  type OperationalPosition,
  type OperationalSnapshot,
  type OperationalZone,
} from "@/lib/tracking/operational-model";

export { FACILITY_KEY } from "@/lib/tracking/operational-model";

export function trackingDb(
  client: Awaited<ReturnType<typeof createSupabaseServerClient>>,
) {
  // The operational migration adds tables beyond the hand-maintained base Database type.
  return client as unknown as SupabaseClient;
}

function emptySnapshot(error: string | null): OperationalSnapshot {
  return {
    schemaReady: false,
    truncated: false,
    error,
    fetchedAt: new Date().toISOString(),
    facility: {
      key: FACILITY_KEY,
      name: "IMI Ras Al-Khair",
      polygon: null,
      draftPolygon: null,
      geometryStatus: "awaiting_configuration",
      areaM2: null,
      configuredAt: null,
      geometrySource: null,
    },
    zones: ZONE_DEFINITIONS.map((zone) => ({
      id: zone.code,
      code: zone.code,
      name: zone.name,
      functionDescription: zone.functionDescription,
      color: zone.color,
      polygon: null,
      draftPolygon: null,
      geometryStatus: "awaiting_configuration",
      areaM2: null,
    })),
    assets: [],
    unlinkedGenerators: [],
    alerts: [],
  };
}

export async function readOperationalSnapshot(): Promise<OperationalSnapshot> {
  if (!isSupabaseConfigured())
    return emptySnapshot(
      "Connect Supabase and apply the tracking migrations to use operational tracking. Simulation remains available separately.",
    );
  const db = trackingDb(await createSupabaseServerClient());
  const [
    facilityResult,
    zonesResult,
    assetsResult,
    generatorsResult,
    alertsResult,
  ] = await Promise.all([
    db
      .from("tracking_facilities")
      .select("*")
      .eq("key", FACILITY_KEY)
      .maybeSingle(),
    db
      .from("tracking_zones")
      .select("*")
      .eq("facility_key", FACILITY_KEY)
      .order("code"),
    db
      .from("tracking_assets")
      .select("*")
      .eq("facility_key", FACILITY_KEY)
      .is("archived_at", null)
      .order("name")
      .range(0, 499),
    db
      .from("generators")
      .select("id, generator_id, manufacturer, model")
      .order("generator_id")
      .limit(500),
    db
      .from("tracking_alerts")
      .select("id, asset_id, message, severity, occurred_at")
      .is("acknowledged_at", null)
      .order("occurred_at", { ascending: false })
      .limit(100),
  ]);
  if (facilityResult.error || zonesResult.error || assetsResult.error)
    return emptySnapshot(
      "Tracking tables are unavailable. Apply both tracking migrations before using the operational map.",
    );
  const facility = facilityResult.data;
  const assetRows = [...(assetsResult.data ?? [])];
  let assetPageError = false;
  while (
    assetRows.length > 0 &&
    assetRows.length % 500 === 0 &&
    assetRows.length < 2000
  ) {
    const page = await db
      .from("tracking_assets")
      .select("*")
      .eq("facility_key", FACILITY_KEY)
      .is("archived_at", null)
      .order("name")
      .range(assetRows.length, assetRows.length + 499);
    if (page.error) {
      assetPageError = true;
      break;
    }
    assetRows.push(...(page.data ?? []));
    if ((page.data?.length ?? 0) < 500) break;
  }
  const truncated = assetRows.length >= 2000;
  const groups: string[][] = [];
  for (let index = 0; index < assetRows.length; index += 100)
    groups.push(assetRows.slice(index, index + 100).map((asset) => asset.id));
  const [currentResults, deviceResults] = await Promise.all([
    Promise.all(
      groups.map((ids) =>
        db
          .from("tracking_current_positions")
          .select("asset_id, tracking_positions(*)")
          .in("asset_id", ids),
      ),
    ),
    Promise.all(
      groups.map((ids) =>
        db
          .from("tracking_devices")
          .select("asset_id, hardware_id, active, last_received_at")
          .in("asset_id", ids),
      ),
    ),
  ]);
  const currentRows = currentResults.flatMap((result) => result.data ?? []);
  const deviceRows = deviceResults.flatMap((result) => result.data ?? []);
  const zones: OperationalZone[] = (zonesResult.data ?? []).map((row) => ({
    id: row.id,
    code: row.code ?? "",
    name: row.name,
    functionDescription: row.function_description ?? "",
    color: row.color,
    polygon: row.polygon_geojson as GeoPolygon | null,
    draftPolygon: row.draft_geojson as GeoPolygon | null,
    geometryStatus: row.geometry_status,
    areaM2: row.area_m2,
  }));
  const positionByAsset = new Map<string, OperationalPosition>();
  for (const current of currentRows) {
    const raw = current.tracking_positions;
    const position = Array.isArray(raw) ? raw[0] : raw;
    if (!position) continue;
    positionByAsset.set(current.asset_id, {
      id: position.id,
      longitude: position.longitude,
      latitude: position.latitude,
      recordedAt: position.recorded_at,
      receivedAt: position.received_at,
      accuracyM: position.accuracy_m,
      speedKph: position.speed_kph,
      heading: position.heading_degrees,
      source: position.source === "manual" ? "manual" : "gps",
      fuelPercent: position.fuel_percent,
    });
  }
  const devices = new Map(
    deviceRows.map((row) => [row.asset_id as string, row]),
  );
  const now = Date.now();
  const assets: OperationalAsset[] = assetRows.map((row) => {
    const position = positionByAsset.get(row.id) ?? null;
    const device = devices.get(row.id);
    const age = position ? now - Date.parse(position.recordedAt) : Infinity;
    const trackerState =
      position?.source === "manual"
        ? "manual"
        : device?.active === false
          ? "offline"
          : !device && !position
            ? "not_fitted"
            : age < 5 * 60_000
              ? "reporting"
              : age < 30 * 60_000
                ? "stale"
                : "offline";
    const locatedZoneId = position
      ? (zones.find(
          (zone) =>
            zone.geometryStatus === "published" &&
            zone.polygon &&
            pointInGeoPolygon(
              [position.longitude, position.latitude],
              zone.polygon,
            ),
        )?.id ?? null)
      : null;
    const insideYard =
      position &&
      facility?.geometry_status === "published" &&
      facility.perimeter_geojson
        ? pointInGeoPolygon(
            [position.longitude, position.latitude],
            facility.perimeter_geojson as GeoPolygon,
          )
        : null;
    return {
      id: row.id,
      code: row.asset_code,
      name: row.name,
      category: row.category,
      generatorId: row.generator_id,
      availability: row.availability_status ?? "unknown",
      availabilityUpdatedAt: row.availability_updated_at,
      registeredZoneId: row.registered_zone_id,
      position,
      locatedZoneId,
      insideYard,
      trackerState,
      hardwareId: device?.hardware_id ?? null,
    };
  });
  const linked = new Set(
    assets.map((asset) => asset.generatorId).filter(Boolean),
  );
  return {
    schemaReady: true,
    truncated,
    error:
      assetPageError ||
      currentResults.some((result) => result.error) ||
      deviceResults.some((result) => result.error)
        ? "Some tracking records could not be loaded. Counts may be incomplete."
        : null,
    fetchedAt: new Date().toISOString(),
    facility: {
      key: FACILITY_KEY,
      name: facility?.name ?? "IMI Ras Al-Khair",
      polygon: facility?.perimeter_geojson as GeoPolygon | null,
      draftPolygon: facility?.draft_geojson as GeoPolygon | null,
      geometryStatus: facility?.geometry_status ?? "awaiting_configuration",
      areaM2: facility?.perimeter_area_m2 ?? null,
      configuredAt: facility?.configured_at ?? null,
      geometrySource: facility?.geometry_source ?? null,
    },
    zones,
    assets,
    unlinkedGenerators: (generatorsResult.data ?? [])
      .filter((row) => !linked.has(row.id))
      .map((row) => ({
        id: row.id,
        code: row.generator_id,
        name: `${row.generator_id} · ${row.manufacturer} ${row.model ?? ""}`.trim(),
      })),
    alerts: (alertsResult.data ?? [])
      .filter((row) => assets.some((asset) => asset.id === row.asset_id))
      .map((row) => ({
        id: row.id,
        assetId: row.asset_id,
        message: row.message,
        severity: row.severity,
        occurredAt: row.occurred_at,
      })),
  };
}
