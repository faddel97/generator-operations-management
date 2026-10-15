import { generatorParts } from "@/lib/generator-parts";

export type Vector3Tuple = [number, number, number];
export type PartShape = "frame" | "tank" | "engine" | "head" | "sump" | "radiator" | "fan" | "alternator" | "stator" | "rotor" | "crankshaft" | "piston" | "filter" | "air-filter" | "motor" | "pump" | "battery" | "panel" | "terminal-box" | "breaker" | "pcb" | "muffler" | "coupling" | "stop";
export type AssemblyPart = {
  id: string; name: string; system: string; shape: PartShape;
  position: Vector3Tuple; size: Vector3Tuple; explode: Vector3Tuple;
  color: string; parentId?: string; internal?: boolean; catalogNumber?: number;
  purpose: string; inspection: string; construction: string;
  handling: string; tools: string[]; sourceIds: string[];
};
export type AssemblyConnection = {
  id: string; name: string; kind: "Electrical" | "Control" | "Cooling" | "Fuel" | "Exhaust";
  from: string; to: string; fromPort: string; toPort: string;
  fromOffset: Vector3Tuple; toOffset: Vector3Tuple; bend: Vector3Tuple;
  color: string; description: string;
};
export type AssemblyStage = { name: string; description: string; parts: string[] };
export type EquipmentPackage = {
  id: string; name: string; revision: string; description: string;
  parts: AssemblyPart[]; connections: AssemblyConnection[];
  stages: AssemblyStage[];
  sources: { id: string; title: string; url: string; scope: string }[];
};

const inspectionTools = ["Inspection light", "Applicable OEM service manual", "Task-specific tools: not yet verified"];
const part = (id: string, name: string, system: string, shape: PartShape, position: Vector3Tuple, size: Vector3Tuple, explode: Vector3Tuple, color: string, construction: string, catalogNumber?: number, extra: Partial<AssemblyPart> = {}): AssemblyPart => {
  const reference = generatorParts.find((item) => item.number === catalogNumber);
  return {
    id, name, system, shape, position, size, explode, color, construction, catalogNumber,
    purpose: reference?.purpose ?? "Representative component used to explain the generator's mechanical assembly.",
    inspection: reference?.technicianFocus ?? "Confirm the installed variant, condition, interfaces and applicable service documentation.",
    handling: "Identify the exact installed component and applicable OEM procedure before removal. Record connections and mounting orientation. Component-specific lifting, tightening and replacement instructions are not verified for this training model.",
    tools: inspectionTools, sourceIds: reference ? ["gom"] : [], ...extra,
  };
};

