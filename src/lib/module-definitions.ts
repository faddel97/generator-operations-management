import type { ChecklistItem, FieldDefinition, ModuleDefinition } from "@/types/app";

const approvalOptions = [
  { label: "Draft", value: "draft" },
  { label: "Submitted", value: "submitted" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" }
];

const assetStatusOptions = [
  { label: "Healthy", value: "healthy" },
  { label: "Needs Attention", value: "attention" },
  { label: "Critical", value: "critical" },
  { label: "Offline", value: "offline" }
];

const checklistStatusOptions = [
  { label: "OK", value: "OK" },
  { label: "Not OK", value: "Not OK" },
  { label: "N/A", value: "N/A" }
];

const okNotOkOptions = [
  { label: "OK", value: "OK" },
  { label: "Not OK", value: "Not OK" }
];

const leakOptions = [
  { label: "No leak", value: "No leak" },
  { label: "Minor leak", value: "Minor leak" },
  { label: "Major leak", value: "Major leak" }
];

const levelRiskOptions = [
  { label: "Good - 60% and more", value: "Good" },
  { label: "Mid - 40% to 59%", value: "Mid" },
  { label: "Low - 25% to 39%", value: "Low" },
  { label: "Critical - 1% to 24%", value: "Critical" }
];

export const weeklyInspectionItems: ChecklistItem[] = [
  { key: "oil_level", label: "Oil Level", section: "Oil", options: okNotOkOptions, defaultValue: "OK" },
  { key: "oil_leak", label: "Oil Leak", section: "Oil", options: leakOptions, defaultValue: "No leak" },
  { key: "oil_name", label: "Oil Name", section: "Oil", control: "text", defaultValue: "Castrol" },
  {
    key: "oil_usage",
    label: "Oil Usage",
    section: "Oil",
    options: [
      { label: "New", value: "New" },
      { label: "Low", value: "Low" },
      { label: "Medium", value: "Medium" },
      { label: "High", value: "High" }
    ],
    defaultValue: "New"
  },
  {
    key: "oil_efficiency",
    label: "Oil Efficiency",
    section: "Oil",
    options: [
      { label: "High", value: "High" },
      { label: "Medium", value: "Medium" },
      { label: "Low", value: "Low" },
      { label: "Expired", value: "Expired" }
    ],
    defaultValue: "High"
  },
  { key: "fuel_leak", label: "Fuel Leak", section: "Fuel", options: leakOptions, defaultValue: "No leak" },
  { key: "fuel_tank_percentage", label: "Fuel Tank Percentage", section: "Fuel", options: levelRiskOptions, defaultValue: "Good" },
  { key: "coolant_level", label: "Coolant Level", section: "Cooling", options: okNotOkOptions, defaultValue: "OK" },
  { key: "coolant_leak", label: "Coolant Leak", section: "Cooling", options: leakOptions, defaultValue: "No leak" },
  { key: "coolant_condition", label: "Coolant Condition", section: "Cooling", options: okNotOkOptions, defaultValue: "OK" },
  { key: "radiator_condition", label: "Radiator Condition", section: "Cooling", options: okNotOkOptions, defaultValue: "OK" },
  { key: "battery_condition", label: "Battery Condition", section: "Battery", options: okNotOkOptions, defaultValue: "OK" },
  { key: "battery_corrosion", label: "Battery Corrosion", section: "Battery", options: okNotOkOptions, defaultValue: "OK" },
  {
    key: "battery_charging_condition",
    label: "Battery Charging Condition",
    section: "Battery",
    options: [
      { label: "Working", value: "Working" },
      { label: "Not working", value: "Not working" }
    ],
    defaultValue: "Working"
  },
  { key: "battery_electrolyte_level", label: "Battery Electrolyte Level", section: "Battery", options: levelRiskOptions, defaultValue: "Good" },
  {
    key: "oil_filter",
    label: "Oil Filter",
    section: "Filters",
    options: [
      { label: "OK", value: "OK" },
      { label: "6 months to 12 months", value: "6 months to 12 months" },
      { label: "250hrs to 500hrs", value: "250hrs to 500hrs" }
    ],
    defaultValue: "OK"
  },
  {
    key: "fuel_filter",
    label: "Fuel Filter",
    section: "Filters",
    options: [{ label: "250hrs to 500hrs", value: "250hrs to 500hrs" }],
    defaultValue: "250hrs to 500hrs"
  },
  {
    key: "air_filter",
    label: "Air Filter",
    section: "Filters",
    options: [
      { label: "OK", value: "OK" },
      { label: "Needs clean", value: "Needs clean" },
      { label: "500hrs to 1000hrs", value: "500hrs to 1000hrs" }
    ],
    defaultValue: "OK"
  }
];

export const atsProcedureItems: ChecklistItem[] = [
  { key: "confirm_auto", label: "Confirm generator is on AUTO" },
  { key: "start_test", label: "Start ATS test or disconnect mains according to site procedure" },
  { key: "generator_started_auto", label: "Confirm generator started automatically" },
  { key: "ats_transferred", label: "Confirm ATS transferred load to generator" },
  { key: "loads_working", label: "Confirm loads are working normally" },
  { key: "restore_mains", label: "Restore mains source" },
  { key: "ats_returned", label: "Confirm ATS returned load to mains" },
  { key: "cooling_down", label: "Confirm generator entered cooling down" },
  { key: "generator_stopped", label: "Confirm generator stopped" },
  { key: "system_auto", label: "Confirm system returned to AUTO" }
];

export const atsStuckOnMainsItems: ChecklistItem[] = [
  { key: "generator_running", label: "Confirm generator is running and stable" },
  { key: "ats_manual", label: "Put ATS on Manual" },
  { key: "insert_handle", label: "Insert handle" },
  { key: "transfer_generator", label: "Transfer ATS manually to Generator side" },
  { key: "confirm_load", label: "Confirm load transferred" },
  { key: "monitor_voltage_frequency", label: "Monitor voltage and frequency" },
  { key: "return_auto", label: "Return ATS to AUTO after the case is finished" }
];

export const atsStuckOnGeneratorItems: ChecklistItem[] = [
  { key: "mains_stable", label: "Confirm mains returned and is stable" },
  { key: "ats_manual", label: "Put ATS on Manual" },
  { key: "return_mains", label: "Use handle to return ATS to Mains side" },
  { key: "confirm_load", label: "Confirm load returned to mains" },
  { key: "cooling_down", label: "Let generator complete cooling down" },
  { key: "generator_stopped", label: "Confirm generator stopped" },
  { key: "return_auto", label: "Return ATS to AUTO" }
];

const maintenanceItems: ChecklistItem[] = [
  { key: "overall_exhaust_line_condition", label: "Overall Exhaust Line Condition", section: "General Maintenance" },
  { key: "overall_engine_condition", label: "Overall Engine Condition", section: "General Maintenance" },
  { key: "overall_alternator_condition", label: "Overall Alternator Condition", section: "General Maintenance" },
  { key: "overall_radiator_condition", label: "Overall Radiator Condition", section: "General Maintenance" },
  { key: "overall_batteries_condition", label: "Overall Batteries Condition", section: "General Maintenance" },
  { key: "fan_and_fan_v_belt_condition", label: "Fan and Fan V-Belt Condition", section: "General Maintenance" },
  { key: "battery_charger_condition", label: "Battery Charger Condition", section: "General Maintenance" },
  { key: "dynamo_and_wiring_condition", label: "Dynamo and Wiring Condition", section: "General Maintenance" },
  { key: "pipe_lines_joints_valves_condition", label: "Pipe Lines, Joints and Valves Condition", section: "General Maintenance" },
  { key: "oil_filters_and_oil_separator_condition", label: "Oil Filters and Oil Separator Condition", section: "General Maintenance" },
  { key: "fuel_filters_condition", label: "Fuel Filters Condition", section: "General Maintenance" },
  { key: "air_filters_condition", label: "Air Filters Condition", section: "General Maintenance" },
  { key: "hood_bolts_condition", label: "Hood Bolts Condition", section: "General Maintenance" },
  { key: "exhaust_line_top_bolts_condition", label: "Exhaust Line Top Bolts Condition", section: "General Maintenance" },
  { key: "oil_filters_condition", label: "Oil Filters Condition", section: "General Maintenance" },
  { key: "earth_bolts_condition", label: "Earth Bolts Condition", section: "General Maintenance" },
  { key: "radiator_cloth_condition", label: "Radiator Cloth Condition", section: "General Maintenance" },
  { key: "genset_controller_condition", label: "Genset Controller Condition", section: "General Maintenance" },
  { key: "alternator_outgoing_mccb_condition", label: "Alternator Outgoing MCCB Condition", section: "General Maintenance" },
  { key: "genset_console_wiring_condition", label: "Genset Console Wiring Condition", section: "General Maintenance" },
  { key: "jacket_water_heater_condition", label: "Jacket Water Heater Condition", section: "General Maintenance" },
  { key: "alternator_heater_condition", label: "Alternator Heater Condition", section: "General Maintenance" },
  { key: "genset_console_heater_condition", label: "Genset Console Heater Condition", section: "General Maintenance" },
  { key: "coolant_level_pipe_lines_condition", label: "Coolant Level Pipe Lines and Condition", section: "General Maintenance" },
  { key: "oil_level_oil_filling_drain_valve_condition", label: "Oil Level, Oil Filling and Drain Valve Condition", section: "General Maintenance" },
  { key: "emergency_push_button_indication_lamps_condition", label: "Emergency Push Button and Indication Lamps Condition", section: "General Maintenance" },
  { key: "outgoing_bus_bar_insulators_condition", label: "Outgoing Bus Bar and Insulators Condition", section: "General Maintenance" },
  { key: "hood_louvers_condition", label: "Hood Louvers Condition", section: "General Maintenance" },
  { key: "exhaust_silencers_condition", label: "Exhaust Silencers Condition", section: "General Maintenance" },
  { key: "day_tank_oil_pipe_lines_condition", label: "Day Tank Oil Pipe Lines Condition", section: "General Maintenance" },
  { key: "floor_and_drain_area_condition", label: "Floor and Drain Area Condition", section: "General Maintenance" },
  { key: "heat_area_and_pipe_insulation_condition", label: "Heat Area and Pipe Insulation Condition", section: "General Maintenance" },
  { key: "cable_terminations_and_cable_dressings_condition", label: "Cable Terminations and Cable Dressings Condition", section: "General Maintenance" },
  { key: "terminal_panel_cable_entry_holes_covers_condition", label: "Terminal Panel Cable Entry Holes and Covers Condition", section: "General Maintenance" },
  { key: "oil_fuel_coolant_level_indicators_condition", label: "Oil, Fuel and Coolant Level Indicators Condition", section: "General Maintenance" }
];

const generatorFields: FieldDefinition[] = [
  { name: "generator_id", label: "Generator ID", type: "text", required: true, section: "Asset" },
  { name: "manufacturer", label: "Manufacturer", type: "text", required: true, section: "Asset" },
  { name: "model", label: "Model", type: "text", section: "Asset" },
  { name: "serial_number", label: "Serial Number", type: "text", section: "Asset" },
  { name: "year", label: "Year", type: "number", section: "Asset" },
  { name: "rated_power_kw", label: "Rated Power kW", type: "number", step: "0.01", section: "Electrical" },
  { name: "rated_power_kva", label: "Rated Power kVA", type: "number", step: "0.01", section: "Electrical" },
  { name: "rated_voltage", label: "Rated Voltage", type: "number", step: "0.01", section: "Electrical" },
  { name: "rated_current", label: "Rated Current", type: "number", step: "0.01", section: "Electrical" },
  { name: "frequency", label: "Frequency", type: "number", step: "0.01", section: "Electrical" },
  { name: "rpm", label: "RPM", type: "number", section: "Electrical" },
  { name: "power_factor", label: "Power Factor", type: "number", step: "0.01", min: 0, max: 1, section: "Electrical" },
  { name: "phase", label: "Phase", type: "text", section: "Electrical" },
  {
    name: "duty",
    label: "Duty",
    type: "select",
    required: true,
    section: "Electrical",
    options: [
      { label: "Prime", value: "prime" },
      { label: "Standby", value: "standby" }
    ]
  },
  { name: "engine_model", label: "Engine Model", type: "text", section: "Engine" },
  { name: "engine_serial_number", label: "Engine Serial Number", type: "text", section: "Engine" },
  { name: "alternator_model", label: "Alternator Model", type: "text", section: "Alternator" },
  { name: "alternator_serial_number", label: "Alternator Serial Number", type: "text", section: "Alternator" },
  { name: "dse_model", label: "DSE Model", type: "text", section: "Controller" },
  { name: "fuel_tank_capacity", label: "Fuel Tank Capacity", type: "number", step: "0.01", section: "Fuel" },
  { name: "operation_time", label: "Operation Time", type: "number", step: "0.01", section: "Fuel" },
  { name: "health_score", label: "Health Score", type: "number", min: 0, max: 100, section: "Operations" },
  { name: "status", label: "Status", type: "select", options: assetStatusOptions, section: "Operations" },
  { name: "next_maintenance_due", label: "Next Maintenance Due", type: "date", section: "Operations" },
  { name: "notes", label: "Notes", type: "textarea", section: "Operations" },
  { name: "generator_nameplate", label: "Generator Nameplate", type: "file", accept: "image/*", storageBucket: "generator-photos", storageTable: "generator_photos", storageType: "generator_nameplate", section: "Photos" },
  { name: "engine_nameplate", label: "Engine Nameplate", type: "file", accept: "image/*", storageBucket: "generator-photos", storageTable: "generator_photos", storageType: "engine_nameplate", section: "Photos" },
  { name: "alternator_nameplate", label: "Alternator Nameplate", type: "file", accept: "image/*", storageBucket: "generator-photos", storageTable: "generator_photos", storageType: "alternator_nameplate", section: "Photos" },
  { name: "dse_controller_photo", label: "DSE Controller", type: "file", accept: "image/*", storageBucket: "generator-photos", storageTable: "generator_photos", storageType: "dse_controller", section: "Photos" },
  { name: "fuel_tank_plate", label: "Fuel Tank Plate", type: "file", accept: "image/*", storageBucket: "generator-photos", storageTable: "generator_photos", storageType: "fuel_tank_plate", section: "Photos" },
  { name: "generator_photos", label: "Generator Photos", type: "file", accept: "image/*", multiple: true, storageBucket: "generator-photos", storageTable: "generator_photos", storageType: "generator_photo", section: "Photos" },
  { name: "backup_dse", label: "Backup DSE", type: "file", storageBucket: "generator-files", storageTable: "generator_files", storageType: "backup_dse", section: "Files" },
  { name: "wiring_diagram", label: "Wiring Diagram", type: "file", storageBucket: "generator-files", storageTable: "generator_files", storageType: "wiring_diagram", section: "Diagrams" },
  { name: "ats_diagram", label: "ATS Diagram", type: "file", storageBucket: "generator-files", storageTable: "generator_files", storageType: "ats_diagram", section: "Diagrams" },
  { name: "station_diagram", label: "Station Diagram", type: "file", storageBucket: "generator-files", storageTable: "generator_files", storageType: "station_diagram", section: "Diagrams" }
];

export const moduleDefinitions: Record<string, ModuleDefinition> = {
  generators: {
    key: "generators",
    table: "generators",
    title: "Generator Asset Registry",
    singularTitle: "Generator",
    path: "/generators",
    description: "Manage generator nameplate data, engine, alternator, DSE, fuel, photos, and technical files.",
    addLabel: "Add generator",
    emptyState: "No generators have been added yet.",
    fields: generatorFields,
    dateField: "created_at",
    detailEnabled: true,
    reviewable: false,
    createRoles: ["admin", "supervisor"],
    updateRoles: ["admin", "supervisor"],
    deleteRoles: ["admin"],
    columns: [
      { key: "generator_id", label: "Generator ID" },
      { key: "manufacturer", label: "Manufacturer" },
      { key: "rated_power_kva", label: "kVA", type: "number" },
      { key: "duty", label: "Duty" },
      { key: "status", label: "Status", type: "status" },
      { key: "health_score", label: "Health", type: "number" },
      { key: "next_maintenance_due", label: "Maintenance Due", type: "date" }
    ]
  },
  "weekly-inspections": {
    key: "weekly-inspections",
    table: "weekly_inspections",
    title: "Weekly Inspections",
    singularTitle: "Weekly Inspection",
    path: "/inspections",
    description: "Submit structured weekly inspection checklists with notes and photos per finding.",
    addLabel: "New inspection",
    emptyState: "No weekly inspections have been submitted.",
    dateField: "inspection_date",
    reviewable: true,
    createRoles: ["admin", "supervisor", "technician"],
    updateRoles: ["admin", "supervisor", "technician"],
    deleteRoles: ["admin"],
    fields: [
      { name: "generator_id", label: "Generator", type: "generator", required: true, section: "Record" },
      { name: "inspection_date", label: "Inspection Date", type: "date", required: true, section: "Record" },
      { name: "checklist", label: "Inspection Checklist", type: "checklist", checklistItems: weeklyInspectionItems, options: checklistStatusOptions, section: "Checklist" },
      { name: "overall_status", label: "Overall Status", type: "select", options: assetStatusOptions, section: "Result" },
      { name: "notes", label: "Notes", type: "textarea", section: "Result" },
      { name: "approval_status", label: "Approval Status", type: "select", options: approvalOptions, section: "Result" }
    ],
    columns: [
      { key: "inspection_date", label: "Date", type: "date" },
      { key: "generator_id", label: "Generator" },
      { key: "overall_status", label: "Overall Status", type: "status" },
      { key: "approval_status", label: "Approval", type: "approval" },
      { key: "notes", label: "Notes" }
    ]
  },
  "dse-readings": {
    key: "dse-readings",
    table: "dse_readings",
    title: "DSE Monitoring",
    singularTitle: "DSE Reading",
    path: "/dse-readings",
    description: "Record biweekly manual test results, DSE readings, alarms, event logs, and backup files.",
    addLabel: "New DSE reading",
    emptyState: "No DSE readings have been recorded.",
    dateField: "reading_date",
    reviewable: true,
    createRoles: ["admin", "supervisor", "technician"],
    updateRoles: ["admin", "supervisor", "technician"],
    deleteRoles: ["admin"],
    fields: [
      { name: "generator_id", label: "Generator", type: "generator", required: true, section: "Record" },
      { name: "reading_date", label: "Reading Date", type: "date", required: true, section: "Record" },
      { name: "manual_start", label: "Manual Start", type: "checkbox", section: "Manual Test" },
      { name: "manual_stop", label: "Manual Stop", type: "checkbox", section: "Manual Test" },
      { name: "return_to_auto", label: "Return to AUTO", type: "checkbox", section: "Manual Test" },
      { name: "running_hours", label: "Running Hours", type: "number", step: "0.01", section: "DSE Data" },
      { name: "number_of_starts", label: "Number of Starts", type: "number", section: "DSE Data" },
      { name: "battery_voltage", label: "Battery Voltage", type: "number", step: "0.01", section: "DSE Data" },
      { name: "coolant_temperature", label: "Coolant Temperature", type: "number", step: "0.01", section: "DSE Data" },
      { name: "engine_speed_rpm", label: "Engine Speed RPM", type: "number", section: "DSE Data" },
      { name: "alarm_screen", label: "Alarm Screen", type: "textarea", section: "DSE Data" },
      { name: "event_log", label: "Event Log", type: "textarea", section: "DSE Data" },
      { name: "backup_file_path", label: "Backup DSE File", type: "file", storageBucket: "operation-attachments", targetColumn: "backup_file_path", section: "Files" },
      { name: "approval_status", label: "Approval Status", type: "select", options: approvalOptions, section: "Review" }
    ],
    columns: [
      { key: "reading_date", label: "Date", type: "date" },
      { key: "generator_id", label: "Generator" },
      { key: "running_hours", label: "Running Hours", type: "number" },
      { key: "battery_voltage", label: "Battery V", type: "number" },
      { key: "coolant_temperature", label: "Coolant", type: "number" },
      { key: "approval_status", label: "Approval", type: "approval" }
    ]
  },
  "ats-tests": {
    key: "ats-tests",
    table: "ats_tests",
    title: "ATS Monthly Tests",
    singularTitle: "ATS Test",
    path: "/ats-tests",
    description: "Document monthly ATS transfer tests and return-to-normal procedure evidence.",
    addLabel: "New ATS test",
    emptyState: "No ATS tests have been submitted.",
    dateField: "test_date",
    reviewable: true,
    createRoles: ["admin", "supervisor", "technician"],
    updateRoles: ["admin", "supervisor", "technician"],
    deleteRoles: ["admin"],
    fields: [
      { name: "generator_id", label: "Generator", type: "generator", required: true, section: "Record" },
      { name: "test_date", label: "Test Date", type: "date", required: true, section: "Record" },
      { name: "checklist", label: "Procedure Checklist", type: "procedure", checklistItems: atsProcedureItems, section: "Procedure" },
      { name: "generator_started", label: "Generator Started", type: "checkbox", section: "Results" },
      { name: "ats_transfer", label: "ATS Transfer", type: "checkbox", section: "Results" },
      { name: "ats_return", label: "ATS Return", type: "checkbox", section: "Results" },
      { name: "breaker_operation", label: "Breaker Operation", type: "checkbox", section: "Results" },
      { name: "alarm_during_test", label: "Alarm During Test", type: "checkbox", section: "Results" },
      { name: "notes", label: "Notes", type: "textarea", section: "Results" },
      { name: "approval_status", label: "Approval Status", type: "select", options: approvalOptions, section: "Review" }
    ],
    columns: [
      { key: "test_date", label: "Date", type: "date" },
      { key: "generator_id", label: "Generator" },
      { key: "generator_started", label: "Started", type: "boolean" },
      { key: "ats_transfer", label: "Transfer", type: "boolean" },
      { key: "ats_return", label: "Return", type: "boolean" },
      { key: "approval_status", label: "Approval", type: "approval" }
    ]
  },
  "ats-manual-operations": {
    key: "ats-manual-operations",
    table: "ats_manual_operations",
    title: "ATS Manual Operations",
    singularTitle: "ATS Manual Operation",
    path: "/ats-manual",
    description: "Record emergency manual ATS operations for stuck-on-mains or stuck-on-generator cases.",
    addLabel: "Record manual operation",
    emptyState: "No ATS manual operations have been recorded.",
    dateField: "operation_date",
    reviewable: true,
    createRoles: ["admin", "supervisor", "technician"],
    updateRoles: ["admin", "supervisor", "technician"],
    deleteRoles: ["admin"],
    fields: [
      { name: "generator_id", label: "Generator", type: "generator", section: "Record" },
      { name: "operation_date", label: "Date", type: "date", required: true, section: "Record" },
      {
        name: "case_type",
        label: "Case Type",
        type: "select",
        required: true,
        section: "Record",
        options: [
          { label: "ATS stuck on Mains", value: "stuck_on_mains" },
          { label: "ATS stuck on Generator", value: "stuck_on_generator" }
        ]
      },
      { name: "actions_completed", label: "Actions Completed", type: "procedure", checklistItems: [...atsStuckOnMainsItems, ...atsStuckOnGeneratorItems], section: "Actions" },
      { name: "notes", label: "Notes", type: "textarea", section: "Evidence" },
      { name: "photo_paths", label: "Photos", type: "file", accept: "image/*", multiple: true, storageBucket: "operation-attachments", targetColumn: "photo_paths", section: "Evidence" },
      { name: "approval_status", label: "Approval Status", type: "select", options: approvalOptions, section: "Review" }
    ],
    columns: [
      { key: "operation_date", label: "Date", type: "date" },
      { key: "case_type", label: "Case" },
      { key: "generator_id", label: "Generator" },
      { key: "approval_status", label: "Approval", type: "approval" },
      { key: "notes", label: "Notes" }
    ]
  },
  "maintenance-records": {
    key: "maintenance-records",
    table: "maintenance_records",
    title: "Maintenance",
    singularTitle: "Maintenance Record",
    path: "/maintenance",
    description: "Track two-month cleaning, three-month maintenance, corrective work, and automatic due dates.",
    addLabel: "New maintenance",
    emptyState: "No maintenance records have been submitted.",
    dateField: "maintenance_date",
    reviewable: true,
    createRoles: ["admin", "supervisor", "technician"],
    updateRoles: ["admin", "supervisor", "technician"],
    deleteRoles: ["admin"],
    fields: [
      { name: "generator_id", label: "Generator", type: "generator", required: true, section: "Record" },
      { name: "maintenance_date", label: "Maintenance Date", type: "date", required: true, section: "Record" },
      {
        name: "maintenance_type",
        label: "Maintenance Type",
        type: "select",
        required: true,
        section: "Record",
        options: [
          { label: "General", value: "general" },
          { label: "Mechanical inspection", value: "mechanical_inspection" },
          { label: "Battery", value: "battery" },
          { label: "Cleaning", value: "cleaning" },
          { label: "Corrective", value: "corrective" }
        ]
      },
      { name: "completed_items", label: "General Maintenance Checklist", type: "checklist", checklistItems: maintenanceItems, options: checklistStatusOptions, section: "General Checklist" },
      { name: "picture_paths", label: "Maintenance Pictures", type: "file", accept: "image/*", multiple: true, storageBucket: "operation-attachments", targetColumn: "picture_paths", section: "Pictures" },
      { name: "last_maintenance_date", label: "Last Maintenance Date", type: "date", section: "Due Date" },
      { name: "next_due_date", label: "Next Due Date", type: "date", helper: "Leave blank to calculate automatically in Supabase.", section: "Due Date" },
      { name: "permit_number", label: "Maintenance Permit Number", type: "text", section: "Permit" },
      { name: "tra_form_path", label: "TRA Form", type: "file", storageBucket: "operation-attachments", targetColumn: "tra_form_path", section: "Permit" },
      { name: "gsa_form_path", label: "GSA Form", type: "file", storageBucket: "operation-attachments", targetColumn: "gsa_form_path", section: "Permit" },
      { name: "ptw_form_path", label: "PTW Form", type: "file", storageBucket: "operation-attachments", targetColumn: "ptw_form_path", section: "Permit" },
      { name: "signature", label: "Signature", type: "text", section: "Signature" },
      { name: "notes", label: "Notes", type: "textarea", section: "Notes" },
      { name: "approval_status", label: "Approval Status", type: "select", options: approvalOptions, section: "Review" }
    ],
    columns: [
      { key: "maintenance_date", label: "Date", type: "date" },
      { key: "generator_id", label: "Generator" },
      { key: "maintenance_type", label: "Type" },
      { key: "next_due_date", label: "Next Due", type: "date" },
      { key: "approval_status", label: "Approval", type: "approval" }
    ]
  },
  "load-tests": {
    key: "load-tests",
    table: "load_tests",
    title: "Load Tests",
    singularTitle: "Load Test",
    path: "/load-tests",
    description: "Capture load-bank readings at 80%, 90%, 100%, and approved 110% load levels.",
    addLabel: "New load test",
    emptyState: "No load tests have been submitted.",
    dateField: "test_date",
    reviewable: true,
    createRoles: ["admin", "supervisor", "technician"],
    updateRoles: ["admin", "supervisor", "technician"],
    deleteRoles: ["admin"],
    fields: [
      { name: "generator_id", label: "Generator", type: "generator", required: true, section: "Record" },
      { name: "test_date", label: "Test Date", type: "date", required: true, section: "Record" },
      {
        name: "load_level",
        label: "Load Level",
        type: "select",
        required: true,
        section: "Record",
        options: [
          { label: "80%", value: "80" },
          { label: "90%", value: "90" },
          { label: "100%", value: "100" },
          { label: "110% if approved", value: "110" }
        ]
      },
      { name: "approval_reference", label: "110% Approval Reference", type: "text", section: "Record" },
      { name: "voltage", label: "Voltage", type: "number", step: "0.01", section: "Readings" },
      { name: "frequency", label: "Frequency", type: "number", step: "0.01", section: "Readings" },
      { name: "current", label: "Current", type: "number", step: "0.01", section: "Readings" },
      { name: "kw", label: "kW", type: "number", step: "0.01", section: "Readings" },
      { name: "kva", label: "kVA", type: "number", step: "0.01", section: "Readings" },
      { name: "power_factor", label: "Power Factor", type: "number", step: "0.01", section: "Readings" },
      { name: "oil_pressure", label: "Oil Pressure", type: "number", step: "0.01", section: "Readings" },
      { name: "coolant_temperature", label: "Coolant Temperature", type: "number", step: "0.01", section: "Readings" },
      { name: "battery_voltage", label: "Battery Voltage", type: "number", step: "0.01", section: "Readings" },
      { name: "alarms", label: "Alarms", type: "textarea", section: "Readings" },
      { name: "notes", label: "Notes", type: "textarea", section: "Notes" },
      { name: "approval_status", label: "Approval Status", type: "select", options: approvalOptions, section: "Review" }
    ],
    columns: [
      { key: "test_date", label: "Date", type: "date" },
      { key: "generator_id", label: "Generator" },
      { key: "load_level", label: "Load", type: "number" },
      { key: "kw", label: "kW", type: "number" },
      { key: "coolant_temperature", label: "Coolant", type: "number" },
      { key: "approval_status", label: "Approval", type: "approval" }
    ]
  },
  "vibration-tests": {
    key: "vibration-tests",
    table: "vibration_tests",
    title: "Vibration Tests",
    singularTitle: "Vibration Test",
    path: "/vibration-tests",
    description: "Upload vibration reports, attach files, and record trend-analysis notes.",
    addLabel: "New vibration test",
    emptyState: "No vibration tests have been submitted.",
    dateField: "test_date",
    reviewable: true,
    createRoles: ["admin", "supervisor", "technician"],
    updateRoles: ["admin", "supervisor", "technician"],
    deleteRoles: ["admin"],
    fields: [
      { name: "generator_id", label: "Generator", type: "generator", required: true, section: "Record" },
      { name: "test_date", label: "Test Date", type: "date", required: true, section: "Record" },
      { name: "report_file_path", label: "Vibration Report", type: "file", storageBucket: "operation-attachments", targetColumn: "report_file_path", section: "Files" },
      { name: "trend_analysis_notes", label: "Trend Analysis Notes", type: "textarea", section: "Analysis" },
      { name: "attachment_paths", label: "Attachments", type: "file", multiple: true, storageBucket: "operation-attachments", targetColumn: "attachment_paths", section: "Files" },
      { name: "approval_status", label: "Approval Status", type: "select", options: approvalOptions, section: "Review" }
    ],
    columns: [
      { key: "test_date", label: "Date", type: "date" },
      { key: "generator_id", label: "Generator" },
      { key: "trend_analysis_notes", label: "Trend Notes" },
      { key: "approval_status", label: "Approval", type: "approval" }
    ]
  },
  alarms: {
    key: "alarms",
    table: "alarms",
    title: "Alarm History",
    singularTitle: "Alarm",
    path: "/alarms",
    description: "Track alarm source, severity, message, and resolution status.",
    addLabel: "Add alarm",
    emptyState: "No alarms have been recorded.",
    dateField: "alarm_date",
    createRoles: ["admin", "supervisor", "technician"],
    updateRoles: ["admin", "supervisor", "technician"],
    deleteRoles: ["admin"],
    fields: [
      { name: "generator_id", label: "Generator", type: "generator", section: "Record" },
      { name: "alarm_date", label: "Alarm Date", type: "date", section: "Record" },
      {
        name: "severity",
        label: "Severity",
        type: "select",
        required: true,
        section: "Record",
        options: [
          { label: "Info", value: "info" },
          { label: "Warning", value: "warning" },
          { label: "Critical", value: "critical" }
        ]
      },
      { name: "source", label: "Source", type: "text", section: "Record" },
      { name: "message", label: "Message", type: "textarea", required: true, section: "Record" },
      { name: "resolved", label: "Resolved", type: "checkbox", section: "Resolution" }
    ],
    columns: [
      { key: "alarm_date", label: "Date", type: "date" },
      { key: "generator_id", label: "Generator" },
      { key: "severity", label: "Severity" },
      { key: "source", label: "Source" },
      { key: "resolved", label: "Resolved", type: "boolean" }
    ]
  },
  "event-logs": {
    key: "event-logs",
    table: "event_logs",
    title: "Audit Trail",
    singularTitle: "Audit Event",
    path: "/event-logs",
    description: "Automatic audit trail for every create, update, and delete action across the app.",
    addLabel: "Audit event",
    emptyState: "No audit events have been recorded.",
    dateField: "event_date",
    detailEnabled: true,
    createRoles: [],
    updateRoles: [],
    deleteRoles: [],
    fields: [],
    columns: [
      { key: "event_date", label: "Date", type: "date" },
      { key: "event_action", label: "Action" },
      { key: "entity_table", label: "Table" },
      { key: "entity_label", label: "Record" },
      { key: "actor_name", label: "Actor" },
      { key: "message", label: "Message" }
    ]
  },
  reports: {
    key: "reports",
    table: "reports",
    title: "Reports",
    singularTitle: "Report",
    path: "/reports",
    description: "Create weekly, monthly, generator health, maintenance due, alarm history, and event log analysis reports.",
    addLabel: "Create report",
    emptyState: "No reports have been generated.",
    dateField: "created_at",
    createRoles: ["admin", "supervisor"],
    updateRoles: ["admin", "supervisor"],
    deleteRoles: ["admin"],
    fields: [
      {
        name: "report_type",
        label: "Report Type",
        type: "select",
        required: true,
        section: "Report",
        options: [
          { label: "Weekly Report", value: "weekly" },
          { label: "Monthly Report", value: "monthly" },
          { label: "Generator Health Report", value: "generator_health" },
          { label: "Maintenance Due Report", value: "maintenance_due" },
          { label: "Alarm History Report", value: "alarm_history" },
          { label: "Event Log Analysis", value: "event_log_analysis" }
        ]
      },
      { name: "title", label: "Title", type: "text", required: true, section: "Report" },
      { name: "period_start", label: "Period Start", type: "date", section: "Report" },
      { name: "period_end", label: "Period End", type: "date", section: "Report" }
    ],
    columns: [
      { key: "created_at", label: "Created", type: "date" },
      { key: "report_type", label: "Type" },
      { key: "title", label: "Title" },
      { key: "period_start", label: "Start", type: "date" },
      { key: "period_end", label: "End", type: "date" }
    ]
  }
};

export function getModuleDefinition(key: string) {
  const definition = moduleDefinitions[key];

  if (!definition) {
    throw new Error(`Unknown module: ${key}`);
  }

  return definition;
}
