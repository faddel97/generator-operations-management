import "server-only";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { readOperationalSnapshot, trackingDb } from "@/lib/tracking/operational";
import { projectPosition } from "./calibration";
import { MAP_HEIGHT, MAP_WIDTH, type Calibration, type FacilityMapSnapshot, type MapAsset, type MapPlace } from "./model";

function finiteNumber(value: unknown): number | null {
  const num = Number(value);
  return value !== null && value !== undefined && Number.isFinite(num) ? num : null;
}

export async function readFacilityMapSnapshot(): Promise<FacilityMapSnapshot> {
  const operational = await readOperationalSnapshot();
  const fetchedAt = new Date().toISOString();
  if (!isSupabaseConfigured())
    return { assets: [], places: [], calibration: null, translations: [], routeNodes: [], routeEdges: [], schemaReady: false,
      error: "Demo only. Connect Supabase for real GOM records.", fetchedAt };
  const db = trackingDb(await createSupabaseServerClient());
  const [generatorResult, readingsResult, mapPlacesResult, calibrationResult, pointsResult, usageResult, usersResult, nodeResult, edgeResult, translationResult, fuelResult] = await Promise.all([
    db.from("generators").select("id, generator_id, manufacturer, model, fuel_tank_capacity").limit(1000),
    db.from("dse_readings").select("generator_id, reading_date, fuel_level_liters, fuel_level_percentage, created_at, approval_status")
      .order("reading_date", { ascending: false }).limit(2000),
    db.from("facility_map_places").select("id, code, name, kind, x, y, radius_px, review_required").limit(1000),
    db.from("facility_map_calibration").select("control_points, status, rms_px").eq("id", 1).maybeSingle(),
    db.from("facility_map_asset_points").select("asset_id, generator_id, x, y, observed_at, source").limit(2000),
    db.from("facility_map_usage").select("*").order("checkout_at", { ascending: false }).limit(2000),
    db.from("users").select("id, full_name, email").limit(1000),
    db.from("facility_map_route_nodes").select("id, name, x, y, verified").limit(2000),
    db.from("facility_map_route_edges").select("id, from_node, to_node, restricted, verified, permitted_modes").limit(3000),
    db.from("facility_map_translations").select("id, source_text, english_text, x, y, width, height").limit(1000),
    db.from("facility_map_fuel_observations").select("asset_key, kind, fuel_percent, observed_at").order("observed_at", { ascending: false }).limit(2000),
  ]);
  const calibration: Calibration | null = calibrationResult.data?.control_points
    ? { points: calibrationResult.data.control_points, status: calibrationResult.data.status, rmsPx: calibrationResult.data.rms_px }
    : null;
  const pointByAsset = new Map<string, NonNullable<typeof pointsResult.data>[number]>();
  const pointByGenerator = new Map<string, NonNullable<typeof pointsResult.data>[number]>();
  for (const row of pointsResult.data ?? []) {
    if (row.asset_id) pointByAsset.set(row.asset_id, row);
    if (row.generator_id) pointByGenerator.set(row.generator_id, row);
  }
  const readingByGenerator = new Map<string, NonNullable<typeof readingsResult.data>[number]>();
  for (const row of readingsResult.data ?? []) {
    if (!readingByGenerator.has(row.generator_id)) readingByGenerator.set(row.generator_id, row);
  }
  const generatorById = new Map((generatorResult.data ?? []).map((row) => [row.id, row]));
  const userById = new Map((usersResult.data ?? []).map((row) => [row.id, row.full_name || row.email]));
  const usageByAsset = new Map<string, NonNullable<typeof usageResult.data>[number]>();
  for (const row of usageResult.data ?? []) if (!usageByAsset.has(row.asset_key)) usageByAsset.set(row.asset_key, row);
  const latestFuel = new Map<string, NonNullable<typeof fuelResult.data>[number]>();
  const latestRefuel = new Map<string, NonNullable<typeof fuelResult.data>[number]>();
  for (const row of fuelResult.data ?? []) {
    if (!latestFuel.has(row.asset_key)) latestFuel.set(row.asset_key, row);
    if (row.kind === "refuel" && !latestRefuel.has(row.asset_key)) latestRefuel.set(row.asset_key, row);
  }
  const pickFuel = (code: string, dsePercent: number | null, dseAt: string | null,
    trackerPercent: number | null, trackerAt: string | null) => {
    const options = [
      dsePercent !== null && dseAt ? { percent: dsePercent, at: dseAt, source: "GOM DSE reading" } : null,
      trackerPercent !== null && trackerAt ? { percent: trackerPercent, at: trackerAt, source: "tracking device" } : null,
      latestFuel.get(code) ? { percent: latestFuel.get(code)!.fuel_percent, at: latestFuel.get(code)!.observed_at,
        source: latestFuel.get(code)!.kind === "refuel" ? "authorized manual refuel" : "authorized manual reading" } : null,
    ].filter((item): item is { percent: number; at: string; source: string } =>
      Boolean(item && Number.isFinite(item.percent) && item.percent >= 0 && item.percent <= 100));
    options.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
    const latest = options[0];
    return latest && latest.percent >= 0 && latest.percent <= 100 ? latest : null;
  };
  const mappedGeneratorIds = new Set(operational.assets.map((asset) => asset.generatorId).filter(Boolean));
  const assets: MapAsset[] = operational.assets.map((asset) => {
    const usage = usageByAsset.get(asset.code);
    const generator = asset.generatorId ? generatorById.get(asset.generatorId) : null;
    const reading = asset.generatorId ? readingByGenerator.get(asset.generatorId) : null;
    const manualPoint = pointByAsset.get(asset.id);
    const projected = asset.position ? projectPosition(calibration, asset.position.latitude, asset.position.longitude) : null;
    const useGps = projected && (!manualPoint || Date.parse(asset.position!.recordedAt) > Date.parse(manualPoint.observed_at));
    const point = useGps ? projected : manualPoint ? { x: manualPoint.x, y: manualPoint.y } : projected;
    const validPoint = point && point.x >= 0 && point.x <= MAP_WIDTH && point.y >= 0 && point.y <= MAP_HEIGHT ? point : null;
    const capacity = finiteNumber(generator?.fuel_tank_capacity);
    const readingPercent = finiteNumber(reading?.fuel_level_percentage);
    const readingLitres = finiteNumber(reading?.fuel_level_liters);
    const dsePercent = readingPercent ?? (capacity && readingLitres !== null ? readingLitres / capacity * 100 : null);
    const fuel = pickFuel(asset.code, dsePercent, reading?.reading_date ?? null,
      asset.position?.fuelPercent ?? null, asset.position?.recordedAt ?? null);
    return {
      id: asset.code, name: asset.name, category: asset.category,
      mobile: !["fixed", "stationary", "infrastructure"].includes(asset.category.toLowerCase()), demo: false,
      point: validPoint, positionAt: useGps ? asset.position?.recordedAt ?? null : manualPoint?.observed_at ?? asset.position?.recordedAt ?? null,
      positionSource: useGps ? "gps" : manualPoint?.source ?? (asset.position ? "GPS awaiting map calibration" : null),
      connection: useGps ? asset.trackerState === "not_fitted" ? "not_connected" : asset.trackerState : manualPoint ? "manual" : asset.trackerState === "not_fitted" ? "not_connected" : asset.trackerState,
      operator: usage && !usage.returned_at ? userById.get(usage.operator_id) ?? "Unknown" : null,
      lastOperator: usage ? userById.get(usage.operator_id) ?? "Unknown" : null,
      checkoutAt: usage?.checkout_at ?? null, returnDeadline: usage?.return_due_at ?? null,
      returnStatus: usage ? usage.returned_at && usage.return_matches_parking === true ? "returned" : usage.return_due_at && Date.parse(usage.return_due_at) < Date.now() ? "overdue" : "not_returned" : "unknown",
      parkingId: usage?.expected_parking_id ?? null,
      fuelCapacity: capacity, fuelPercent: fuel?.percent ?? null,
      fuelAt: fuel?.at ?? null, fuelSource: fuel?.source ?? null,
      lastRefuelAt: latestRefuel.get(asset.code)?.observed_at ?? null,
      history: validPoint && (manualPoint || asset.position) ? [{ point: validPoint,
        at: useGps ? asset.position!.recordedAt : manualPoint?.observed_at ?? asset.position!.recordedAt,
        source: useGps ? "gps" : "manual" }] : [],
      events: [
        ...(usage?.return_attempted_at && !usage.returned_at ? [{ kind: "return" as const,
          at: usage.return_attempted_at, detail: "Return attempted outside approved parking; checkout remains open" }] : []),
        ...(usage ? [{ kind: usage.returned_at ? "return" as const : "checkout" as const,
          at: usage.returned_at ?? usage.checkout_at,
          detail: usage.returned_at ? "Equipment return recorded in GOM" : "Equipment checked out in GOM" }] : []),
        ...(reading ? [{ kind: "fuel" as const, at: reading.reading_date, detail: "GOM DSE fuel reading" }] : []),
        ...(latestFuel.get(asset.code) ? [{ kind: latestFuel.get(asset.code)!.kind === "refuel" ? "refuel" as const : "fuel" as const,
          at: latestFuel.get(asset.code)!.observed_at, detail: "Authorized manual fuel observation" }] : []),
      ],
    };
  });
  for (const generator of generatorResult.data ?? []) {
    if (mappedGeneratorIds.has(generator.id)) continue;
    const reading = readingByGenerator.get(generator.id);
    const usage = usageByAsset.get(generator.generator_id);
    const manualPoint = pointByGenerator.get(generator.id);
    const capacity = finiteNumber(generator.fuel_tank_capacity);
    const litres = finiteNumber(reading?.fuel_level_liters);
    const percent = finiteNumber(reading?.fuel_level_percentage) ??
      (capacity && litres !== null ? litres / capacity * 100 : null);
    const fuel = pickFuel(generator.generator_id, percent, reading?.reading_date ?? null, null, null);
    assets.push({
      id: generator.generator_id, name: `${generator.manufacturer} ${generator.model ?? "generator"}`.trim(),
      category: "generator", mobile: false, demo: false,
      point: manualPoint ? { x: manualPoint.x, y: manualPoint.y } : null,
      positionAt: manualPoint?.observed_at ?? null, positionSource: manualPoint?.source ?? null,
      connection: manualPoint ? "manual" : "not_connected",
      operator: usage && !usage.returned_at ? userById.get(usage.operator_id) ?? "Unknown" : null,
      lastOperator: usage ? userById.get(usage.operator_id) ?? "Unknown" : null,
      checkoutAt: usage?.checkout_at ?? null, returnDeadline: usage?.return_due_at ?? null,
      returnStatus: usage ? usage.returned_at && usage.return_matches_parking === true ? "returned" : usage.return_due_at && Date.parse(usage.return_due_at) < Date.now() ? "overdue" : "not_returned" : "unknown",
      parkingId: usage?.expected_parking_id ?? null,
      fuelCapacity: capacity, fuelPercent: fuel?.percent ?? null,
      fuelAt: fuel?.at ?? null, fuelSource: fuel?.source ?? null,
      lastRefuelAt: latestRefuel.get(generator.generator_id)?.observed_at ?? null,
      history: manualPoint ? [{ point: { x: manualPoint.x, y: manualPoint.y }, at: manualPoint.observed_at, source: "manual" }] : [],
      events: [
        ...(usage?.return_attempted_at && !usage.returned_at ? [{ kind: "return" as const,
          at: usage.return_attempted_at, detail: "Return attempted outside approved parking; checkout remains open" }] : []),
        ...(usage ? [{ kind: usage.returned_at ? "return" as const : "checkout" as const,
          at: usage.returned_at ?? usage.checkout_at,
          detail: usage.returned_at ? "Equipment return recorded in GOM" : "Equipment checked out in GOM" }] : []),
        ...(reading ? [{ kind: "fuel" as const, at: reading.reading_date, detail: "GOM DSE fuel reading" }] : []),
        ...(latestFuel.get(generator.generator_id) ? [{ kind: latestFuel.get(generator.generator_id)!.kind === "refuel" ? "refuel" as const : "fuel" as const,
          at: latestFuel.get(generator.generator_id)!.observed_at, detail: "Authorized manual fuel observation" }] : []),
      ],
    });
  }
  const places: MapPlace[] = (mapPlacesResult.data ?? []).map((row) => ({
    id: row.id, code: row.code, name: row.name, kind: row.kind,
    point: { x: row.x, y: row.y }, source: "admin", reviewRequired: row.review_required, radiusPx: row.radius_px,
  }));
  const routeNodes = (nodeResult.data ?? []).map((row) => ({ id: row.id, name: row.name, point: { x: row.x, y: row.y }, verified: row.verified }));
  const routeEdges = (edgeResult.data ?? []).map((row) => ({ id: row.id, from: row.from_node, to: row.to_node,
    restricted: row.restricted, verified: row.verified, permittedModes: row.permitted_modes ?? [] }));
  const translations = (translationResult.data ?? []).map((row) => ({ id: row.id, sourceText: row.source_text,
    englishText: row.english_text, x: row.x, y: row.y, width: row.width, height: row.height }));
  const mapSchemaError = [mapPlacesResult, calibrationResult, pointsResult, usageResult,
    nodeResult, edgeResult, translationResult, fuelResult].some((result) => result.error);
  return { assets, places, calibration, translations, routeNodes, routeEdges,
    schemaReady: operational.schemaReady && !mapSchemaError,
    error: operational.error ?? (mapSchemaError ? "Facility map tables are unavailable. Apply the 20261020 facility map migration." : null)
      ?? generatorResult.error?.message ?? null, fetchedAt };
}
