import { NextResponse } from "next/server";

import { getSessionContext } from "@/lib/auth";
import { advanceDemoSnapshot, initialDemoSnapshot, readDemoSnapshot, saveDemoSnapshot } from "@/lib/tracking/demo";

export const dynamic = "force-dynamic";

async function authorized() {
  const session = await getSessionContext();
  return !session.isSupabaseConfigured || Boolean(session.userId);
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await readDemoSnapshot(), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json") {
    return NextResponse.json({ error: "Expected JSON" }, { status: 415 });
  }
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Cross-origin requests are not allowed" }, { status: 403 });
  const body = await request.json().catch(() => null) as { action?: string; alertId?: string } | null;
  if (!body || !["advance", "reset", "start", "pause", "acknowledge"].includes(body.action ?? "")) {
    return NextResponse.json({ error: "Invalid simulation action" }, { status: 400 });
  }
  if (body.action === "acknowledge" && (typeof body.alertId !== "string" || body.alertId.length > 120)) {
    return NextResponse.json({ error: "Invalid alert ID" }, { status: 400 });
  }
  const current = body.action === "reset" ? initialDemoSnapshot() : await readDemoSnapshot();
  const next = body.action === "advance" ? advanceDemoSnapshot(current)
    : body.action === "start" ? { ...current, running: true }
    : body.action === "pause" ? { ...current, running: false }
    : body.action === "acknowledge" ? { ...current, alerts: current.alerts.map((alert) => alert.id === body.alertId ? { ...alert, acknowledgedAt: current.generatedAt } : alert) }
    : current;
  await saveDemoSnapshot(next);
  return NextResponse.json(next, { headers: { "Cache-Control": "no-store" } });
}