const parts: AssemblyPart[] = [
  part("frame", "Base frame & mounting rails", "Structure", "frame", [0, .11, 0], [1.84, .16, .8], [0, -.12, 0], "#344549", "Typical training construction: fabricated steel rails and elastomer mounts. Exact grade and mount rating unknown.", undefined, { purpose: "Supports the assembly and provides mounting points and vibration isolation." }),
  part("tank", "Fuel day tank", "Fuel", "tank", [-.16, .24, 0], [1.38, .15, .60], [0, -.08, .48], "#435052", "Typical training construction: coated metal tank. Material grade, capacity and wall thickness unverified.", 10),
  part("engine", "Engine block", "Engine", "engine", [-.18, .66, 0], [.67, .45, .43], [-.23, .10, 0], "#347e71", "Typical training construction: cast metal block with machined cylinder and bearing interfaces; exact alloy unverified.", 1),
  part("head", "Cylinder head & rocker cover", "Engine", "head", [-.18, .94, 0], [.69, .16, .44], [-.23, .55, 0], "#408d7b", "Typical training construction: cast cylinder head and metal cover; exact materials unverified.", undefined, { parentId: "engine", purpose: "Contains the combustion chamber interfaces and valve gear; the cover encloses the rocker mechanism." }),
  part("sump", "Engine oil sump", "Engine", "sump", [-.18, .37, 0], [.60, .17, .36], [-.23, -.06, -.38], "#286455", "Typical training construction: pressed or cast metal oil pan; exact material unverified.", undefined, { parentId: "engine", purpose: "Collects the engine's lubricating oil below the crankcase." }),
  part("crankshaft", "Crankshaft", "Engine", "crankshaft", [-.18, .51, 0], [.63, .14, .14], [-.23, .18, -.70], "#9aa9ad", "Typical training construction: machined steel crankshaft. Alloy and heat treatment unverified.", undefined, { internal: true, parentId: "engine", purpose: "Converts piston and connecting-rod motion into shaft rotation." }),
  ...[-.42, -.26, -.10, .06].map((x, i) => part(`piston-${i + 1}`, `Piston & connecting rod ${i + 1}`, "Engine", "piston", [x, .71, 0], [.12, .29, .12], [-.34 + i * .18, .70, -.48], "#aeb9bd", "Typical training construction: alloy piston, metal rings and steel connecting rod; exact grades and clearances unverified.", undefined, { internal: true, parentId: "engine", purpose: "Transfers combustion force through the connecting rod to the crankshaft. This is an illustrative service subassembly." })),
  part("coupling", "Engine–alternator coupling", "Alternator", "coupling", [.22, .65, 0], [.12, .34, .34], [.30, .15, -.48], "#7f8b91", "Typical training construction: metal hub and flexible coupling discs. Interface and torque specifications unverified.", undefined, { purpose: "Transfers engine rotation to the alternator rotor.", sourceIds: ["bc"] }),
  part("alternator", "Alternator housing", "Alternator", "alternator", [.57, .65, 0], [.57, .52, .52], [.62, .10, 0], "#458275", "Typical training construction: metal casing and end brackets. Exact casting material unverified.", 2, { sourceIds: ["gom", "bc"] }),
  part("stator", "Stator & main windings", "Alternator", "stator", [.57, .65, 0], [.40, .43, .43], [.64, .60, -.10], "#bf794c", "Typical training construction: laminated electrical steel and insulated copper windings. Grade, winding schedule and insulation system unverified.", undefined, { parentId: "alternator", internal: true, purpose: "Stationary magnetic structure and windings in which electrical output is induced.", sourceIds: ["bc"] }),
  part("rotor", "Main rotor & shaft", "Alternator", "rotor", [.57, .65, 0], [.58, .24, .24], [.99, .10, .28], "#bd8252", "Typical training construction: metal shaft, magnetic steel and insulated field winding. Exact materials unverified.", undefined, { parentId: "alternator", internal: true, purpose: "Rotates inside the stator to produce the changing magnetic field.", sourceIds: ["bc"] }),
  part("exciter", "Exciter assembly", "Alternator", "motor", [.86, .65, 0], [.13, .29, .29], [1.12, .16, -.27], "#9b7451", "Typical training construction: magnetic steel, insulated copper winding and rectifier components. Exact specification unverified.", undefined, { parentId: "alternator", internal: true, purpose: "Supplies excitation to the main rotor in this representative brushless arrangement.", sourceIds: ["bc"] }),
  part("terminal", "Alternator terminal box", "Electrical", "terminal-box", [.60, .98, 0], [.31, .17, .30], [.64, .58, .38], "#507c73", "Typical training construction: metal enclosure, insulated terminal supports and conductive terminals; exact materials unverified.", undefined, { parentId: "alternator", purpose: "Encloses the alternator's output connections and voltage-regulation components.", sourceIds: ["bc"] }),
  part("avr", "Automatic voltage regulator", "Electrical", "pcb", [.60, 1.00, .01], [.20, .03, .17], [.70, .90, .12], "#287a61", "Typical training construction: electronic PCB and components. Board substrate and component specifications unverified.", 27, { internal: true, parentId: "terminal", sourceIds: ["gom", "bc"] }),
  part("radiator", "Radiator & fan shroud", "Cooling", "radiator", [-.79, .72, 0], [.14, .90, .66], [-.78, .10, 0], "#65777a", "Typical training construction: metal tube-and-fin core, tanks and support frame. Copper/brass versus aluminium construction is unverified.", 3),
  part("fan", "Cooling fan", "Cooling", "fan", [-.65, .72, 0], [.06, .55, .55], [-.47, .20, .48], "#e8d9b1", "Typical training construction: polymer or metal fan blades and metal hub; exact material unverified.", 4),
  part("water-pump", "Water pump", "Cooling", "pump", [-.48, .51, .16], [.15, .16, .15], [-.55, -.01, .63], "#548278", "Typical training construction: cast housing, metal impeller and shaft, bearings and seals. Exact materials unverified.", 6),
  part("air-filter", "Air cleaner assembly", "Air & exhaust", "air-filter", [-.23, 1.17, -.19], [.45, .21, .21], [-.22, .40, -.55], "#424c50", "Typical training construction: metal/polymer housing and filter media. Installed filter type unverified.", 14),
  part("muffler", "Exhaust silencer", "Air & exhaust", "muffler", [.02, 1.48, -.19], [.63, .17, .17], [.10, .50, -.43], "#a4afb1", "Typical training construction: metal shell and internal baffles. Metal grade and thermal insulation unverified.", 21),
  part("oil-filter", "Oil filter", "Lubrication", "filter", [-.12, .47, .31], [.10, .19, .10], [-.15, .02, .83], "#e7d4ab", "Typical training construction: metal shell, filter media and elastomer seals. Exact specification unverified.", 17),
  part("fuel-filter", "Fuel filter / separator", "Fuel", "filter", [-.43, .68, .31], [.10, .18, .10], [-.62, .25, .72], "#e0e3dd", "Typical training construction: housing, filter media, seals and separator bowl. Exact materials unverified.", 12),
  part("fuel-pump", "Fuel injection pump", "Fuel", "pump", [-.13, .71, .30], [.27, .13, .12], [-.10, .40, .67], "#a0aaa7", "Typical training construction: metal housing and precision-machined pump elements. Exact type and materials unverified.", 11),
  part("starter", "Starter motor", "Starting", "motor", [-.01, .43, -.30], [.24, .14, .14], [.01, .01, -.80], "#6d797f", "Typical training construction: metal housing, steel gearing and copper windings. Exact specification unverified.", 25),
  part("charging", "Battery charging alternator", "Starting", "motor", [-.43, .85, -.30], [.17, .15, .15], [-.52, .41, -.60], "#a9b0ad", "Typical training construction: metal housing, steel shaft and insulated copper winding. Exact materials unverified.", 24),
  part("battery", "Starting battery", "Starting", "battery", [.56, .35, .35], [.27, .21, .18], [.51, -.06, .76], "#333c44", "Typical training construction: polymer case, conductive terminals and electrochemical cells. Chemistry and rating unverified.", 22),
  part("panel", "Control panel", "Control", "panel", [.62, 1.24, .18], [.36, .31, .15], [.54, .73, .68], "#d3dbd8", "Typical training construction: coated metal enclosure and electronic controller. This faceplate is illustrative and does not reproduce a specific controller.", 26, { name: "Control panel / controller", sourceIds: ["gom"] }),
  part("breaker", "Output circuit breaker", "Electrical", "breaker", [.66, .96, .30], [.17, .20, .12], [.90, .20, .77], "#354550", "Typical training construction: insulating case with conductive contacts and trip mechanism. Exact material and rating unverified.", 28),
  part("charger", "Battery charger", "Starting", "panel", [.83, .37, -.30], [.17, .15, .10], [.74, -.02, -.69], "#b6c4c4", "Typical training construction: metal enclosure and power electronics. Exact specification unverified.", 23),
  part("stop", "Emergency stop button", "Control", "stop", [.75, 1.22, .285], [.055, .055, .055], [.84, .73, .77], "#bc4745", "Typical training construction: polymer actuator, switch contacts and mounting collar. Exact material unverified.", 33, { parentId: "panel" }),
];

