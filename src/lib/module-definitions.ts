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

export const weeklyInspectionItems: ChecklistItem[] = [
  { key: "oil_level", label: "Oil Level", section: "Oil" },
  { key: "oil_leak", label: "Oil Leak", section: "Oil" },
  { key: "fuel_leak", label: "Fuel Leak", section: "Fuel" },
  { key: "coolant_level", label: "Coolant Level", section: "Cooling" },
  { key: "coolant_leak", label: "Coolant Leak", section: "Cooling" },
  { key: "coolant_condition", label: "Coolant Condition", section: "Cooling" },
  { key: "radiator_condition", label: "Radiator Condition", section: "Cooling" },
  { key: "battery_condition", label: "Battery Condition", section: "Battery" },
  { key: "battery_corrosion", label: "Battery Corrosion", section: "Battery" },
  { key: "air_filter", label: "Air Filter", section: "Filters" },
  { key: "fuel_filter", label: "Fuel Filter", section: "Filters" },
  { key: "belts", label: "Belts", section: "Mechanical" },
  { key: "hoses", label: "Hoses", section: "Mechanical" },
  { key: "exhaust", label: "Exhaust", section: "Mechanical" },
  { key: "generator_cleanliness", label: "Generator Cleanliness", section: "General" },
  { key: "room_cleanliness", label: "Room Cleanliness", section: "General" },
  { key: "general_condition", label: "General Condition", section: "General" }
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
  { key: "radiator", label: "Radiator", section: "Every two months cleaning" },
  { key: "battery", label: "Battery", section: "Every two months cleaning" },
  { key: "generator", label: "Generator", section: "Every two months cleaning" },
  { key: "control_panel", label: "Control Panel", section: "Every two months cleaning" },
  { key: "generator_room", label: "Generator Room", section: "Every two months cleaning" },
  { key: "oil_change", label: "Oil Change", section: "Every three months maintenance" },
  { key: "oil_filter", label: "Oil Filter", section: "Every three months maintenance" },
  { key: "fuel_filter", label: "Fuel Filter", section: "Every three months maintenance" },
  { key: "air_filter", label: "Air Filter", section: "Every three months maintenance" },
  { key: "general_service", label: "General Service", section: "Every three months maintenance" }
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
  { name: "ats_panel_photo", label: "ATS Panel Photo", type: "file", accept: "image/*", storageBucket: "generator-photos", storageTable: "generator_photos", storageType: "ats_panel", section: "Photos" },
  { name: "backup_dse", label: "Backup DSE", type: "file", storageBucket: "generator-files", storageTable: "generator_files", storageType: "backup_dse", section: "Files" },
  { name: "wiring_diagram", label: "Wiring Diagram", type: "file", storageBucket: "generator-files", storageTable: "generator_files", storageType: "wiring_diagram", section: "Files" },
  { name: "ats_single_line_diagram", label: "ATS Single Line Diagram", type: "file", storageBucket: "generator-files", storageTable: "generator_files", storageType: "ats_single_line_diagram", section: "Files" }
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
          { label: "Every two months cleaning", value: "two_month_cleaning" },
          { label: "Every three months maintenance", value: "three_month_service" },
          { label: "Corrective", value: "corrective" }
        ]
      },
      { name: "completed_items", label: "Completed Items", type: "procedure", checklistItems: maintenanceItems, section: "Completed Items" },
      { name: "last_maintenance_date", label: "Last Maintenance Date", type: "date", section: "Due Date" },
      { name: "next_due_date", label: "Next Due Date", type: "date", helper: "Leave blank to calculate automatically in Supabase.", section: "Due Date" },
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
    title: "Event Logs",
    singularTitle: "Event Log",
    path: "/event-logs",
    description: "Store controller events and future parsed DSE event-log payloads.",
    addLabel: "Add event",
    emptyState: "No event logs have been recorded.",
    dateField: "event_date",
    createRoles: ["admin", "supervisor", "technician"],
    updateRoles: ["admin", "supervisor", "technician"],
    deleteRoles: ["admin"],
    fields: [
      { name: "generator_id", label: "Generator", type: "generator", section: "Record" },
      { name: "event_date", label: "Event Date", type: "date", section: "Record" },
      { name: "event_type", label: "Event Type", type: "text", section: "Record" },
      { name: "message", label: "Message", type: "textarea", required: true, section: "Record" }
    ],
    columns: [
      { key: "event_date", label: "Date", type: "date" },
      { key: "generator_id", label: "Generator" },
      { key: "event_type", label: "Type" },
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
