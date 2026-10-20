export const MAP_WIDTH = 6429;
export const MAP_HEIGHT = 4500;
export const MAP_SCALE = 16;

export type MapPoint = { x: number; y: number };
export type MapPlace = {
  id: string;
  code: string;
  name: string;
  kind: "building" | "area" | "gate" | "parking" | "annotation";
  point: MapPoint;
  source: "demo" | "admin" | "pdf";
  reviewRequired?: boolean;
  radiusPx?: number;
};
export type MapObservation = {
  point: MapPoint;
  at: string;
  source: "simulated" | "gps" | "manual";
};
export type MapEvent = { kind: "checkout" | "return" | "refuel" | "fuel" | "movement"; at: string; detail: string };
export type MapAsset = {
  id: string;
  name: string;
  category: string;
  mobile: boolean;
  demo: boolean;
  point: MapPoint | null;
  positionAt: string | null;
  positionSource: string | null;
  connection: "simulated" | "reporting" | "stale" | "offline" | "manual" | "not_connected";
  operator: string | null;
  lastOperator: string | null;
  checkoutAt: string | null;
  returnDeadline: string | null;
  returnStatus: "returned" | "not_returned" | "overdue" | "unknown";
  parkingId: string | null;
  fuelCapacity: number | null;
  fuelPercent: number | null;
  fuelAt: string | null;
  fuelSource: string | null;
  lastRefuelAt: string | null;
  history: MapObservation[];
  events: MapEvent[];
};
export type ControlPoint = { x: number; y: number; latitude: number; longitude: number };
export type Calibration = {
  points: ControlPoint[];
  status: "draft" | "published";
  rmsPx: number | null;
};
export type MapTranslation = { id: string; x: number; y: number; width: number; height: number; sourceText: string; englishText: string };
export type FacilityMapSnapshot = {
  assets: MapAsset[];
  places: MapPlace[];
  calibration: Calibration | null;
  translations: MapTranslation[];
  routeNodes: Array<{ id: string; name: string; point: MapPoint; verified: boolean }>;
  routeEdges: Array<{ id: string; from: string; to: string; restricted: boolean; verified: boolean; permittedModes: string[] }>;
  schemaReady: boolean;
  error: string | null;
  fetchedAt: string;
};

export function sourceToMap(point: MapPoint): [number, number] {
  return [-point.y / MAP_SCALE, point.x / MAP_SCALE];
}

export function mapToSource(lat: number, lng: number): MapPoint {
  return { x: lng * MAP_SCALE, y: -lat * MAP_SCALE };
}

export function fuelLitres(asset: MapAsset): number | null {
  return asset.fuelCapacity !== null && asset.fuelPercent !== null
    ? Math.round(asset.fuelCapacity * asset.fuelPercent / 100)
    : null;
}

export function fuelState(asset: MapAsset): "critical" | "low" | "normal" | "unavailable" {
  if (asset.fuelPercent === null) return "unavailable";
  if (asset.fuelPercent < 15) return "critical";
  if (asset.fuelPercent < 30) return "low";
  return "normal";
}
