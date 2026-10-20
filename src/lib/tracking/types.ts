export type TrackingCategory = "vehicle" | "truck" | "forklift" | "machinery" | "trailer" | "portable" | "generator" | "crane";
export type TrackingConnection = "reporting" | "stale" | "offline";
export type TrackingOperation = "moving" | "stationary" | "unknown";
export type TrackingPoint = { x: number; y: number };

export type TrackingZone = {
  id: string;
  name: string;
  color: string;
  polygon: TrackingPoint[];
  restricted?: boolean;
};

export type TrackingPosition = TrackingPoint & {
  eventId: string;
  recordedAt: string;
  receivedAt: string;
  accuracyM: number;
  speedKph: number;
  heading: number | null;
  zoneId: string | null;
};

export type TrackingAsset = {
  id: string;
  name: string;
  category: TrackingCategory;
  operation: TrackingOperation;
  connection: TrackingConnection;
  fuelPercent: number | null;
  fuelLitres: number | null;
  trackerId: string;
  position: TrackingPosition | null;
  history: TrackingPosition[];
};

export type TrackingAlert = {
  id: string;
  assetId: string;
  kind: "offline" | "stale" | "zone_entry" | "zone_exit" | "poor_accuracy";
  severity: "info" | "warning" | "critical";
  message: string;
  occurredAt: string;
  acknowledgedAt: string | null;
};

export type TrackingSnapshot = {
  dataVersion?: number;
  mode: "simulation" | "live";
  generatedAt: string;
  sequence: number;
  running: boolean;
  assets: TrackingAsset[];
  zones: TrackingZone[];
  alerts: TrackingAlert[];
};
