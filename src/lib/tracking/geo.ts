export type LngLat = [number, number];
export type GeoPolygon = { type: "Polygon"; coordinates: [LngLat[]] };

const earthRadiusM = 6371008.8;

export function closeRing(points: LngLat[]): LngLat[] {
  if (!points.length) return points;
  const first = points[0];
  const last = points[points.length - 1];
  return first[0] === last[0] && first[1] === last[1]
    ? points
    : [...points, first];
}

export function polygonAreaM2(polygon: GeoPolygon): number {
  // Chamberlain–Duquette spherical area: WGS84 coordinates, metres² approximation.
  const ring = closeRing(polygon.coordinates[0]);
  let total = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [lon1, lat1] = ring[i];
    const [lon2, lat2] = ring[i + 1];
    total +=
      (((lon2 - lon1) * Math.PI) / 180) *
      (2 + Math.sin((lat1 * Math.PI) / 180) + Math.sin((lat2 * Math.PI) / 180));
  }
  return Math.abs((total * earthRadiusM * earthRadiusM) / 2);
}

export function pathLengthM(points: LngLat[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const [lon1, lat1] = points[i - 1];
    const [lon2, lat2] = points[i];
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    total += 2 * earthRadiusM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  return total;
}

function cross(a: LngLat, b: LngLat, c: LngLat) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function properIntersection(a: LngLat, b: LngLat, c: LngLat, d: LngLat) {
  return (
    cross(a, b, c) * cross(a, b, d) < -1e-18 &&
    cross(c, d, a) * cross(c, d, b) < -1e-18
  );
}

function pointOnBoundary(point: LngLat, polygon: GeoPolygon) {
  const ring = polygon.coordinates[0];
  for (let i = 0; i < ring.length - 1; i++) {
    const a = ring[i];
    const b = ring[i + 1];
    if (
      Math.abs(cross(a, b, point)) < 1e-12 &&
      point[0] >= Math.min(a[0], b[0]) - 1e-10 &&
      point[0] <= Math.max(a[0], b[0]) + 1e-10 &&
      point[1] >= Math.min(a[1], b[1]) - 1e-10 &&
      point[1] <= Math.max(a[1], b[1]) + 1e-10
    )
      return true;
  }
  return false;
}

function strictlyInside(point: LngLat, polygon: GeoPolygon): boolean {
  if (pointOnBoundary(point, polygon)) return false;
  const ring = polygon.coordinates[0];
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i];
    const b = ring[j];
    if (
      a[1] > point[1] !== b[1] > point[1] &&
      point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      inside = !inside;
  }
  return inside;
}

export function pointInGeoPolygon(point: LngLat, polygon: GeoPolygon): boolean {
  return pointOnBoundary(point, polygon) || strictlyInside(point, polygon);
}

export function validatePolygon(value: unknown): {
  polygon: GeoPolygon | null;
  error: string | null;
} {
  if (!value || typeof value !== "object")
    return { polygon: null, error: "Expected a GeoJSON Polygon." };
  const candidate = value as { type?: unknown; coordinates?: unknown };
  if (
    candidate.type !== "Polygon" ||
    !Array.isArray(candidate.coordinates) ||
    candidate.coordinates.length !== 1 ||
    !Array.isArray(candidate.coordinates[0])
  )
    return { polygon: null, error: "Use a single-ring GeoJSON Polygon." };
  const raw = candidate.coordinates[0];
  if (raw.length < 3 || raw.length > 501)
    return { polygon: null, error: "A boundary needs 3–500 vertices." };
  const points: LngLat[] = [];
  for (const entry of raw) {
    if (
      !Array.isArray(entry) ||
      entry.length !== 2 ||
      !entry.every(
        (number) => typeof number === "number" && Number.isFinite(number),
      ) ||
      entry[0] < -180 ||
      entry[0] > 180 ||
      entry[1] < -90 ||
      entry[1] > 90
    )
      return { polygon: null, error: "Invalid longitude/latitude coordinate." };
    points.push([entry[0], entry[1]]);
  }
  const ring = closeRing(points);
  if (ring.length < 4)
    return { polygon: null, error: "A boundary needs 3 unique vertices." };
  for (let i = 0; i < ring.length - 1; i++) {
    if (ring[i][0] === ring[i + 1][0] && ring[i][1] === ring[i + 1][1])
      return { polygon: null, error: "Duplicate adjacent vertices." };
    for (let j = i + 2; j < ring.length - 1; j++) {
      if (i === 0 && j === ring.length - 2) continue;
      if (properIntersection(ring[i], ring[i + 1], ring[j], ring[j + 1]))
        return { polygon: null, error: "Boundary crosses itself." };
    }
  }
  const polygon: GeoPolygon = { type: "Polygon", coordinates: [ring] };
  if (polygonAreaM2(polygon) < 1 || polygonAreaM2(polygon) > 1e10)
    return { polygon: null, error: "Boundary area is implausible." };
  return { polygon, error: null };
}

export function polygonsOverlap(a: GeoPolygon, b: GeoPolygon) {
  const ar = a.coordinates[0];
  const br = b.coordinates[0];
  for (let i = 0; i < ar.length - 1; i++)
    for (let j = 0; j < br.length - 1; j++)
      if (properIntersection(ar[i], ar[i + 1], br[j], br[j + 1])) return true;
  const centroid = (ring: LngLat[]): LngLat => {
    const vertices = ring.slice(0, -1);
    return [
      vertices.reduce((sum, point) => sum + point[0], 0) / vertices.length,
      vertices.reduce((sum, point) => sum + point[1], 0) / vertices.length,
    ];
  };
  const interiorSamples = (ring: LngLat[], polygon: GeoPolygon): LngLat[] => {
    const center = centroid(ring);
    return [
      center,
      ...ring
        .slice(0, -1)
        .map((vertex): LngLat => [
          (center[0] + vertex[0]) / 2,
          (center[1] + vertex[1]) / 2,
        ]),
    ].filter((point) => strictlyInside(point, polygon));
  };
  return (
    ar.slice(0, -1).some((point) => strictlyInside(point, b)) ||
    br.slice(0, -1).some((point) => strictlyInside(point, a)) ||
    interiorSamples(ar, a).some((point) => strictlyInside(point, b)) ||
    interiorSamples(br, b).some((point) => strictlyInside(point, a))
  );
}

export function polygonWithin(inner: GeoPolygon, outer: GeoPolygon) {
  if (
    !inner.coordinates[0]
      .slice(0, -1)
      .every((point) => pointInGeoPolygon(point, outer))
  )
    return false;
  const a = inner.coordinates[0];
  const b = outer.coordinates[0];
  for (let i = 0; i < a.length - 1; i++)
    for (let j = 0; j < b.length - 1; j++)
      if (properIntersection(a[i], a[i + 1], b[j], b[j + 1])) return false;
  return true;
}
