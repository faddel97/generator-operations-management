import type { TrackingAsset, TrackingCategory, TrackingPoint, TrackingZone } from "@/lib/tracking/types";

// Entirely invented 2.5 × 4.8 km training yard. The north-south coastal shape is
// inspired by public facility references, but these are NOT surveyed boundaries.
export const demoZones: TrackingZone[] = [
  { id: "yard", name: "DEMO coastal yard perimeter", color: "#eee8d9", polygon: [
    { x: 460, y: 180 }, { x: 1940, y: 180 }, { x: 2090, y: 310 },
    { x: 2090, y: 650 }, { x: 2360, y: 650 }, { x: 2360, y: 1040 },
    { x: 2090, y: 1040 }, { x: 2090, y: 1320 }, { x: 2280, y: 1320 },
    { x: 2280, y: 1660 }, { x: 2090, y: 1660 }, { x: 2090, y: 2050 },
    { x: 2390, y: 2050 }, { x: 2390, y: 2480 }, { x: 2090, y: 2480 },
    { x: 2090, y: 2700 }, { x: 2350, y: 2700 }, { x: 2350, y: 3060 },
    { x: 2090, y: 3060 }, { x: 2090, y: 3450 }, { x: 2320, y: 3450 },
    { x: 2320, y: 3820 }, { x: 2050, y: 3820 }, { x: 2050, y: 4250 },
    { x: 1900, y: 4600 }, { x: 650, y: 4600 }, { x: 460, y: 4370 }
  ] },
  { id: "A", name: "Zone A — MRO", color: "#d5eee8", polygon: [{ x: 520, y: 240 }, { x: 1990, y: 240 }, { x: 1990, y: 1260 }, { x: 520, y: 1260 }] },
  { id: "B", name: "Zone B — OSV new build", color: "#dbeafe", polygon: [{ x: 520, y: 1300 }, { x: 1990, y: 1300 }, { x: 1990, y: 2010 }, { x: 520, y: 2010 }] },
  { id: "C", name: "Zone C — Commercial ships", color: "#ede9fe", polygon: [{ x: 520, y: 2050 }, { x: 1990, y: 2050 }, { x: 1990, y: 3410 }, { x: 520, y: 3410 }] },
  { id: "D", name: "Zone D — Jack-up rigs", color: "#fef3c7", polygon: [{ x: 520, y: 3450 }, { x: 1990, y: 3450 }, { x: 1990, y: 4510 }, { x: 520, y: 4510 }] }
];

type Group = { category: TrackingCategory; label: string; count: number; abbreviation: string };
const catalog: Record<"A" | "B" | "C" | "D", Group[]> = {
  A: [
    { category: "generator", label: "MRO Portable Generator", count: 4, abbreviation: "GEN" },
    { category: "forklift", label: "MRO Forklift", count: 2, abbreviation: "FLK" },
    { category: "truck", label: "MRO Service Truck", count: 2, abbreviation: "TRK" },
    { category: "crane", label: "Dockside Mobile Crane", count: 1, abbreviation: "CRN" },
    { category: "trailer", label: "MRO Equipment Trailer", count: 2, abbreviation: "TRL" },
    { category: "machinery", label: "Mobile Compressor", count: 1, abbreviation: "MCH" },
    { category: "portable", label: "Portable Fuel Dispenser", count: 1, abbreviation: "FDP" }
  ],
  B: [
    { category: "generator", label: "OSV Generator", count: 2, abbreviation: "GEN" },
    { category: "forklift", label: "OSV Forklift", count: 3, abbreviation: "FLK" },
    { category: "truck", label: "OSV Materials Truck", count: 2, abbreviation: "TRK" },
    { category: "crane", label: "OSV Mobile Crane", count: 1, abbreviation: "CRN" },
    { category: "trailer", label: "OSV Hull Trailer", count: 2, abbreviation: "TRL" },
    { category: "machinery", label: "Welding Plant", count: 1, abbreviation: "MCH" },
    { category: "portable", label: "Portable Lighting Tower", count: 1, abbreviation: "LGT" }
  ],
  C: [
    { category: "generator", label: "Shipbuilding Generator", count: 3, abbreviation: "GEN" },
    { category: "forklift", label: "Plate Shop Forklift", count: 2, abbreviation: "FLK" },
    { category: "truck", label: "Plate Transport Truck", count: 2, abbreviation: "TRK" },
    { category: "crane", label: "Shipbuilding Mobile Crane", count: 2, abbreviation: "CRN" },
    { category: "trailer", label: "Steel Transport Trailer", count: 2, abbreviation: "TRL" },
    { category: "machinery", label: "Mobile Air Compressor", count: 1, abbreviation: "MCH" },
    { category: "portable", label: "Portable Fuel Dispenser", count: 1, abbreviation: "FDP" }
  ],
  D: [
    { category: "generator", label: "Rig Yard Generator", count: 2, abbreviation: "GEN" },
    { category: "forklift", label: "Rig Yard Forklift", count: 2, abbreviation: "FLK" },
    { category: "truck", label: "Rig Supply Truck", count: 2, abbreviation: "TRK" },
    { category: "crane", label: "Rig Assembly Crane", count: 2, abbreviation: "CRN" },
    { category: "trailer", label: "Rig Module Trailer", count: 1, abbreviation: "TRL" },
    { category: "machinery", label: "Hydraulic Power Unit", count: 2, abbreviation: "MCH" },
    { category: "portable", label: "Portable Fuel Dispenser", count: 1, abbreviation: "FDP" }
  ]
};

