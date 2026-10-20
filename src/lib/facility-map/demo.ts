import type { MapAsset, MapEvent, MapObservation, MapPlace, MapPoint } from "./model";
import { demoBuildings, demoGraphRoute, overviewPoint, vectorRoads } from "./vector";

// Coordinates are traced from the supplied clean overhead, normalized to the
// 1800 × 1260 annotated preview frame. They are fictional demo placements and
// deliberately separate from operational asset and location records.
const px = overviewPoint;
const baseTime = Date.parse("2026-10-20T06:00:00.000Z");
const when = (minutes: number) => new Date(baseTime + minutes * 60_000).toISOString();

export const demoPlaces: MapPlace[] = demoBuildings.map((building) => ({
  id: building.id, code: building.code, name: building.name, kind: building.kind,
  point: building.point, outline: building.outline, source: "demo", reviewRequired: true,
}));

const parkingAnchors: Array<[number, number]> = [
  [224, 377], [255, 377], [286, 377], [317, 377], [350, 377],
  [390, 377], [430, 377], [470, 377], [548, 377], [620, 377],
  [694, 377], [790, 377], [868, 377], [940, 377], [1020, 377],
  [1110, 377], [1190, 377], [1270, 377], [1360, 377], [1450, 377],
];
export const demoParking: MapPlace[] = parkingAnchors.map(([x, y], i) => ({
  id: `DEMO-PARK-${String(i + 1).padStart(2, "0")}`,
  code: `P-${String(i + 1).padStart(2, "0")}`,
  name: `Demo return area ${String(i + 1).padStart(2, "0")}`,
  kind: "parking", point: px(x, y), source: "demo", reviewRequired: true, radiusPx: 80,
}));

export const demoOperators = Array.from({ length: 18 }, (_, i) =>
  `Demo Operator ${String(i + 1).padStart(2, "0")}`);

export type DemoRoad = { id: string; points: MapPoint[]; status: "illustrative" };
export const demoRoads: DemoRoad[] = vectorRoads.map((road) => ({ id: road.id, points: road.points, status: "illustrative" }));

const categories = ["generator", "forklift", "crane", "utility vehicle", "transport vehicle", "mobile machinery"];
const capacities: Record<string, number> = { generator: 600, forklift: 80, crane: 420, "utility vehicle": 90, "transport vehicle": 180, "mobile machinery": 250 };
const mobileIds = Array.from({ length: 55 }, (_, i) => {
  const category = categories[i % categories.length];
  const prefix = ({ generator: "GEN", forklift: "FLK", crane: "CRN", "utility vehicle": "UTV", "transport vehicle": "TRK", "mobile machinery": "MCH" } as Record<string, string>)[category];
  return { id: `DEMO-${prefix}-${String(i + 1).padStart(3, "0")}`, category };
});

