import type { TrackingPoint, TrackingZone } from "@/lib/tracking/types";

export const DEMO_WIDTH_M = 2500;
export const DEMO_HEIGHT_M = 4800;

// Synthetic 2.5 × 4.8 km (12 km²) reference grid centered on the supplied IMI
// viewport. These are invented coordinates, never operational asset locations.
export function demoCoordinate(point: TrackingPoint) {
  const referenceLatitude = 27.5089855;
  const referenceLongitude = 49.2384049;
  return {
    latitude: referenceLatitude + (DEMO_HEIGHT_M / 2 - point.y) / 111_320,
    longitude: referenceLongitude + (point.x - DEMO_WIDTH_M / 2) / (111_320 * Math.cos(referenceLatitude * Math.PI / 180))
  };
}

export function pointInPolygon(point: TrackingPoint, polygon: TrackingPoint[]) {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const a = polygon[index];
    const b = polygon[previous];
    const crosses = (a.y > point.y) !== (b.y > point.y) &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

export function zoneAt(point: TrackingPoint, zones: TrackingZone[]) {
  // Smallest polygon first gives a specific operational zone precedence over an enclosing yard.
  const area = (polygon: TrackingPoint[]) => Math.abs(polygon.reduce((sum, point, index) => {
    const next = polygon[(index + 1) % polygon.length];
    return sum + point.x * next.y - next.x * point.y;
  }, 0)) / 2;
  return [...zones].sort((a, b) => area(a.polygon) - area(b.polygon)).find((zone) => pointInPolygon(point, zone.polygon)) ?? null;
}