export type SeedAsset = Pick<TrackingAsset, "id" | "name" | "category" | "fuelPercent" | "fuelLitres" | "trackerId"> & {
  points: TrackingPoint[];
  online: boolean;
  stale: boolean;
};

const capacityByCategory: Record<TrackingCategory, number> = {
  vehicle: 80, truck: 450, forklift: 75, machinery: 240,
  trailer: 0, portable: 1100, generator: 420, crane: 650
};

const zoneOrder = ["A", "B", "C", "D"] as const;
const zoneStartY: Record<(typeof zoneOrder)[number], number> = { A: 390, B: 1420, C: 2200, D: 3600 };
export const demoSeeds: SeedAsset[] = zoneOrder.flatMap((zone, zoneIndex) => {
  let localIndex = 0;
  const priorCount = zoneOrder.slice(0, zoneIndex).reduce((sum, priorZone) => sum + catalog[priorZone].reduce((count, group) => count + group.count, 0), 0);
  return catalog[zone].flatMap((group) => Array.from({ length: group.count }, (_, groupIndex) => {
    const index = localIndex++;
    const globalIndex = priorCount + index;
    const x = 700 + (index % 4) * 310 + (index % 2) * 25;
    const y = zoneStartY[zone] + Math.floor(index / 4) * 220 + (index % 3) * 10;
    const point = { x, y };
    const online = globalIndex % 11 !== 0;
    const stale = online && globalIndex % 13 === 0;
    const moving = online && !stale && globalIndex % 3 === 0;
    const points = moving ? [point, { x: x + 65, y: y + 25 }, { x: x + 135, y: y + 40 }, { x: x + 190, y: y - 20 }, { x: x + 85, y: y - 35 }] : [point];
    // One simulated truck crosses zones to exercise the existing entry alert logic.
    if (zone === "A" && group.abbreviation === "TRK" && groupIndex === 0) points.splice(0, points.length, point, { x: 1040, y: 930 }, { x: 1110, y: 1210 }, { x: 1180, y: 1430 }, { x: 1260, y: 1660 });
    const fuelPercent = group.category === "trailer" ? null : 28 + (globalIndex * 17) % 68;
    const capacity = group.abbreviation === "FDP" ? 1200 : capacityByCategory[group.category];
    return {
      id: `SIM-${zone}-${group.abbreviation}-${String(groupIndex + 1).padStart(2, "0")}`,
      name: `${group.label} ${String(groupIndex + 1).padStart(2, "0")}`,
      category: group.category,
      fuelPercent,
      fuelLitres: fuelPercent === null ? null : Math.round(capacity * fuelPercent / 100),
      trackerId: `SIM-GPS-${String(globalIndex + 1).padStart(3, "0")}`,
      points, online, stale
    };
  }));
});