export function initialDemoAssets(): MapAsset[] {
  const mobile = mobileIds.map(({ id, category }, i): MapAsset => {
    const parking = demoParking[i % demoParking.length];
    const point = parking.point;
    const fuelPercent = 38 + (i * 13) % 59;
    const operator = demoOperators[i % demoOperators.length];
    const positionAt = when(-12 - i % 25);
    return {
      id, name: `Demo ${category} ${String(i + 1).padStart(2, "0")}`,
      category, mobile: true, demo: true, point, positionAt,
      positionSource: "simulated", connection: i % 13 === 0 ? "offline" : "simulated",
      operator: i % 4 === 0 ? operator : null, lastOperator: operator,
      checkoutAt: i % 4 === 0 ? when(-180 - i) : null,
      returnDeadline: i % 4 === 0 ? when(120) : null,
      returnStatus: i % 4 === 0 ? "not_returned" : "returned",
      parkingId: parking.id, fuelCapacity: capacities[category], fuelPercent,
      fuelAt: when(-15 - i % 22), fuelSource: "simulated",
      lastRefuelAt: i % 3 === 0 ? when(-1440 - i) : null,
      history: [
        { point, at: when(-420 - i), source: "simulated" },
        { point, at: positionAt, source: "simulated" },
      ], events: [],
    };
  });
  // Explicit, repeatable scenarios; all values and names are fictional.
  mobile[1] = { ...mobile[1], id: "DEMO-FLK-001", name: "Demo search forklift", point: px(645, 391),
    parkingId: demoParking[2].id, operator: null, lastOperator: demoOperators[2],
    checkoutAt: when(-240), returnDeadline: when(-30), returnStatus: "overdue", fuelPercent: 47,
    history: [{ point: demoParking[2].point, at: when(-240), source: "simulated" }, { point: px(645, 391), at: when(-8), source: "simulated" }], positionAt: when(-8) };
  mobile[6] = { ...mobile[6], id: "DEMO-GEN-002", name: "Demo unreturned generator", point: px(814, 393),
    parkingId: demoParking[6].id, operator: demoOperators[5], lastOperator: demoOperators[5],
    checkoutAt: when(-300), returnDeadline: when(-60), returnStatus: "overdue",
    history: [{ point: demoParking[6].point, at: when(-300), source: "simulated" }, { point: px(814, 393), at: when(-10), source: "simulated" }], positionAt: when(-10) };
  mobile[12] = { ...mobile[12], id: "DEMO-GEN-003", name: "Demo low fuel generator", point: px(1009, 392),
    parkingId: demoParking[12].id, fuelPercent: 9, operator: demoOperators[8], lastOperator: demoOperators[8],
    checkoutAt: when(-90), returnDeadline: when(90), returnStatus: "not_returned", positionAt: when(-4) };
  mobile[21] = { ...mobile[21], id: "DEMO-UTV-022", name: "Demo moving utility vehicle", point: demoParking[1].point,
    parkingId: demoParking[1].id, operator: demoOperators[10], lastOperator: demoOperators[10],
    checkoutAt: when(-45), returnDeadline: when(180), returnStatus: "not_returned", positionAt: when(0) };
  mobile[25] = { ...mobile[25], id: "DEMO-FLK-005", name: "Demo returning forklift", point: px(645, 391),
    parkingId: demoParking[8].id, operator: demoOperators[12], lastOperator: demoOperators[12],
    checkoutAt: when(-120), returnDeadline: when(60), returnStatus: "not_returned", positionAt: when(0) };
  const fixed = Array.from({ length: 45 }, (_, i): MapAsset => {
    const place = demoPlaces[i % demoPlaces.length];
    const point = place.point;
    return {
      id: `DEMO-FIX-${String(i + 1).padStart(3, "0")}`,
      name: `Demo fixed equipment ${String(i + 1).padStart(2, "0")}`,
      category: i % 3 === 0 ? "fixed generator" : i % 3 === 1 ? "electrical equipment" : "stationary machinery",
      mobile: false, demo: true, point, positionAt: when(-1440), positionSource: "demo placement",
      connection: "not_connected", operator: null, lastOperator: null,
      checkoutAt: null, returnDeadline: null, returnStatus: "unknown", parkingId: null,
      fuelCapacity: i % 3 === 0 ? 1000 : null,
      fuelPercent: i % 3 === 0 ? 52 + i % 40 : null,
      fuelAt: i % 3 === 0 ? when(-600 - i) : null,
      fuelSource: i % 3 === 0 ? "simulated" : null,
      lastRefuelAt: null, history: [{ point, at: when(-1440), source: "simulated" }], events: [],
    };
  });
  const withEvents = (asset: MapAsset): MapAsset => {
    const events: MapEvent[] = [];
    if (asset.checkoutAt) events.push({ kind: "checkout", at: asset.checkoutAt, detail: `${asset.lastOperator ?? "Demo operator"} checked out equipment` });
    if (asset.lastRefuelAt) events.push({ kind: "refuel", at: asset.lastRefuelAt, detail: "Fictional refueling event" });
    if (asset.fuelAt) events.push({ kind: "fuel", at: asset.fuelAt, detail: `${Math.round(asset.fuelPercent ?? 0)}% simulated fuel reading` });
    if (asset.id === "DEMO-FLK-001") events.push({ kind: "incident", at: when(-65), detail: "Fictional near-miss review at a demo road junction" });
    if (asset.positionAt) events.push({ kind: "movement", at: asset.positionAt, detail: "Simulated position observation" });
    if (asset.returnStatus === "returned" && asset.mobile) events.push({ kind: "return", at: when(-30), detail: "Fictional return to assigned area" });
    return { ...asset, events: events.sort((a, b) => Date.parse(b.at) - Date.parse(a.at)) };
  };
  return [...mobile, ...fixed].map(withEvents);
}

