import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import { demoSeeds, demoZones, type SeedAsset } from "@/lib/tracking/demo-seed";
import { zoneAt } from "@/lib/tracking/geometry";
import type { TrackingAlert, TrackingAsset, TrackingPoint, TrackingPosition, TrackingSnapshot } from "@/lib/tracking/types";

const demoPath = path.join(process.cwd(), ".local-data", "tracking-simulation.json");
const baseTime = Date.parse("2026-10-18T09:00:00.000Z");
const dataVersion = 3;
export { demoZones };

function positionFor(seed: SeedAsset, point: TrackingPoint, sequence: number, ageMinutes = 0): TrackingPosition {
  const recordedAt = new Date(baseTime + sequence * 60_000 - ageMinutes * 60_000).toISOString();
  return {
    ...point,
    eventId: `${seed.trackerId}-${sequence}-${ageMinutes}`,
    recordedAt,
    receivedAt: recordedAt,
    accuracyM: seed.online ? 5 + Math.abs(sequence % 4) * 3 : 48,
    speedKph: seed.points.length > 1 && seed.online ? 8 + Math.abs(sequence % 18) : 0,
    heading: seed.points.length > 1 ? 78 : null,
    zoneId: zoneAt(point, demoZones)?.id ?? null
  };
}

export function initialDemoSnapshot(): TrackingSnapshot {
  const assets: TrackingAsset[] = demoSeeds.map((seed) => {
    const point = seed.points[0];
    const position = positionFor(seed, point, 0, seed.stale ? 24 : seed.online ? 0 : 140);
    const history = seed.points.length > 1 && seed.online && !seed.stale
      ? [positionFor(seed, { x: point.x - 55, y: point.y - 15 }, -2), positionFor(seed, { x: point.x - 25, y: point.y - 8 }, -1), position]
      : [position];
    return {
      id: seed.id, name: seed.name, category: seed.category, fuelPercent: seed.fuelPercent, fuelLitres: seed.fuelLitres,
      trackerId: seed.trackerId, operation: seed.stale ? "unknown" : seed.online && seed.points.length > 1 ? "moving" : seed.online ? "stationary" : "unknown",
      connection: seed.stale ? "stale" : seed.online ? "reporting" : "offline", position, history
    };
  });
  const alerts: TrackingAlert[] = assets.filter((asset) => asset.connection !== "reporting").slice(0, 6).map((asset, index) => ({
    id: `SIM-ALERT-${asset.id}`, assetId: asset.id,
    kind: asset.connection === "offline" ? "offline" : "stale",
    severity: asset.connection === "offline" ? "warning" : "info",
    message: `${asset.name} ${asset.connection === "offline" ? "stopped reporting" : "has a stale GPS fix"} (DEMO)`,
    occurredAt: asset.position?.recordedAt ?? new Date(baseTime).toISOString(), acknowledgedAt: index === 0 ? new Date(baseTime).toISOString() : null
  }));
  return { dataVersion, mode: "simulation", generatedAt: new Date(baseTime).toISOString(), sequence: 0, running: false, assets, zones: demoZones, alerts };
}

export function advanceDemoSnapshot(snapshot: TrackingSnapshot): TrackingSnapshot {
  const sequence = snapshot.sequence + 1;
  const generatedAt = new Date(baseTime + sequence * 60_000).toISOString();
  const assets = snapshot.assets.map((asset) => {
    const seed = demoSeeds.find((item) => item.id === asset.id);
    if (!seed || !seed.online || seed.stale) return asset;
    const point = seed.points[sequence % seed.points.length];
    const position = positionFor(seed, point, sequence);
    return { ...asset, position, operation: seed.points.length > 1 ? "moving" as const : "stationary" as const, history: [...asset.history, position].slice(-150) };
  });
  const alerts = [...snapshot.alerts];
  for (const asset of assets) {
    const prior = snapshot.assets.find((item) => item.id === asset.id);
    if (!asset.position || !prior?.position || prior.position.zoneId === asset.position.zoneId) continue;
    const nextZone = demoZones.find((zone) => zone.id === asset.position?.zoneId)?.name ?? "outside demo yard";
    alerts.unshift({ id: `SIM-ALERT-${asset.id}-${sequence}`, assetId: asset.id, kind: "zone_entry", severity: "info", message: `${asset.name} entered ${nextZone} (DEMO)`, occurredAt: generatedAt, acknowledgedAt: null });
  }
  return { ...snapshot, sequence, generatedAt, assets, alerts: alerts.slice(0, 100) };
}

export async function readDemoSnapshot(): Promise<TrackingSnapshot> {
  try {
    const raw = await fs.readFile(demoPath, "utf8");
    const parsed = JSON.parse(raw) as TrackingSnapshot;
    if (parsed?.mode === "simulation" && parsed.dataVersion === dataVersion && parsed.assets?.length === 50) return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  return initialDemoSnapshot();
}

export async function saveDemoSnapshot(snapshot: TrackingSnapshot) {
  await fs.mkdir(path.dirname(demoPath), { recursive: true });
  await fs.writeFile(demoPath, `${JSON.stringify(snapshot)}\n`, "utf8");
}
