import type { MapPoint } from "./model";

// Demonstration digitization traced from the supplied clean overhead, normalized
// to the 1800 × 1260 annotation-preview frame and scaled to the PDF coordinates.
// It is NOT a surveyed road inventory, official naming scheme, or GPS geometry.
export const overviewPoint = (x: number, y: number): MapPoint => ({
  x: x * 6429 / 1800,
  y: y * 4500 / 1260,
});

type OverviewPoint = [number, number];
const point = ([x, y]: OverviewPoint) => overviewPoint(x, y);

export type VectorBuilding = {
  id: string;
  code: string;
  name: string;
  kind: "building" | "area";
  outline: MapPoint[];
  point: MapPoint;
  accessNode: string;
};

const building = (id: number, code: string, name: string, kind: VectorBuilding["kind"],
  outline: OverviewPoint[], accessNode: string): VectorBuilding => {
  const points = outline.map(point);
  const [corridor, coordinate] = accessNode.split("-");
  const accessId = corridor === "west" ? "350-310" :
    `${coordinate}-${corridor === "north" ? 250 : corridor === "south" ? 520 : 390}`;
  return { id: `DEMO-LOC-${String(id).padStart(2, "0")}`, code, name, kind, outline: points,
    point: { x: points.reduce((n, p) => n + p.x, 0) / points.length,
      y: points.reduce((n, p) => n + p.y, 0) / points.length }, accessNode: accessId };
};

export const demoBuildings: VectorBuilding[] = [
  building(1, "N-CMP-A", "North service compound", "building", [[405,143],[564,143],[564,233],[405,233]], "north-620"),
  building(2, "N-CMP-B", "North operations campus", "building", [[665,140],[882,140],[882,233],[665,233]], "north-790"),
  building(3, "GATE-W", "West entry gate", "building", [[249,157],[283,157],[283,199],[249,199]], "west-310"),
  building(4, "SUP-W", "West support offices", "building", [[440,265],[600,265],[600,345],[440,345]], "central-470"),
  building(5, "SHOP-N1", "North workshop A", "building", [[644,267],[786,267],[786,342],[644,342]], "north-620"),
  building(6, "SHOP-N2", "North workshop B", "building", [[811,268],[925,268],[925,341],[811,341]], "north-790"),
  building(7, "SHOP-N3", "North workshop C", "building", [[961,265],[1055,265],[1055,344],[961,344]], "north-940"),
  building(8, "UTIL-E", "East utility block", "building", [[1168,263],[1263,263],[1263,350],[1168,350]], "north-1270"),
  building(9, "LOG-E", "East logistics compound", "building", [[1357,263],[1518,263],[1518,378],[1357,378]], "central-1450"),
  building(10, "WH-W", "West warehouse", "building", [[236,416],[330,416],[330,533],[236,533]], "central-350"),
  building(11, "FAB-W", "West fabrication shop", "building", [[444,405],[535,405],[535,489],[444,489]], "central-470"),
  building(12, "ASSY-W", "West assembly hall", "building", [[554,411],[606,411],[606,540],[554,540]], "central-620"),
  building(13, "FAB-C", "Central fabrication hall", "building", [[660,413],[740,413],[740,549],[660,549]], "central-620"),
  building(14, "SHED-C", "Central covered shed", "building", [[759,410],[900,410],[900,478],[759,478]], "central-790"),
  building(15, "MAR-W", "Marine workshop west", "building", [[1001,411],[1078,411],[1078,472],[1001,472]], "central-940"),
  building(16, "MAR-C", "Marine workshop central", "building", [[1092,410],[1170,410],[1170,471],[1092,471]], "central-1110"),
  building(17, "MAR-E", "Marine workshop east", "building", [[1190,410],[1271,410],[1271,472],[1190,472]], "central-1270"),
  building(18, "SHOP-E1", "East service shop A", "building", [[1314,410],[1385,410],[1385,468],[1314,468]], "central-1270"),
  building(19, "SHOP-E2", "East service shop B", "building", [[1403,408],[1455,408],[1455,467],[1403,467]], "central-1450"),
  building(20, "YARD-C", "Central equipment yard", "area", [[638,552],[746,552],[746,623],[638,623]], "south-620"),
  building(21, "YARD-E", "East equipment yard", "area", [[1050,521],[1150,521],[1150,622],[1050,622]], "south-1110"),
  building(22, "QUAY-E", "Eastern quayside services", "area", [[1365,520],[1517,520],[1517,625],[1365,625]], "south-1450"),
  building(23, "D1", "D1 industrial block", "area", [[180,393],[620,393],[620,638],[180,638]], "central-350"),
  building(24, "D2", "D2 industrial block", "area", [[625,395],[953,395],[953,638],[625,638]], "central-790"),
  building(25, "QUAY-C", "Central berth access", "area", [[956,475],[1041,475],[1041,642],[956,642]], "south-940"),
];

export const vectorWater: MapPoint[][] = [
  [[0,650],[180,650],[180,642],[620,642],[620,652],[755,652],[755,523],[922,523],[922,650],
    [958,650],[958,472],[1044,472],[1044,651],[1152,651],[1152,546],[1233,546],[1233,651],
    [1355,651],[1355,518],[1527,518],[1527,650],[1800,650],[1800,1260],[0,1260]].map(([x, y]) => overviewPoint(x, y)),
];