const outward = [demoParking[1].point, ...(demoGraphRoute(demoParking[1].point, px(1270, 390))?.points ?? [])];
const movingPath = [...outward, outward[outward.length - 1], outward[outward.length - 1], ...outward.slice(0, -1).reverse()];
const returnPath = [...(demoGraphRoute(px(940, 390), demoParking[8].point)?.points ?? []), demoParking[8].point];

function interpolate(points: MapPoint[], progress: number): MapPoint {
  const position = Math.min(points.length - 1.000001, Math.max(0, progress * (points.length - 1)));
  const index = Math.floor(position);
  const fraction = position - index;
  return { x: points[index].x + (points[index + 1].x - points[index].x) * fraction,
    y: points[index].y + (points[index + 1].y - points[index].y) * fraction };
}

export function advanceDemoAssets(assets: MapAsset[], sequence: number): MapAsset[] {
  return assets.map((asset) => {
    if (asset.id === "DEMO-GEN-001") {
      const online = sequence % 44 >= 5 && sequence % 44 < 30;
      const nextConnection = online ? "simulated" as const : "offline" as const;
      const changed = asset.connection !== nextConnection;
      const at = when(sequence);
      return { ...asset, connection: nextConnection,
        positionAt: online ? at : asset.positionAt,
        history: online && asset.point ? [...asset.history, { point: asset.point, at, source: "simulated" as const }].slice(-100) : asset.history,
        events: changed ? [{ kind: "movement" as const, at,
          detail: online ? "Demo tracker reconnected" : "Demo tracker stopped reporting" }, ...asset.events] : asset.events };
    }
    if (asset.id === "DEMO-GEN-003") {
      const at = when(sequence);
      if (sequence === 25) return { ...asset, fuelPercent: 85, fuelAt: at, lastRefuelAt: at,
        events: [{ kind: "refuel", at, detail: "Fictional refueling event; tank now 85%" }, ...asset.events] };
      return { ...asset, fuelPercent: Math.max(4, (asset.fuelPercent ?? 9) - 0.025), fuelAt: at };
    }
    if (asset.id !== "DEMO-UTV-022" && asset.id !== "DEMO-FLK-005") return asset;
    const returning = asset.id === "DEMO-FLK-005";
    const duration = returning ? 12 : 60;
    const progress = returning ? Math.min(1, sequence / duration) : (sequence % duration) / duration;
    const point = interpolate(returning ? returnPath : movingPath, progress);
    const at = when(sequence);
    const observation: MapObservation = { point, at, source: "simulated" };
    const arrived = returning && sequence >= duration;
    const events: MapEvent[] = arrived && asset.returnStatus !== "returned" ?
      [{ kind: "return", at, detail: "Demo operator returned equipment to its assigned area" }, ...asset.events] : asset.events;
    return { ...asset, point, positionAt: at, fuelPercent: Math.max(5, (asset.fuelPercent ?? 70) - (arrived ? 0 : 0.035)),
      fuelAt: at, operator: arrived ? null : asset.operator, returnStatus: arrived ? "returned" : "not_returned",
      history: [...asset.history, observation].slice(-100), events };
  });
}

export const demoScenarios = [
  { id: "find", name: "A · Find equipment", assetId: "DEMO-FLK-001" },
  { id: "unreturned", name: "B · Not returned", assetId: "DEMO-GEN-002" },
  { id: "fuel", name: "C · Low fuel alert", assetId: "DEMO-GEN-003" },
  { id: "movement", name: "D · Live movement", assetId: "DEMO-UTV-022" },
  { id: "return", name: "E · Equipment return", assetId: "DEMO-FLK-005" },
  { id: "search", name: "F · Universal search", assetId: "DEMO-FLK-001" },
];
