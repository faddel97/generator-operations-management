import type { FleetTrendDatum, GeneratorOption, ModuleKey } from "@/types/app";
import type { GenericRow } from "@/types/database";

export const demoGeneratorOptions: GeneratorOption[] = [
  { id: "DEMO-GEN-001", label: "DEMO-GEN-001 - Demo Manufacturer DG-500", fuelTankCapacity: 800 },
  { id: "DEMO-GEN-002", label: "DEMO-GEN-002 - Demo Manufacturer DG-800", fuelTankCapacity: 1200 }
];

export const demoGenerators: GenericRow[] = [
  {
    id: "demo-generator-1",
    generator_id: "DEMO-GEN-001",
    manufacturer: "Demo Manufacturer",
    model: "DG-500",
    rated_power_kva: 500,
    fuel_tank_capacity: 800,
    duty: "standby",
    status: "healthy",
    health_score: 91,
    next_maintenance_due: new Date(Date.now() + 20 * 86400000).toISOString()
  },
  {
    id: "demo-generator-2",
    generator_id: "DEMO-GEN-002",
    manufacturer: "Demo Manufacturer",
    model: "DG-800",
    rated_power_kva: 800,
    fuel_tank_capacity: 1200,
    duty: "prime",
    status: "attention",
    health_score: 72,
    next_maintenance_due: new Date(Date.now() + 5 * 86400000).toISOString()
  }
];

export const demoModuleRows: Record<ModuleKey, GenericRow[]> = {
  generators: demoGenerators,
  "weekly-inspections": [
    {
      id: "demo-inspection-1",
      inspection_date: new Date(Date.now() - 3 * 86400000).toISOString(),
      generator_id: "DEMO-GEN-001",
      overall_status: "healthy",
      approval_status: "approved",
      notes: "Demo inspection only."
    }
  ],
  "dse-readings": [
    {
      id: "demo-dse-1",
      reading_date: new Date(Date.now() - 2 * 86400000).toISOString(),
      generator_id: "DEMO-GEN-001",
      running_hours: 1280,
      number_of_starts: 61,
      battery_voltage: 26.4,
      coolant_temperature: 82,
      engine_speed_rpm: 1500,
      fuel_level_liters: 560,
      fuel_level_percentage: 70,
      approval_status: "approved"
    },
    {
      id: "demo-dse-2",
      reading_date: new Date(Date.now() - 1 * 86400000).toISOString(),
      generator_id: "DEMO-GEN-002",
      running_hours: 2120,
      number_of_starts: 74,
      battery_voltage: 24.9,
      coolant_temperature: 88,
      engine_speed_rpm: 1498,
      fuel_level_liters: 540,
      fuel_level_percentage: 45,
      approval_status: "submitted"
    }
  ],
  "ats-tests": [
    {
      id: "demo-ats-test-1",
      test_date: new Date(Date.now() - 10 * 86400000).toISOString(),
      generator_id: "DEMO-GEN-001",
      generator_started: true,
      ats_transfer: true,
      ats_return: true,
      approval_status: "approved"
    }
  ],
  "ats-manual-operations": [
    {
      id: "demo-ats-manual-1",
      operation_date: new Date(Date.now() - 18 * 86400000).toISOString(),
      case_type: "stuck_on_mains",
      generator_id: "DEMO-GEN-002",
      approval_status: "submitted",
      notes: "Demo emergency operation record."
    }
  ],
  "maintenance-records": [
    {
      id: "demo-maintenance-1",
      maintenance_date: new Date(Date.now() - 35 * 86400000).toISOString(),
      generator_id: "DEMO-GEN-001",
      maintenance_type: "general",
      next_due_date: new Date(Date.now() + 25 * 86400000).toISOString(),
      completed_items: {
        overall_exhaust_line_condition: { status: "OK", notes: "" },
        overall_engine_condition: { status: "OK", notes: "" },
        overall_alternator_condition: { status: "OK", notes: "" }
      },
      approval_status: "approved"
    }
  ],
  alarms: [
    {
      id: "demo-alarm-1",
      alarm_date: new Date(Date.now() - 1 * 86400000).toISOString(),
      generator_id: "DEMO-GEN-002",
      severity: "warning",
      source: "DSE",
      resolved: false
    }
  ],
  "event-logs": [
    {
      id: "demo-event-1",
      event_date: new Date(Date.now() - 1 * 86400000).toISOString(),
      generator_id: "DEMO-GEN-001",
      event_type: "Manual test",
      message: "Demo event log row."
    }
  ],
  reports: [
    {
      id: "demo-report-1",
      created_at: new Date().toISOString(),
      report_type: "weekly",
      title: "Demo weekly report",
      period_start: new Date(Date.now() - 7 * 86400000).toISOString(),
      period_end: new Date().toISOString()
    }
  ]
};

export const demoTrendData: FleetTrendDatum[] = [
  {
    generatorId: "demo-generator-1",
    generatorName: "DEMO-GEN-001 - DG-500",
    readingCount: 6,
    runningHours: 1280,
    batteryVoltage: 26.1,
    coolantTemperature: 83,
    starts: 61,
    engineSpeedRpm: 1500,
    fuelLevelLiters: 560,
    fuelLevelPercentage: 70
  },
  {
    generatorId: "demo-generator-2",
    generatorName: "DEMO-GEN-002 - DG-800",
    readingCount: 5,
    runningHours: 2120,
    batteryVoltage: 24.9,
    coolantTemperature: 88,
    starts: 74,
    engineSpeedRpm: 1500,
    fuelLevelLiters: 540,
    fuelLevelPercentage: 45
  }
];
