export type GeneratorPart = {
  number: number;
  name: string;
  category: string;
  purpose: string;
  technicianFocus: string;
};

export const generatorParts: GeneratorPart[] = [
  {
    number: 1,
    name: "Engine",
    category: "Power Production",
    purpose: "Converts diesel fuel into mechanical power.",
    technicianFocus: "Oil, coolant, leaks, mounting, abnormal noise, smoke, and operating temperature."
  },
  {
    number: 2,
    name: "Alternator",
    category: "Power Production",
    purpose: "Converts mechanical power into electrical power.",
    technicianFocus: "Voltage output, insulation condition, bearings, terminals, heater, and winding cleanliness."
  },
  {
    number: 3,
    name: "Radiator",
    category: "Cooling System",
    purpose: "Cools the engine coolant.",
    technicianFocus: "Core cleanliness, leaks, coolant level, cap condition, blocked fins, and hose connections."
  },
  {
    number: 4,
    name: "Cooling Fan",
    category: "Cooling System",
    purpose: "Forces air through the radiator to cool the coolant.",
    technicianFocus: "Blade condition, clearance, vibration, guards, and airflow obstruction."
  },
  {
    number: 5,
    name: "Fan V-Belt",
    category: "Cooling System",
    purpose: "Drives the fan, water pump, and charging alternator.",
    technicianFocus: "Tension, cracks, wear, alignment, glazing, and spare belt availability."
  },
  {
    number: 6,
    name: "Water Pump",
    category: "Cooling System",
    purpose: "Circulates coolant through the engine and radiator.",
    technicianFocus: "Leaks, bearing noise, pulley condition, flow performance, and gasket condition."
  },
  {
    number: 7,
    name: "Thermostat",
    category: "Cooling System",
    purpose: "Regulates engine operating temperature.",
    technicianFocus: "Opening temperature, overheating symptoms, stuck-open/stuck-closed behavior, and housing leaks."
  },
  {
    number: 8,
    name: "Coolant Hoses",
    category: "Cooling System",
    purpose: "Carry coolant between the engine and radiator.",
    technicianFocus: "Cracks, swelling, soft spots, clamps, chafing, and leakage under pressure."
  },
  {
    number: 9,
    name: "Expansion Tank",
    category: "Cooling System",
    purpose: "Stores excess coolant and maintains system pressure.",
    technicianFocus: "Coolant level, cap condition, cracks, overflow line, and pressure stability."
  },
  {
    number: 10,
    name: "Fuel Tank / Day Tank",
    category: "Fuel System",
    purpose: "Stores diesel fuel for engine operation.",
    technicianFocus: "Fuel level, water contamination, leaks, venting, drain valve, and level indicator."
  },
  {
    number: 11,
    name: "Fuel Pump",
    category: "Fuel System",
    purpose: "Delivers fuel from the tank to the engine.",
    technicianFocus: "Pressure, leakage, air ingress, priming, fittings, and abnormal noise."
  },
  {
    number: 12,
    name: "Fuel Filter",
    category: "Fuel System",
    purpose: "Removes contaminants and water from diesel fuel.",
    technicianFocus: "Replacement interval, blockage, water separator, seals, and logged filter changes."
  },
  {
    number: 13,
    name: "Fuel Injectors",
    category: "Fuel System",
    purpose: "Spray fuel into the combustion chamber in fine mist.",
    technicianFocus: "Spray quality, leakage, smoke, misfire, engine roughness, and service history."
  },
  {
    number: 14,
    name: "Air Filter",
    category: "Air & Exhaust",
    purpose: "Prevents dust and dirt from entering the engine.",
    technicianFocus: "Restriction indicator, dust loading, housing seal, replacement interval, and intake blockage."
  },
  {
    number: 15,
    name: "Turbocharger",
    category: "Air & Exhaust",
    purpose: "Increases engine power by supplying compressed air to the engine.",
    technicianFocus: "Oil leaks, shaft play, boost pressure, intake condition, abnormal sound, and smoke."
  },
  {
    number: 16,
    name: "Oil Pump",
    category: "Lubrication",
    purpose: "Circulates engine oil under pressure.",
    technicianFocus: "Oil pressure, leaks, pickup restriction, pump wear symptoms, and startup pressure response."
  },
  {
    number: 17,
    name: "Oil Filter",
    category: "Lubrication",
    purpose: "Removes contaminants from engine oil.",
    technicianFocus: "Replacement interval, leaks, filter bypass signs, correct part number, and service date."
  },
  {
    number: 18,
    name: "Oil Cooler",
    category: "Lubrication",
    purpose: "Reduces engine oil temperature.",
    technicianFocus: "Oil/coolant mixing signs, leaks, temperature stability, and blocked passages."
  },
  {
    number: 19,
    name: "Exhaust Manifold",
    category: "Air & Exhaust",
    purpose: "Collects exhaust gases from the cylinders.",
    technicianFocus: "Cracks, gasket leaks, loose bolts, hot spots, and exhaust discoloration."
  },
  {
    number: 20,
    name: "Exhaust Pipe",
    category: "Air & Exhaust",
    purpose: "Carries exhaust gases away from the engine.",
    technicianFocus: "Leaks, supports, corrosion, insulation, flexible section, and safe discharge route."
  },
  {
    number: 21,
    name: "Silencer / Muffler",
    category: "Air & Exhaust",
    purpose: "Reduces exhaust noise.",
    technicianFocus: "Corrosion, mounting, leaks, excessive noise, rain cap, and back pressure."
  },
  {
    number: 22,
    name: "Battery",
    category: "Starting & Control",
    purpose: "Starts the engine and supplies DC power.",
    technicianFocus: "Voltage, electrolyte level, terminals, corrosion, load test result, and expiry date."
  },
  {
    number: 23,
    name: "Battery Charger",
    category: "Starting & Control",
    purpose: "Keeps the batteries fully charged.",
    technicianFocus: "Float voltage, charger alarm, AC supply, DC output, wiring, and charger mode."
  },
  {
    number: 24,
    name: "Charging Alternator",
    category: "Starting & Control",
    purpose: "Charges the batteries while the engine is running.",
    technicianFocus: "Charging voltage, belt drive, pulley, bearings, wiring, and warning indication."
  },
  {
    number: 25,
    name: "Starter Motor",
    category: "Starting & Control",
    purpose: "Cranks the engine during starting.",
    technicianFocus: "Cranking speed, solenoid, cables, current draw, mounting bolts, and repeated-start behavior."
  },
  {
    number: 26,
    name: "DSE7320 Controller",
    category: "Control & Protection",
    purpose: "Controls, monitors, and protects the generator set.",
    technicianFocus: "Alarms, event log, AUTO mode, sensor readings, start/stop signals, and configuration backup."
  },
  {
    number: 27,
    name: "AVR",
    category: "Control & Protection",
    purpose: "Maintains stable generator output voltage.",
    technicianFocus: "Voltage stability, sensing wires, excitation output, adjustment, and replacement history."
  },
  {
    number: 28,
    name: "MCCB",
    category: "Electrical Distribution",
    purpose: "Protects the generator from overloads and short circuits.",
    technicianFocus: "Trip setting, mechanical operation, terminals, heat marks, interlock, and trip history."
  },
  {
    number: 29,
    name: "Busbar",
    category: "Electrical Distribution",
    purpose: "Distributes electrical power.",
    technicianFocus: "Tightness, insulation, discoloration, clearance, supports, and thermography findings."
  },
  {
    number: 30,
    name: "Cable Terminations",
    category: "Electrical Distribution",
    purpose: "Connect cables securely to equipment.",
    technicianFocus: "Torque, lug condition, heat marks, dressing, gland sealing, and phase identification."
  },
  {
    number: 31,
    name: "Grounding System",
    category: "Electrical Safety",
    purpose: "Protects people and equipment from electrical faults.",
    technicianFocus: "Earth cable continuity, termination tightness, corrosion, earth resistance, and bonding."
  },
  {
    number: 32,
    name: "Sensors",
    category: "Control & Protection",
    purpose: "Monitor engine conditions such as oil pressure and temperature.",
    technicianFocus: "Reading accuracy, wiring, calibration, alarm thresholds, and sensor replacement."
  },
  {
    number: 33,
    name: "Emergency Stop Button",
    category: "Electrical Safety",
    purpose: "Immediately shuts down the generator during emergencies.",
    technicianFocus: "Function test, reset operation, indication lamp, wiring, accessibility, and label condition."
  },
  {
    number: 34,
    name: "Jacket Water Heater",
    category: "Heating & Standby Readiness",
    purpose: "Keeps the engine warm for easier starting in cold conditions.",
    technicianFocus: "Heater operation, thermostat, leakage, power supply, cable condition, and standby temperature."
  },
  {
    number: 35,
    name: "Alternator Heater",
    category: "Heating & Standby Readiness",
    purpose: "Prevents moisture and condensation inside the alternator.",
    technicianFocus: "Heater supply, insulation resistance, terminal condition, and moisture signs."
  },
  {
    number: 36,
    name: "Panel Heater",
    category: "Heating & Standby Readiness",
    purpose: "Prevents condensation inside the control panel.",
    technicianFocus: "Heater operation, thermostat, ventilation, enclosure sealing, and corrosion signs."
  }
];

export const generatorPartCategories = Array.from(new Set(generatorParts.map((part) => part.category)));
