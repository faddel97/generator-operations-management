import { NextResponse } from "next/server";

import { getSessionContext } from "@/lib/auth";
import { FACILITY_KEY, trackingDb } from "@/lib/tracking/operational";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSessionContext();
  if (!session.userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const assetId = url.searchParams.get("assetId");
  if (!assetId || !/^[0-9a-f-]{36}$/i.test(assetId))
    return NextResponse.json({ error: "Invalid asset ID" }, { status: 400 });
  const db = trackingDb(await createSupabaseServerClient());
  const { data: asset } = await db
    .from("tracking_assets")
    .select("id")
    .eq("id", assetId)
    .eq("facility_key", FACILITY_KEY)
    .maybeSingle();
  if (!asset)
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  let query = db
    .from("tracking_positions")
    .select(
      "id, latitude, longitude, recorded_at, accuracy_m, speed_kph, heading_degrees, source",
    )
    .eq("asset_id", assetId)
    .order("recorded_at", { ascending: false })
    .limit(500);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (from && Number.isFinite(Date.parse(from)))
    query = query.gte("recorded_at", from);
  if (to && Number.isFinite(Date.parse(to)))
    query = query.lte("recorded_at", to);
  const { data, error } = await query;
  if (error)
    return NextResponse.json({ error: "History unavailable" }, { status: 503 });
  return NextResponse.json(
    { positions: data ?? [], truncated: (data?.length ?? 0) === 500 },
    { headers: { "Cache-Control": "no-store" } },
  );
}