const connection = (id: string, name: string, kind: AssemblyConnection["kind"], from: string, to: string, fromPort: string, toPort: string, fromOffset: Vector3Tuple, toOffset: Vector3Tuple, bend: Vector3Tuple, color: string, description: string): AssemblyConnection => ({ id, name, kind, from, to, fromPort, toPort, fromOffset, toOffset, bend, color, description });
const connections: AssemblyConnection[] = [
  connection("coolant-hot", "Upper coolant hose", "Cooling", "head", "radiator", "Coolant outlet", "Upper inlet", [-.26, .02, .17], [.08, .34, .17], [0, .18, .15], "#4b9eab", "Illustrates the hot-coolant path to the radiator; hose diameter and routing are unverified."),
  connection("coolant-return", "Lower coolant hose", "Cooling", "radiator", "water-pump", "Lower outlet", "Pump inlet", [.08, -.30, .17], [-.03, 0, .02], [0, -.08, .13], "#4b9eab", "Illustrates cooled coolant returning to the pump. This is not a pressure or flow simulation."),
  connection("fuel-supply", "Fuel supply line", "Fuel", "tank", "fuel-filter", "Tank pickup", "Filter inlet", [-.35, .08, .25], [0, -.07, 0], [-.10, 0, .10], "#c59142", "Representative supply connection. Actual hose specification, fittings and route require the installed system drawing."),
  connection("fuel-filter-pump", "Filtered fuel line", "Fuel", "fuel-filter", "fuel-pump", "Filter outlet", "Pump inlet", [0, .07, 0], [-.11, 0, .02], [0, .10, .10], "#c59142", "Connects the filter to the injection pump in the training arrangement."),
  connection("fuel-injection", "Injection lines", "Fuel", "fuel-pump", "head", "Pump outlets", "Injector connections", [0, .06, 0], [0, .08, .17], [0, .12, .08], "#c59142", "A single training path represents multiple injection lines. Actual individual lines and pressure ratings are not modeled."),
  connection("battery-start", "Battery positive → starter", "Electrical", "battery", "starter", "Positive terminal", "Starter supply terminal", [-.08, .11, 0], [.05, .04, -.04], [0, -.12, -.25], "#c26056", "Starting-circuit relationship only. Conductor gauge, protection and exact route are not specified."),
  connection("battery-earth", "Battery negative → frame", "Electrical", "battery", "frame", "Negative terminal", "Bonding point", [.08, .11, 0], [.65, .06, .34], [.15, -.09, .15], "#515f6b", "Representative return/bonding path; the actual bonding and earthing design must be verified."),
  connection("charging-line", "Charging alternator → battery", "Electrical", "charging", "battery", "Charging output", "Positive connection", [.09, .01, 0], [-.08, .11, 0], [0, -.15, -.22], "#c26056", "Illustrates the charging relationship, not a complete charging-circuit schematic."),
  connection("sensor-harness", "Engine sensor harness", "Control", "engine", "panel", "Engine sensor connections", "Controller inputs", [.10, -.04, .23], [-.12, -.15, 0], [0, .17, .18], "#8e83bb", "Represents sensor wiring as one harness; pin numbers and individual circuits remain undocumented."),
  connection("start-control", "Controller → starter control", "Control", "panel", "starter", "Start output", "Solenoid control", [.12, -.15, 0], [-.06, .05, -.01], [.14, -.08, -.20], "#8e83bb", "Functional relationship only. Relay logic, interlocks and terminal pinouts are not specified."),
  connection("output", "Alternator output → breaker", "Electrical", "terminal", "breaker", "Main terminals", "Incoming terminals", [.10, 0, .15], [0, .10, 0], [.18, .07, .15], "#bd8d4c", "A training harness represents the phase/neutral conductors. This is not an installation wiring diagram."),
  connection("exhaust", "Engine exhaust connection", "Exhaust", "head", "muffler", "Exhaust manifold outlet", "Silencer inlet", [.13, -.04, -.23], [-.22, -.08, 0], [0, .10, -.18], "#8d979a", "Shows exhaust routing conceptually; flange, thermal expansion, supports and insulation are unverified."),
];

