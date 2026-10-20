import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FACILITY_KEY, trackingDb } from "@/lib/tracking/operational";
import { projectPosition } from "@/lib/facility-map/calibration";
import type { Calibration, MapObservation } from "@/lib/facility-map/model";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSessionContext();
  if (!session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const code = new URL(request.url).searchParams.get("code")?.trim();
  if (!code || code.length > 60) return NextResponse.json({ error: "Invalid asset code" }, { status: 400 });
  const db = trackingDb(await createSupabaseServerClient());
  const [tracking, generator, calibrationResult] = await Promise.all([
    db.from("tracking_assets").select("id, generator_id").eq("asset_code", code).eq("facility_key", FACILITY_KEY).maybeSingle(),
    db.from("generators").select("id").eq("generator_id", code).maybeSingle(),
    db.from("facility_map_calibration").select("control_points, status, rms_px").eq("id", 1).maybeSingle(),
  ]);
  const key = tracking.data?.id ? "asset_id" : generator.data?.id ? "generator_id" : null;
  const id = tracking.data?.id ?? generator.data?.id;
  if (!key || !id) return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  const calibration: Calibration | null = calibrationResult.data?.control_points ? {
    points: calibrationResult.data.control_points, status: calibrationResult.data.status,
    rmsPx: calibrationResult.data.rms_px,
  } : null;
  const generatorId = tracking.data?.generator_id ?? generator.data?.id ?? null;
  const [manual, gps, manualFuel, dseFuel] = await Promise.all([
    db.from("facility_map_manual_observations").select("x, y, observed_at").eq(key, id)
      .order("observed_at", { ascending: false }).limit(80),
    tracking.data?.id ? db.from("tracking_positions").select("latitude, longitude, recorded_at, source")
      .eq("asset_id", tracking.data.id).order("recorded_at", { ascending: false }).limit(80)
      : Promise.resolve({ data: [], error: null }),
    db.from("facility_map_fuel_observations").select("kind, fuel_percent, observed_at")
      .eq("asset_key", code).order("observed_at", { ascending: false }).limit(80),
    generatorId ? db.from("dse_readings").select("reading_date, fuel_level_percentage, fuel_level_liters")
      .eq("generator_id", generatorId).order("reading_date", { ascending: false }).limit(80)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const history: MapObservation[] = (manual.data ?? []).map((row) => ({
    point: { x: row.x, y: row.y }, at: row.observed_at, source: "manual" as const,
  }));
  let uncalibratedGpsCount = 0;
  for (const row of gps.data ?? []) {
    const point = projectPosition(calibration, row.latitude, row.longitude);
    if (point) history.push({ point, at: row.recorded_at, source: row.source === "manual" ? "manual" : "gps" });
    else uncalibratedGpsCount += 1;
  }
  history.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  const fuelHistory = [
    ...(manualFuel.data ?? []).map((row) => ({ kind: row.kind, percent: row.fuel_percent,
      litres: null as number | null, at: row.observed_at, source: "authorized manual" })),
    ...(dseFuel.data ?? []).map((row) => ({ kind: "reading", percent: row.fuel_level_percentage,
      litres: row.fuel_level_liters, at: row.reading_date, source: "GOM DSE" })),
  ].filter((row) => row.percent !== null || row.litres !== null)
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 50);
  return NextResponse.json({ history: history.slice(0, 100), fuelHistory, uncalibratedGpsCount },
    { headers: { "Cache-Control": "no-store" } });
}
