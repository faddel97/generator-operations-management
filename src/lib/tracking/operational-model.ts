import type { GeoPolygon } from "@/lib/tracking/geo";

export const FACILITY_KEY = "imi-ras-al-khair";
export const IMI_REFERENCE: [number, number] = [49.2384049, 27.5089855];
export const ZONE_DEFINITIONS = [
  {
    code: "A",
    name: "MRO",
    functionDescription:
      "Maintenance, repair and overhaul of vessels, OSVs and rigs",
    color: "#0f766e",
  },
  {
    code: "B",
    name: "OSV Construction",
    functionDescription: "New construction of offshore support vessels",
    color: "#2563eb",
  },
  {
    code: "C",
    name: "Commercial Shipbuilding",
    functionDescription: "Construction of commercial vessels",
    color: "#7c3aed",
  },
  {
    code: "D",
    name: "Offshore Rig Construction",
    functionDescription:
      "New construction of offshore jack-up rigs and related equipment",
    color: "#d97706",
  },
] as const;

export type OperationalZone = {
  id: string;
  code: string;
  name: string;
  functionDescription: string;
  color: string;
  polygon: GeoPolygon | null;
  draftPolygon: GeoPolygon | null;
  geometryStatus: string;
  areaM2: number | null;
};
export type OperationalPosition = {
  id: number;
  longitude: number;
  latitude: number;
  recordedAt: string;
  receivedAt: string;
  accuracyM: number | null;
  speedKph: number | null;
  heading: number | null;
  source: "gps" | "manual";
  fuelPercent: number | null;
};
export type OperationalAsset = {
  id: string;
  code: string;
  name: string;
  category: string;
  generatorId: string | null;
  availability: "available" | "in_use" | "maintenance" | "unknown";
  availabilityUpdatedAt: string | null;
  registeredZoneId: string | null;
  position: OperationalPosition | null;
  locatedZoneId: string | null;
  insideYard: boolean | null;
  trackerState: "reporting" | "stale" | "offline" | "not_fitted" | "manual";
  hardwareId: string | null;
};
export type OperationalSnapshot = {
  schemaReady: boolean;
  truncated: boolean;
  error: string | null;
  fetchedAt: string;
  facility: {
    key: string;
    name: string;
    polygon: GeoPolygon | null;
    draftPolygon: GeoPolygon | null;
    geometryStatus: string;
    areaM2: number | null;
    configuredAt: string | null;
    geometrySource: string | null;
  };
  zones: OperationalZone[];
  assets: OperationalAsset[];
  unlinkedGenerators: { id: string; code: string; name: string }[];
  alerts: {
    id: string;
    assetId: string;
    message: string;
    severity: string;
    occurredAt: string;
  }[];
};