export const trainingGenerator: EquipmentPackage = {
  id: "gom-diesel-training-v1", name: "Diesel training assembly", revision: "Prototype 1",
  description: "A representative four-cylinder, liquid-cooled generator built to explore component location, assembly and service planning. It is not an exact replica of an SDE, Cummins or Honda unit.",
  parts, connections,
  sources: [
    { id: "gom", title: "GOM generator parts catalog", url: "/parts", scope: "Component purposes and general inspection focus. Catalog photos are reference images, not a verified match to the 3D geometry." },
    { id: "cummins", title: "Cummins C22 D5 / C25 D6 parts catalog (2004)", url: "https://onan.xmsi.net/906-0120%20Cummins%20C22D5%20C25D6%20Parts%20(7-2004).pdf", scope: "General layout and component relationships only. Dimensions, installed part numbers and geometry are not reproduced as an exact OEM configuration." },
    { id: "bc", title: "STAMFORD BC installation, service & maintenance manual", url: "https://www.stamford-avk.com/sites/stamfordavk/files/2020-07/BC-Owners-Manual-English.pdf", scope: "Brushless alternator component terminology and service-document reference. The training geometry does not claim BC dimensional or material accuracy." },
  ],
  stages: [
    { name: "Foundation", description: "Locate the base frame, tank and mounting interfaces. This is an illustrative assembly overview, not a manufacturer work instruction.", parts: ["frame", "tank"] },
    { name: "Power unit", description: "Explore the engine subassemblies and the interfaces between engine, coupling and alternator. Actual alignment and fastening procedures require the applicable manual.", parts: ["frame", "tank", "engine", "head", "sump", "coupling", "alternator", "stator", "rotor", "crankshaft", "piston-1", "piston-2", "piston-3", "piston-4", "exciter"] },
    { name: "Cooling & air", description: "Locate the radiator, fan, pump, air cleaner and silencer. Inspect the displayed coolant and exhaust connection relationships.", parts: ["radiator", "fan", "water-pump", "air-filter", "muffler"] },
    { name: "Fuel & starting", description: "Identify the filtration, injection, lubrication and starting components. Connection paths show relationships; exact hose and cable specifications remain unverified.", parts: ["fuel-filter", "fuel-pump", "oil-filter", "battery", "starter", "charging", "charger"] },
    { name: "Control & output", description: "Locate the control panel, emergency stop, terminal box, AVR and breaker. Inspect the connection list before returning to the complete assembly.", parts: ["panel", "stop", "terminal", "avr", "breaker"] },
    { name: "Complete assembly", description: "Review the complete model and its connections. Physical installation and commissioning require approved site and equipment documents, including mounting, ventilation, exhaust, fuel, grounding and acceptance tests.", parts: parts.map((item) => item.id) },
  ],
};

export const lifecycleTopics = [
  { name: "Installation", text: "Plan the mounting, service access, ventilation, exhaust, fuel supply, earthing and power/control interfaces using the equipment and site drawings. Site-specific dimensions and limits are not part of this training package." },
  { name: "Commissioning", text: "Use the applicable commissioning procedure to document inspections, fluid levels, connection checks, protection settings and acceptance tests. This prototype does not prescribe energization steps or test limits." },
  { name: "Operation", text: "Use the actual controller and generator manuals for startup, loading, monitoring and shutdown. The illustrated controller does not operate equipment or simulate protection behavior." },
  { name: "Maintenance & replacement", text: "Use the selected part's inspection focus, connection list and reference documents to plan the job. Exact intervals, tools, torques, lifting instructions and part numbers must be added for the installed variant." },
];
