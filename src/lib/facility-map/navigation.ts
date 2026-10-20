import type { FacilityMapSnapshot, MapPoint } from "./model";

const distance = (a: MapPoint, b: MapPoint) => Math.hypot(a.x - b.x, a.y - b.y);

export function verifiedRoute(start: MapPoint, end: MapPoint,
  nodes: FacilityMapSnapshot["routeNodes"], edges: FacilityMapSnapshot["routeEdges"], mode: "walk" | "vehicle"): MapPoint[] | null {
  const active = nodes.filter((node) => node.verified);
  const closest = (point: MapPoint) => active.reduce<typeof active[number] | null>((best, node) =>
    !best || distance(node.point, point) < distance(best.point, point) ? node : best, null);
  const origin = closest(start);
  const destination = closest(end);
  // Refuse to invent building access spurs across unmapped ground.
  if (!origin || !destination || distance(origin.point, start) > 65 || distance(destination.point, end) > 65) return null;
  const byId = new Map(active.map((node) => [node.id, node]));
  const adjacency = new Map<string, Array<{ id: string; weight: number }>>();
  for (const edge of edges) {
    if (!edge.verified || edge.restricted || !edge.permittedModes.includes(mode)) continue;
    const a = byId.get(edge.from), b = byId.get(edge.to);
    if (!a || !b) continue;
    const weight = distance(a.point, b.point);
    adjacency.set(a.id, [...adjacency.get(a.id) ?? [], { id: b.id, weight }]);
    adjacency.set(b.id, [...adjacency.get(b.id) ?? [], { id: a.id, weight }]);
  }
  const remaining = new Set(byId.keys());
  const cost = new Map<string, number>([[origin.id, 0]]);
  const prior = new Map<string, string>();
  while (remaining.size) {
    let current: string | null = null;
    for (const id of remaining) if (cost.has(id) && (!current || cost.get(id)! < cost.get(current)!)) current = id;
    if (!current) break;
    if (current === destination.id) break;
    remaining.delete(current);
    for (const neighbor of adjacency.get(current) ?? []) {
      const next = cost.get(current)! + neighbor.weight;
      if (next < (cost.get(neighbor.id) ?? Infinity)) { cost.set(neighbor.id, next); prior.set(neighbor.id, current); }
    }
  }
  if (!cost.has(destination.id)) return null;
  const chain = [destination.id];
  while (chain[0] !== origin.id) {
    const before = prior.get(chain[0]);
    if (!before) return null;
    chain.unshift(before);
  }
  return chain.map((id) => byId.get(id)!.point);
}

export function demoIllustrativeRoute(start: MapPoint, end: MapPoint, road: MapPoint[]): MapPoint[] {
  const nearest = (point: MapPoint) => road.reduce((best, candidate, i) =>
    distance(candidate, point) < distance(road[best], point) ? i : best, 0);
  const a = nearest(start), b = nearest(end);
  const segment = a <= b ? road.slice(a, b + 1) : road.slice(b, a + 1).reverse();
  return [start, ...segment, end];
}
