import { createHash, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { supabaseUrl } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

type DeviceFix = {
  hardwareId: string;
  eventId: string;
  recordedAt: string;
  latitude: number;
  longitude: number;
  accuracyM?: number | null;
  speedKph?: number | null;
  headingDegrees?: number | null;
  fuelPercent?: number | null;
};

function validNumber(value: unknown, min: number, max: number, optional = false) {
  return (optional && (value === undefined || value === null)) || (typeof value === "number" && Number.isFinite(value) && value >= min && value <= max);
}

function validFix(value: unknown): value is DeviceFix {
  if (!value || typeof value !== "object") return false;
  const fix = value as Partial<DeviceFix>;
  const time = Date.parse(fix.recordedAt ?? "");
  return typeof fix.hardwareId === "string" && fix.hardwareId.length >= 3 && fix.hardwareId.length <= 120 &&
    typeof fix.eventId === "string" && fix.eventId.length >= 1 && fix.eventId.length <= 120 &&
    Number.isFinite(time) && time <= Date.now() + 5 * 60_000 && time >= Date.now() - 7 * 86400_000 &&
    validNumber(fix.latitude, -90, 90) && validNumber(fix.longitude, -180, 180) &&
    validNumber(fix.accuracyM, 0, 10000, true) && validNumber(fix.speedKph, 0, 400, true) &&
    validNumber(fix.headingDegrees, 0, 359.999, true) && validNumber(fix.fuelPercent, 0, 100, true);
}

export async function POST(request: Request) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !serviceKey) return NextResponse.json({ error: "Tracking ingestion is not configured" }, { status: 503 });
  if (Number(request.headers.get("content-length") ?? 0) > 4096) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json") return NextResponse.json({ error: "Expected JSON" }, { status: 415 });
  const bearer = request.headers.get("authorization")?.match(/^Bearer ([a-zA-Z0-9_-]{32,256})$/)?.[1];
  if (!bearer) return NextResponse.json({ error: "Device token required" }, { status: 401 });
  const fix = await request.json().catch(() => null);
  if (!validFix(fix)) return NextResponse.json({ error: "Invalid GPS fix" }, { status: 400 });

  const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: device, error: lookupError } = await admin.from("tracking_devices").select("id, credential_sha256, active").eq("hardware_id", fix.hardwareId).maybeSingle();
  if (lookupError) return NextResponse.json({ error: "Tracking database is unavailable" }, { status: 503 });
  if (!device?.active || typeof device.credential_sha256 !== "string") return NextResponse.json({ error: "Unauthorized device" }, { status: 401 });
  const expected = Buffer.from(device.credential_sha256, "hex");
  const actual = createHash("sha256").update(bearer).digest();
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return NextResponse.json({ error: "Unauthorized device" }, { status: 401 });

  const { data, error } = await admin.rpc("ingest_tracking_position", {
    p_device_id: device.id,
    p_event_id: fix.eventId,
    p_recorded_at: fix.recordedAt,
    p_latitude: fix.latitude,
    p_longitude: fix.longitude,
    p_accuracy_m: fix.accuracyM ?? null,
    p_speed_kph: fix.speedKph ?? null,
    p_heading_degrees: fix.headingDegrees ?? null,
    p_fuel_percent: fix.fuelPercent ?? null
  });
  if (error) return NextResponse.json({ error: "GPS fix could not be stored" }, { status: 422 });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
