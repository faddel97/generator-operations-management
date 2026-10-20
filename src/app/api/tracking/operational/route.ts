import { createHash, randomBytes, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { getSessionContext } from "@/lib/auth";
import {
  polygonAreaM2,
  polygonWithin,
  polygonsOverlap,
  validatePolygon,
} from "@/lib/tracking/geo";
import {
  FACILITY_KEY,
  readOperationalSnapshot,
  trackingDb,
} from "@/lib/tracking/operational";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  const session = await getSessionContext();
  if (session.isSupabaseConfigured && !session.userId)
    return jsonError("Unauthorized", 401);
  return NextResponse.json(await readOperationalSnapshot(), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const session = await getSessionContext();
  if (!session.userId)
    return jsonError(
      "Operational tracking requires an authenticated database session",
      401,
    );
  if (
    request.headers.get("origin") &&
    request.headers.get("origin") !== new URL(request.url).origin
  )
    return jsonError("Cross-origin request", 403);
  if (Number(request.headers.get("content-length") ?? 0) > 100_000)
    return jsonError("Payload too large", 413);
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json")
    return jsonError("Expected JSON", 415);
  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body || typeof body.action !== "string")
    return jsonError("Invalid request", 400);
  const db = trackingDb(await createSupabaseServerClient());

  if (body.action === "register") {
    if (session.role !== "admin") return jsonError("Admin required", 403);
    const code = String(body.code ?? "").trim();
    const name = String(body.name ?? "").trim();
    const category = String(body.category ?? "other");
    if (
      !/^[A-Za-z0-9][A-Za-z0-9._/ -]{1,59}$/.test(code) ||
      name.length < 2 ||
      name.length > 120 ||
      ![
        "truck",
        "forklift",
        "vehicle",
        "machinery",
        "heavy_equipment",
        "trailer",
        "portable",
        "other",
      ].includes(category)
    )
      return jsonError("Invalid asset fields", 400);
    let generatorId: string | null = null;
    if (body.generatorId) {
      if (typeof body.generatorId !== "string")
        return jsonError("Invalid generator", 400);
      const { data: generator } = await db
        .from("generators")
        .select("id")
        .eq("id", body.generatorId)
        .maybeSingle();
      if (!generator) return jsonError("Generator not found", 404);
      generatorId = generator.id;
    }
    const { error } = await db.from("tracking_assets").insert({
      asset_code: code,
      name,
      category,
      generator_id: generatorId,
      facility_key: FACILITY_KEY,
    });
    return error
      ? jsonError(error.message, 422)
      : NextResponse.json({ ok: true });
  }

  if (body.action === "register_device") {
    if (session.role !== "admin") return jsonError("Admin required", 403);
    if (
      typeof body.assetId !== "string" ||
      typeof body.hardwareId !== "string" ||
      !/^[A-Za-z0-9._:-]{3,120}$/.test(body.hardwareId)
    )
      return jsonError("Invalid device registration", 400);
    const { data: asset } = await db
      .from("tracking_assets")
      .select("id")
      .eq("id", body.assetId)
      .eq("facility_key", FACILITY_KEY)
      .maybeSingle();
    if (!asset) return jsonError("Asset not found", 404);
    const token = randomBytes(32).toString("base64url");
    const digest = createHash("sha256").update(token).digest("hex");
    const { error } = await db.from("tracking_devices").insert({
      asset_id: body.assetId,
      hardware_id: body.hardwareId,
      credential_sha256: digest,
      active: true,
    });
    if (error) return jsonError(error.message, 422);
    return NextResponse.json(
      { token },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  if (body.action === "deactivate_device") {
    if (session.role !== "admin") return jsonError("Admin required", 403);
    if (typeof body.assetId !== "string")
      return jsonError("Invalid asset", 400);
    const { data: asset } = await db
      .from("tracking_assets")
      .select("id")
      .eq("id", body.assetId)
      .eq("facility_key", FACILITY_KEY)
      .maybeSingle();
    if (!asset) return jsonError("Asset not found", 404);
    const { error } = await db
      .from("tracking_devices")
      .update({ active: false })
      .eq("asset_id", body.assetId);
    return error
      ? jsonError(error.message, 422)
      : NextResponse.json({ ok: true });
  }

  if (body.action === "rotate_device") {
    if (session.role !== "admin") return jsonError("Admin required", 403);
    if (typeof body.assetId !== "string")
      return jsonError("Invalid asset", 400);
    const { data: asset } = await db
      .from("tracking_assets")
      .select("id")
      .eq("id", body.assetId)
      .eq("facility_key", FACILITY_KEY)
      .maybeSingle();
    if (!asset) return jsonError("Asset not found", 404);
    const token = randomBytes(32).toString("base64url");
    const digest = createHash("sha256").update(token).digest("hex");
    const { data, error } = await db
      .from("tracking_devices")
      .update({ credential_sha256: digest, active: true })
      .eq("asset_id", body.assetId)
      .select("id")
      .maybeSingle();
    if (error || !data)
      return jsonError(error?.message ?? "Device not found", 422);
    return NextResponse.json(
      { token },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  if (body.action === "availability") {
    if (
      session.role !== "admin" &&
      session.role !== "supervisor" &&
      session.role !== "technician"
    )
      return jsonError("Operator required", 403);
    if (
      typeof body.assetId !== "string" ||
      !["available", "in_use", "maintenance", "unknown"].includes(
        String(body.status),
      )
    )
      return jsonError("Invalid availability update", 400);
    const { data, error } = await db
      .from("tracking_assets")
      .update({
        availability_status: body.status,
        availability_updated_at: new Date().toISOString(),
        availability_updated_by: session.userId,
      })
      .eq("id", body.assetId)
      .eq("facility_key", FACILITY_KEY)
      .select("id")
      .maybeSingle();
    return error || !data
      ? jsonError(error?.message ?? "Asset not found", 422)
      : NextResponse.json({ ok: true });
  }

  if (body.action === "assign_zone") {
    if (session.role !== "admin" && session.role !== "supervisor")
      return jsonError("Supervisor required", 403);
    if (
      typeof body.assetId !== "string" ||
      (body.zoneId !== null && typeof body.zoneId !== "string")
    )
      return jsonError("Invalid zone assignment", 400);
    if (body.zoneId) {
      const { data: zone } = await db
        .from("tracking_zones")
        .select("id")
        .eq("id", body.zoneId)
        .eq("facility_key", FACILITY_KEY)
        .maybeSingle();
      if (!zone) return jsonError("Zone not found", 404);
    }
    const { data, error } = await db
      .from("tracking_assets")
      .update({ registered_zone_id: body.zoneId })
      .eq("id", body.assetId)
      .eq("facility_key", FACILITY_KEY)
      .select("id")
      .maybeSingle();
    return error || !data
      ? jsonError(error?.message ?? "Asset not found", 422)
      : NextResponse.json({ ok: true });
  }

  if (body.action === "acknowledge_alert") {
    if (session.role !== "admin" && session.role !== "supervisor")
      return jsonError("Supervisor required", 403);
    if (typeof body.alertId !== "string")
      return jsonError("Invalid alert", 400);
    const { data: alert } = await db
      .from("tracking_alerts")
      .select("id, asset_id")
      .eq("id", body.alertId)
      .maybeSingle();
    if (!alert) return jsonError("Alert not found", 404);
    const { data: asset } = await db
      .from("tracking_assets")
      .select("id")
      .eq("id", alert.asset_id)
      .eq("facility_key", FACILITY_KEY)
      .maybeSingle();
    if (!asset) return jsonError("Alert not found", 404);
    const { error } = await db
      .from("tracking_alerts")
      .update({
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: session.userId,
      })
      .eq("id", body.alertId)
      .is("acknowledged_at", null);
    return error
      ? jsonError(error.message, 422)
      : NextResponse.json({ ok: true });
  }

  if (body.action === "manual_position") {
    if (
      session.role !== "admin" &&
      session.role !== "supervisor" &&
      session.role !== "technician"
    )
      return jsonError("Operator required", 403);
    if (
      typeof body.assetId !== "string" ||
      typeof body.longitude !== "number" ||
      typeof body.latitude !== "number" ||
      !Number.isFinite(body.longitude) ||
      !Number.isFinite(body.latitude) ||
      body.longitude < -180 ||
      body.longitude > 180 ||
      body.latitude < -90 ||
      body.latitude > 90 ||
      typeof body.accuracyM !== "number" ||
      !Number.isFinite(body.accuracyM) ||
      body.accuracyM < 1 ||
      body.accuracyM > 10000
    )
      return jsonError("Invalid manual position or uncertainty", 400);
    const { data: asset } = await db
      .from("tracking_assets")
      .select("id")
      .eq("id", body.assetId)
      .eq("facility_key", FACILITY_KEY)
      .maybeSingle();
    if (!asset) return jsonError("Asset not found", 404);
    const note = typeof body.note === "string" ? body.note.slice(0, 500) : null;
    const { error } = await db.rpc("record_manual_tracking_position", {
      p_asset_id: body.assetId,
      p_event_id: randomUUID(),
      p_latitude: body.latitude,
      p_longitude: body.longitude,
      p_accuracy_m: body.accuracyM,
      p_recorded_at: new Date().toISOString(),
      p_uncertainty_note: note,
    });
    return error
      ? jsonError(error.message, 422)
      : NextResponse.json({ ok: true });
  }

  if (body.action === "geometry") {
    if (session.role !== "admin") return jsonError("Admin required", 403);
    if (body.target !== "perimeter" && body.target !== "zone")
      return jsonError("Invalid geometry target", 400);
    const validation = validatePolygon(body.polygon);
    if (!validation.polygon)
      return jsonError(validation.error ?? "Invalid polygon", 400);
    const polygon = validation.polygon;
    const publish = body.publish === true;
    const update = {
      geometry_source: "operator configured — not survey verified",
      configured_by: session.userId,
      configured_at: new Date().toISOString(),
    };
    if (body.target === "perimeter") {
      if (publish) {
        const { data: zones } = await db
          .from("tracking_zones")
          .select("polygon_geojson")
          .eq("facility_key", FACILITY_KEY)
          .eq("geometry_status", "published");
        for (const zone of zones ?? [])
          if (
            zone.polygon_geojson &&
            !polygonWithin(zone.polygon_geojson, polygon)
          )
            return jsonError(
              "Published zones must remain inside the perimeter",
              400,
            );
      }
      const { data: current } = await db
        .from("tracking_facilities")
        .select("geometry_status")
        .eq("key", FACILITY_KEY)
        .maybeSingle();
      const changes = publish
        ? {
            ...update,
            geometry_status: "published",
            perimeter_geojson: polygon,
            perimeter_area_m2: polygonAreaM2(polygon),
            draft_geojson: null,
            draft_area_m2: null,
          }
        : {
            ...update,
            geometry_status:
              current?.geometry_status === "published" ? "published" : "draft",
            draft_geojson: polygon,
            draft_area_m2: polygonAreaM2(polygon),
          };
      const { error } = await db
        .from("tracking_facilities")
        .update(changes)
        .eq("key", FACILITY_KEY);
      return error
        ? jsonError(error.message, 422)
        : NextResponse.json({ ok: true });
    }
    if (typeof body.zoneId !== "string") return jsonError("Choose a zone", 400);
    const { data: zone } = await db
      .from("tracking_zones")
      .select("id, geometry_status")
      .eq("id", body.zoneId)
      .eq("facility_key", FACILITY_KEY)
      .maybeSingle();
    if (!zone) return jsonError("Zone not found", 404);
    const { data: facility } = await db
      .from("tracking_facilities")
      .select("perimeter_geojson, geometry_status")
      .eq("key", FACILITY_KEY)
      .maybeSingle();
    if (
      !facility?.perimeter_geojson ||
      facility.geometry_status !== "published"
    )
      return jsonError("Publish the yard perimeter first", 400);
    if (!polygonWithin(polygon, facility.perimeter_geojson))
      return jsonError("Zone must be inside the configured perimeter", 400);
    const { data: others } = await db
      .from("tracking_zones")
      .select("id, polygon_geojson")
      .eq("facility_key", FACILITY_KEY)
      .eq("geometry_status", "published")
      .neq("id", body.zoneId);
    for (const other of others ?? [])
      if (
        other.polygon_geojson &&
        polygonsOverlap(polygon, other.polygon_geojson)
      )
        return jsonError("Zone overlaps another published zone", 400);
    const changes = publish
      ? {
          ...update,
          geometry_status: "published",
          polygon_geojson: polygon,
          area_m2: polygonAreaM2(polygon),
          draft_geojson: null,
          draft_area_m2: null,
        }
      : {
          ...update,
          geometry_status:
            zone.geometry_status === "published" ? "published" : "draft",
          draft_geojson: polygon,
          draft_area_m2: polygonAreaM2(polygon),
        };
    const { error } = await db
      .from("tracking_zones")
      .update(changes)
      .eq("id", body.zoneId);
    return error
      ? jsonError(error.message, 422)
      : NextResponse.json({ ok: true });
  }

  return jsonError("Unknown action", 400);
}