export const vectorBreakwaters: MapPoint[][] = [
  [[180,643],[180,900],[1166,900],[1520,1165],[1603,1165]].map(([x, y]) => overviewPoint(x, y)),
  [[1530,255],[1530,836],[1736,1025]].map(([x, y]) => overviewPoint(x, y)),
];

type RoadLine = { id: string; name: string; className: "primary" | "service"; stops: OverviewPoint[] };
const roadLines: RoadLine[] = [
  { id: "north", name: "North Service Road", className: "primary", stops: [[350,250],[620,250],[790,250],[940,250],[1110,250],[1270,250],[1450,250],[1530,250]] },
  { id: "central", name: "Central Access Road", className: "primary", stops: [[190,390],[350,390],[470,390],[620,390],[790,390],[940,390],[1110,390],[1270,390],[1450,390],[1530,390]] },
  { id: "south", name: "South Yard Lane", className: "service", stops: [[620,520],[940,520],[1110,520],[1270,520],[1450,520],[1530,520]] },
  { id: "west", name: "West Access Loop", className: "service", stops: [[350,250],[350,310],[350,390]] },
  { id: "west-loop", name: "West Yard Loop", className: "service", stops: [[350,310],[190,310],[190,390]] },
  { id: "link-620", name: "Fabrication Link", className: "service", stops: [[620,250],[620,390],[620,520]] },
  { id: "link-790", name: "Workshop Link", className: "service", stops: [[790,250],[790,390]] },
  { id: "link-940", name: "Berth Link", className: "service", stops: [[940,250],[940,390],[940,520]] },
  { id: "link-1110", name: "Marine Services Link", className: "service", stops: [[1110,250],[1110,390],[1110,520]] },
  { id: "link-1270", name: "East Yard Link", className: "service", stops: [[1270,250],[1270,390],[1270,520]] },
  { id: "link-1450", name: "East Logistics Link", className: "service", stops: [[1450,250],[1450,390],[1450,520]] },
  { id: "perimeter", name: "East Perimeter Road", className: "service", stops: [[1530,250],[1530,390],[1530,520]] },
];

export const vectorRoads = roadLines.map((line) => ({ id: line.id, name: line.name,
  className: line.className, points: line.stops.map(point) }));

export type DemoGraphNode = { id: string; point: MapPoint };
export type DemoGraphEdge = { from: string; to: string; road: string; points: MapPoint[] };
const nodeId = (p: OverviewPoint) => `${p[0]}-${p[1]}`;
const graphNodes = new Map<string, DemoGraphNode>();
export const demoGraphEdges: DemoGraphEdge[] = [];
for (const road of roadLines) {
  for (const stop of road.stops) graphNodes.set(nodeId(stop), { id: nodeId(stop), point: point(stop) });
  for (let i = 1; i < road.stops.length; i++) demoGraphEdges.push({
    from: nodeId(road.stops[i - 1]), to: nodeId(road.stops[i]), road: road.name,
    points: [point(road.stops[i - 1]), point(road.stops[i])],
  });
}
export const demoGraphNodes = [...graphNodes.values()];

const distance = (a: MapPoint, b: MapPoint) => Math.hypot(a.x - b.x, a.y - b.y);
export type DemoRoute = { points: MapPoint[]; roads: string[]; metres: number; startAccess: MapPoint; endAccess: MapPoint };

export function demoGraphRoute(start: MapPoint, end: MapPoint): DemoRoute | null {
  const closest = (target: MapPoint) => demoGraphNodes.reduce((best, node) =>
    distance(node.point, target) < distance(best.point, target) ? node : best);
  const origin = closest(start), destination = closest(end);
  const queue = new Set(demoGraphNodes.map((node) => node.id));
  const cost = new Map<string, number>([[origin.id, 0]]);
  const prior = new Map<string, { node: string; road: string }>();
  while (queue.size) {
    let current: string | null = null;
    for (const id of queue) if (cost.has(id) && (!current || cost.get(id)! < cost.get(current)!)) current = id;
    if (!current) break;
    if (current === destination.id) break;
    queue.delete(current);
    for (const edge of demoGraphEdges) {
      const next = edge.from === current ? edge.to : edge.to === current ? edge.from : null;
      if (!next || !queue.has(next)) continue;
      const step = distance(graphNodes.get(current)!.point, graphNodes.get(next)!.point);
      if (cost.get(current)! + step < (cost.get(next) ?? Infinity)) {
        cost.set(next, cost.get(current)! + step);
        prior.set(next, { node: current, road: edge.road });
      }
    }
  }
  if (!cost.has(destination.id)) return null;
  const chain = [destination.id], roads: string[] = [];
  while (chain[0] !== origin.id) {
    const step = prior.get(chain[0]);
    if (!step) return null;
    roads.unshift(step.road);
    chain.unshift(step.node);
  }
  // The drawing has no surveyed scale. This is an explicitly fictional demo estimate.
  const metres = Math.round((cost.get(destination.id) ?? 0) * 0.35);
  return { points: chain.map((id) => graphNodes.get(id)!.point), roads,
    metres, startAccess: origin.point, endAccess: destination.point };
}

export function demoRouteSteps(route: DemoRoute, startName: string, endName: string): string[] {
  const names = route.roads.filter((road, index) => index === 0 || road !== route.roads[index - 1]);
  return [`Start at mapped access for ${startName}`,
    ...names.map((name, index) => `${index === 0 ? "Follow" : "Continue on"} ${name} (demo)`),
    `Arrive at mapped access for ${endName}`];
}
