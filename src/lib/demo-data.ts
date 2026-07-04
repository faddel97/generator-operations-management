import type { GeneratorOption, ModuleKey } from "@/types/app";
import type { GenericRow } from "@/types/database";

export const demoGeneratorOptions: GeneratorOption[] = [
  { id: "DEMO-GEN-001", label: "DEMO-GEN-001 - Demo Manufacturer DG-500" },
  { id: "DEMO-GEN-002", label: "DEMO-GEN-002 - Demo Manufacturer DG-800" }
];

export const demoGenerators: GenericRow[] = [
  {
    id: "demo-generator-1",
    generator_id: "DEMO-GEN-001",
    manufacturer: "Demo Manufacturer",
    model: "DG-500",
    rated_power_kva: 500,
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
      battery_voltage: 26.4,
      coolant_temperature: 82,
      approval_status: "approved"
    },
    {
      id: "demo-dse-2",
      reading_date: new Date(Date.now() - 1 * 86400000).toISOString(),
      generator_id: "DEMO-GEN-002",
      running_hours: 2120,
      battery_voltage: 24.9,
      coolant_temperature: 88,
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
  "load-tests": [
    {
      id: "demo-load-1",
      test_date: new Date(Date.now() - 44 * 86400000).toISOString(),
      generator_id: "DEMO-GEN-001",
      load_level: 80,
      kw: 320,
      coolant_temperature: 84,
      approval_status: "approved"
    }
  ],
  "vibration-tests": [
    {
      id: "demo-vibration-1",
      test_date: new Date(Date.now() - 60 * 86400000).toISOString(),
      generator_id: "DEMO-GEN-002",
      trend_analysis_notes: "Demo trend note only.",
      approval_status: "submitted"
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

export const demoTrendData = [
  { period: "Week 1", runningHours: 1180, batteryVoltage: 26.1, coolantTemperature: 81, starts: 58 },
  { period: "Week 2", runningHours: 1215, batteryVoltage: 26.3, coolantTemperature: 83, starts: 60 },
  { period: "Week 3", runningHours: 1244, batteryVoltage: 26.0, coolantTemperature: 82, starts: 62 },
  { period: "Week 4", runningHours: 1280, batteryVoltage: 26.4, coolantTemperature: 84, starts: 64 },
  { period: "Week 5", runningHours: 1340, batteryVoltage: 25.7, coolantTemperature: 86, starts: 70 },
  { period: "Week 6", runningHours: 1395, batteryVoltage: 25.5, coolantTemperature: 88, starts: 76 }
];
