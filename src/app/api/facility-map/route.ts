import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FACILITY_KEY, trackingDb } from "@/lib/tracking/operational";
import { fitCalibration } from "@/lib/facility-map/calibration";
import { MAP_HEIGHT, MAP_WIDTH, type ControlPoint } from "@/lib/facility-map/model";
import { readFacilityMapSnapshot } from "@/lib/facility-map/server";

export const dynamic = "force-dynamic";
const failure = (error: string, status: number) => NextResponse.json({ error }, { status });
const pointValid = (x: unknown, y: unknown) => typeof x === "number" && Number.isFinite(x) && x >= 0 && x <= MAP_WIDTH &&
  typeof y === "number" && Number.isFinite(y) && y >= 0 && y <= MAP_HEIGHT;

export async function GET() {
  const session = await getSessionContext();
  if (session.isSupabaseConfigured && !session.userId) return failure("Unauthorized", 401);
  return NextResponse.json(await readFacilityMapSnapshot(), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const session = await getSessionContext();
  if (!session.userId) return failure("An authenticated GOM account is required", 401);
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin)
    return failure("Cross-origin request", 403);
  if (Number(request.headers.get("content-length") ?? 0) > 50_000) return failure("Payload too large", 413);
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json") return failure("Expected JSON", 415);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.action !== "string") return failure("Invalid request", 400);
  const isAdmin = session.role === "admin";
  const canWrite = isAdmin || session.role === "supervisor" || session.role === "technician";
  const db = trackingDb(await createSupabaseServerClient());
  const audit = async (action: string, entityType: string, entityId: string) =>
    db.from("facility_map_audit").insert({ actor_id: session.userId, action, entity_type: entityType, entity_id: entityId });
  const recordManualPoint = async (code: string, x: number, y: number): Promise<string | null> => {
    const [tracking, generator] = await Promise.all([
      db.from("tracking_assets").select("id").eq("asset_code", code).eq("facility_key", FACILITY_KEY).maybeSingle(),
      db.from("generators").select("id").eq("generator_id", code).maybeSingle(),
    ]);
    const key = tracking.data?.id ? "asset_id" : generator.data?.id ? "generator_id" : null;
    const id = tracking.data?.id ?? generator.data?.id;
    if (!key || !id) return "Registered asset not found";
    const { data: prior } = await db.from("facility_map_asset_points").select("id").eq(key, id).maybeSingle();
    const values = { x, y, observed_at: new Date().toISOString(), source: "manual", updated_by: session.userId };
    const { error } = prior ? await db.from("facility_map_asset_points").update(values).eq("id", prior.id)
      : await db.from("facility_map_asset_points").insert({ ...values, [key]: id });
    return error?.message ?? null;
  };

  if (body.action === "place") {
    if (!isAdmin) return failure("Admin required", 403);
    const { code, name, kind, x, y } = body;
    const radiusPx = typeof body.radiusPx === "number" ? body.radiusPx : 80;
    if (typeof code !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{1,39}$/.test(code) ||
      typeof name !== "string" || name.trim().length < 2 || name.length > 100 ||
      !["building", "area", "gate", "parking"].includes(String(kind)) || !pointValid(x, y) ||
      !Number.isFinite(radiusPx) || radiusPx < 10 || radiusPx > 500)
      return failure("Invalid place", 400);
    const { data, error } = await db.from("facility_map_places").insert({ code: code.trim(), name: name.trim(), kind, x, y, radius_px: radiusPx,
      review_required: true, created_by: session.userId }).select("id").single();
    if (error) return failure(error.message, 422);
    await audit("create", "place", data.id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "verify_place") {
    if (!isAdmin || typeof body.id !== "string" || body.confirmed !== true) return failure("Admin review required", 403);
    const { data, error } = await db.from("facility_map_places").update({ review_required: false,
      updated_at: new Date().toISOString() }).eq("id", body.id).select("id").maybeSingle();
    if (error || !data) return failure(error?.message ?? "Location not found", 404);
    await audit("verify", "place", body.id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "translation") {
    if (!isAdmin || body.confirmed !== true) return failure("Administrator verification required", 403);
    const { sourceText, englishText, x, y, width, height } = body;
    if (typeof sourceText !== "string" || !sourceText.trim() || sourceText.length > 150 ||
      typeof englishText !== "string" || !englishText.trim() || englishText.length > 150 ||
      !pointValid(x, y) || typeof width !== "number" || typeof height !== "number" ||
      width < 5 || width > 1000 || height < 5 || height > 300 || (x as number) + width > MAP_WIDTH || (y as number) + height > MAP_HEIGHT)
      return failure("Invalid translation box or text", 400);
    const { data, error } = await db.from("facility_map_translations").insert({ source_text: sourceText.trim(),
      english_text: englishText.trim(), x, y, width, height, verified_by: session.userId }).select("id").single();
    if (error) return failure(error.message, 422);
    await audit("verify_translation", "translation", data.id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "manual_point") {
    if (!canWrite) return failure("Operator required", 403);
    if (typeof body.assetCode !== "string" || !pointValid(body.x, body.y)) return failure("Invalid manual position", 400);
    const error = await recordManualPoint(body.assetCode, body.x as number, body.y as number);
    if (error) return failure(error, error === "Registered asset not found" ? 404 : 422);
    await audit("manual_position", "asset", body.assetCode);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "fuel_observation") {
    if (!canWrite) return failure("Operator required", 403);
    if (typeof body.assetCode !== "string" || !["reading", "refuel"].includes(String(body.kind)) ||
      typeof body.percent !== "number" || !Number.isFinite(body.percent) || body.percent < 0 || body.percent > 100)
      return failure("Invalid fuel observation", 400);
    const snapshot = await readFacilityMapSnapshot();
    if (!snapshot.assets.some((asset) => asset.id === body.assetCode)) return failure("Registered asset not found", 404);
    const { data, error } = await db.from("facility_map_fuel_observations").insert({
      asset_key: body.assetCode, kind: body.kind, fuel_percent: body.percent,
      reported_by: session.userId, note: typeof body.note === "string" ? body.note.slice(0, 300) : null,
    }).select("id").single();
    if (error) return failure(error.message, 422);
    await audit(body.kind === "refuel" ? "refuel" : "fuel_reading", "asset", body.assetCode);
    return NextResponse.json({ ok: true, id: data.id });
  }

  if (body.action === "calibration") {
    if (!isAdmin) return failure("Admin required", 403);
    const points = body.points as ControlPoint[];
    if (!Array.isArray(points) || points.length < 4 || points.length > 24 ||
      points.some((p) => !pointValid(p?.x, p?.y) || !Number.isFinite(p.latitude) || !Number.isFinite(p.longitude) ||
        Math.abs(p.latitude) > 90 || Math.abs(p.longitude) > 180)) return failure("Four or more verified control points are required", 400);
    const fit = fitCalibration(points);
    if (!fit) return failure("Control points must span the facility and support a stable affine fit", 400);
    const publish = body.publish === true;
    if (publish && fit.rmsPx > 40) return failure(`Residual ${fit.rmsPx.toFixed(1)} px exceeds 40 px quality limit`, 400);
    const { error } = await db.from("facility_map_calibration").upsert({ id: 1, control_points: points,
      status: publish ? "published" : "draft", rms_px: fit.rmsPx, updated_by: session.userId,
      updated_at: new Date().toISOString() }, { onConflict: "id" });
    if (error) return failure(error.message, 422);
    await audit(publish ? "publish" : "draft", "calibration", "1");
    return NextResponse.json({ ok: true, rmsPx: fit.rmsPx });
  }

  if (body.action === "checkout") {
    if (!canWrite) return failure("Operator required", 403);
    if (typeof body.assetCode !== "string" || typeof body.parkingId !== "string" ||
      typeof body.dueAt !== "string" || !Number.isFinite(Date.parse(body.dueAt))) return failure("Asset, return area and deadline required", 400);
    const snapshot = await readFacilityMapSnapshot();
    const asset = snapshot.assets.find((item) => item.id === body.assetCode);
    if (!asset) return failure("Registered asset not found", 404);
    if (!snapshot.places.some((place) => place.id === body.parkingId && place.kind === "parking" && !place.reviewRequired))
      return failure("Approved parking area not found", 404);
    const { data: active } = await db.from("facility_map_usage").select("id").eq("asset_key", asset.id).is("returned_at", null).maybeSingle();
    if (active) return failure("Asset already checked out", 409);
    const freshFuel = asset.fuelAt && Date.now() - Date.parse(asset.fuelAt) < 60 * 60_000 ? asset.fuelPercent : null;
    const { data, error } = await db.from("facility_map_usage").insert({ asset_key: asset.id, operator_id: session.userId,
      return_due_at: body.dueAt, expected_parking_id: body.parkingId,
      starting_fuel_percent: freshFuel, checkout_x: asset.point?.x ?? null,
      checkout_y: asset.point?.y ?? null, checkout_position_at: asset.positionAt }).select("id").single();
    if (error) return failure(error.message, 422);
    await audit("checkout", "usage", data.id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "return") {
    if (!canWrite) return failure("Operator required", 403);
    if (typeof body.assetCode !== "string" || !pointValid(body.x, body.y) || body.confirmed !== true)
      return failure("Return point and authorized manual confirmation required", 400);
    const { data: active } = await db.from("facility_map_usage").select("id, expected_parking_id").eq("asset_key", body.assetCode)
      .is("returned_at", null).order("checkout_at", { ascending: false }).limit(1).maybeSingle();
    if (!active) return failure("No active checkout", 404);
    const { data: parking } = await db.from("facility_map_places").select("x, y, radius_px, review_required")
      .eq("id", active.expected_parking_id).eq("kind", "parking").maybeSingle();
    const matches = Boolean(parking && !parking.review_required &&
      Math.hypot((body.x as number) - parking.x, (body.y as number) - parking.y) <= parking.radius_px);
    const pointError = await recordManualPoint(body.assetCode, body.x as number, body.y as number);
    if (pointError) return failure(pointError, 422);
    const snapshot = await readFacilityMapSnapshot();
    const asset = snapshot.assets.find((item) => item.id === body.assetCode);
    const freshFuel = asset?.fuelAt && Date.now() - Date.parse(asset.fuelAt) < 60 * 60_000 ? asset.fuelPercent : null;
    const attemptedAt = new Date().toISOString();
    const { error } = await db.from("facility_map_usage").update({
      return_attempted_at: attemptedAt, returned_at: matches ? attemptedAt : null,
      returned_by: session.userId, return_x: body.x, return_y: body.y, return_verified: true,
      return_matches_parking: matches, ending_fuel_percent: freshFuel }).eq("id", active.id);
    if (error) return failure(error.message, 422);
    await audit(matches ? "manual_return" : "return_outside_parking", "usage", active.id);
    return NextResponse.json({ ok: true, matchesParking: matches });
  }

  if (body.action === "route_node") {
    if (!isAdmin) return failure("Admin required", 403);
    if (typeof body.name !== "string" || body.name.trim().length < 2 || !pointValid(body.x, body.y)) return failure("Invalid route node", 400);
    const { data, error } = await db.from("facility_map_route_nodes").insert({ name: body.name.trim().slice(0, 100),
      x: body.x, y: body.y, verified: false, created_by: session.userId }).select("id").single();
    if (error) return failure(error.message, 422);
    await audit("create_draft", "route_node", data.id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "route_edge") {
    if (!isAdmin) return failure("Admin required", 403);
    if (typeof body.from !== "string" || typeof body.to !== "string" || body.from === body.to ||
      !["walk", "vehicle", "both"].includes(String(body.mode))) return failure("Invalid route edge", 400);
    const permittedModes = body.mode === "both" ? ["walk", "vehicle"] : [body.mode];
    const { data, error } = await db.from("facility_map_route_edges").insert({ from_node: body.from,
      to_node: body.to, permitted_modes: permittedModes, verified: false, restricted: false, created_by: session.userId }).select("id").single();
    if (error) return failure(error.message, 422);
    await audit("create_draft", "route_edge", data.id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "verify_route") {
    if (!isAdmin) return failure("Admin required", 403);
    if (typeof body.id !== "string" || !["node", "edge"].includes(String(body.kind)) || body.confirmed !== true)
      return failure("Explicit route verification required", 400);
    const table = body.kind === "node" ? "facility_map_route_nodes" : "facility_map_route_edges";
    const { data, error } = await db.from(table).update({ verified: true, updated_at: new Date().toISOString() })
      .eq("id", body.id).select("id").maybeSingle();
    if (error || !data) return failure(error?.message ?? "Route item not found", 404);
    await audit("verify", body.kind === "node" ? "route_node" : "route_edge", body.id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "restrict_route") {
    if (!isAdmin || typeof body.id !== "string" || typeof body.restricted !== "boolean")
      return failure("Admin route edit required", 403);
    const { data, error } = await db.from("facility_map_route_edges").update({ restricted: body.restricted,
      updated_at: new Date().toISOString() }).eq("id", body.id).select("id").maybeSingle();
    if (error || !data) return failure(error?.message ?? "Road segment not found", 404);
    await audit(body.restricted ? "restrict" : "reopen", "route_edge", body.id);
    return NextResponse.json({ ok: true });
  }

  return failure("Unknown action", 400);
}
