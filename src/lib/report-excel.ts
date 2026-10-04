import { readFile } from "node:fs/promises";
import path from "node:path";

import { Workbook, type Cell, type Sheet, type Style } from "@xlsx/xlsx-populate";

import { formatDate, humanize } from "@/lib/format";
import { getModuleDefinition } from "@/lib/module-definitions";
import type { ReportExportSection, TemplatedExcelReportType } from "@/lib/report-export";
import type { ModuleKey, TableColumn } from "@/types/app";
import type { GenericRow } from "@/types/database";

const templatePath = path.join(process.cwd(), "public", "templates", "GOM_Report_Template.xlsx");

const sheetNames: Partial<Record<ModuleKey, string>> = {
  generators: "Generator Registry",
  "dse-readings": "DSE Monitoring",
  "weekly-inspections": "Weekly Inspections",
  "ats-tests": "ATS Monthly Tests",
  "maintenance-records": "Maintenance",
  alarms: "Alarm History"
};

const genericSheetWidths: Partial<Record<ModuleKey, number[]>> = {
  "weekly-inspections": [18, 42, 18, 14, 55, 45],
  "ats-tests": [18, 42, 12, 12, 12, 12, 16, 14, 70, 45],
  "maintenance-records": [18, 42, 20, 18, 18, 22, 14, 70, 24, 45],
  alarms: [18, 42, 14, 20, 12, 55]
};

const reportSheetColumns: Partial<Record<ModuleKey, TableColumn[]>> = {
  "weekly-inspections": [
    { key: "inspection_date", label: "Date", type: "date" },
    { key: "generator_id", label: "Generator" },
    { key: "overall_status", label: "Overall Status", type: "status" },
    { key: "approval_status", label: "Approval", type: "approval" },
    { key: "checklist", label: "Inspection Checklist" },
    { key: "notes", label: "Notes" }
  ],
  "ats-tests": [
    { key: "test_date", label: "Date", type: "date" },
    { key: "generator_id", label: "Generator" },
    { key: "generator_started", label: "Started", type: "boolean" },
    { key: "ats_transfer", label: "Transfer", type: "boolean" },
    { key: "ats_return", label: "Return", type: "boolean" },
    { key: "breaker_operation", label: "Breaker", type: "boolean" },
    { key: "alarm_during_test", label: "Alarm During Test", type: "boolean" },
    { key: "approval_status", label: "Approval", type: "approval" },
    { key: "checklist", label: "Procedure Checklist" },
    { key: "notes", label: "Notes" }
  ],
  "maintenance-records": [
    { key: "maintenance_date", label: "Date", type: "date" },
    { key: "generator_id", label: "Generator" },
    { key: "maintenance_type", label: "Type" },
    { key: "last_maintenance_date", label: "Last Maintenance", type: "date" },
    { key: "next_due_date", label: "Next Due", type: "date" },
    { key: "permit_number", label: "Permit Number" },
    { key: "approval_status", label: "Approval", type: "approval" },
    { key: "completed_items", label: "Completed Maintenance Items" },
    { key: "signature", label: "Signature" },
    { key: "notes", label: "Notes" }
  ],
  alarms: [
    { key: "alarm_date", label: "Date", type: "date" },
    { key: "generator_id", label: "Generator" },
    { key: "severity", label: "Severity", type: "status" },
    { key: "source", label: "Source" },
    { key: "resolved", label: "Resolved", type: "boolean" },
    { key: "message", label: "Message" }
  ]
};

type WorkbookStyles = {
  header: Style;
  body: Style;
  dseBody: Style;
  healthy: Style;
  attention: Style;
  integer: Style;
  decimal2: Style;
  decimal1: Style;
  approval: Style;
  emptyTitle: Style;
  emptyLabel: Style;
  emptyMessage: Style;
};

type XmlNode = {
  name: string;
  attributes: Record<string, string>;
  children: XmlNode[];
};

type InternalWorkbook = Workbook & {
  zipFiles: {
    files: Map<string, { data: ArrayBuffer; xml?: XmlNode }>;
  };
};

type InternalCell = Cell & {
  _style: Style;
};

export type ReportExcelInput = {
  reportType: TemplatedExcelReportType;
  reportLabel: string;
  reportTitle?: string;
  periodStart?: string;
  periodEnd?: string;
  sections: ReportExportSection[];
  generatorRows: GenericRow[];
  exportedAt?: Date;
};

function requireSheet(workbook: Workbook, name: string) {
  const sheet = workbook.sheet(name);

  if (!sheet) {
    throw new Error(`The report template is missing the "${name}" worksheet.`);
  }

  return sheet;
}

function sourceStyle(cell: Cell) {
  return (cell as InternalCell)._style;
}

function captureStyles(workbook: Workbook): WorkbookStyles {
  const generatorSheet = requireSheet(workbook, "Generator Registry");
  const dseSheet = requireSheet(workbook, "DSE Monitoring");
  const emptySheet = requireSheet(workbook, "Weekly Inspections");

  return {
    header: sourceStyle(generatorSheet.cell("A1")),
    body: sourceStyle(generatorSheet.cell("A2")),
    dseBody: sourceStyle(dseSheet.cell("A2")),
    healthy: sourceStyle(generatorSheet.cell("E2")),
    attention: sourceStyle(generatorSheet.cell("E3")),
    integer: sourceStyle(generatorSheet.cell("F2")),
    decimal2: sourceStyle(dseSheet.cell("D2")),
    decimal1: sourceStyle(dseSheet.cell("E2")),
    approval: sourceStyle(dseSheet.cell("G2")),
    emptyTitle: sourceStyle(emptySheet.cell("A1")),
    emptyLabel: sourceStyle(emptySheet.cell("A3")),
    emptyMessage: sourceStyle(emptySheet.cell("B3"))
  };
}

function setCell(cell: Cell, value: string | number | boolean | null | undefined, style: Style) {
  if (value === null || value === undefined || value === "") {
    cell.clear();
  } else {
    cell.value(value);
  }

  // Reuse the template's existing style record. Calling the public style setter
  // clones the record and can create invalid empty fill nodes in preserved files.
  (cell as InternalCell)._style = style;
}

function clearSheetValues(sheet: Sheet) {
  sheet.usedRange()?.clear();
}

function setColumnWidths(sheet: Sheet, widths: number[]) {
  widths.forEach((width, index) => sheet.column(index + 1).width(width));
}

function humanizedValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  return humanize(String(value));
}

function numericValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : String(value);
}

function buildGeneratorMaps(generatorRows: GenericRow[]) {
  const labelMap = new Map<string, string>();
  const rowMap = new Map<string, GenericRow>();

  for (const row of generatorRows) {
    const id = String(row.id);
    const assetId = String(row.generator_id ?? "Generator");
    const manufacturer = String(row.manufacturer ?? "Unknown");
    const model = row.model ? ` ${row.model}` : "";

    labelMap.set(id, `${assetId} - ${manufacturer}${model}`.trim());
    rowMap.set(id, row);
  }

  return { labelMap, rowMap };
}

function structuredValue(value: object, moduleKey: ModuleKey, fieldName: string) {
  const definition = getModuleDefinition(moduleKey);
  const field = definition.fields.find((item) => item.name === fieldName);
  const itemLabels = new Map((field?.checklistItems ?? []).map((item) => [item.key, item.label]));

  return Object.entries(value)
    .map(([key, item]) => {
      const label = itemLabels.get(key) ?? humanize(key);

      if (typeof item === "boolean") {
        return `${label}: ${item ? "Yes" : "No"}`;
      }

      if (item && typeof item === "object" && !Array.isArray(item)) {
        const details = item as Record<string, unknown>;
        const status = details.status === null || details.status === undefined ? "" : String(details.status);
        const notes = typeof details.notes === "string" && details.notes.trim() ? ` (${details.notes.trim()})` : "";
        return `${label}: ${status || "Recorded"}${notes}`;
      }

      return `${label}: ${String(item)}`;
    })
    .join("; ");
}

function formatColumnValue(row: GenericRow, column: TableColumn, moduleKey: ModuleKey, generatorLabels: Map<string, string>) {
  const value = row[column.key];

  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (column.type === "date") {
    return formatDate(value);
  }

  if (column.type === "number") {
    return numericValue(value);
  }

  if (column.type === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "string" && generatorLabels.has(value)) {
    return generatorLabels.get(value) ?? value;
  }

  if (typeof value === "object") {
    return structuredValue(value, moduleKey, column.key);
  }

  if (column.type === "status" || column.type === "approval" || ["duty", "severity", "maintenance_type"].includes(column.key)) {
    return humanizedValue(value);
  }

  return String(value);
}

function statusStyle(value: unknown, styles: WorkbookStyles) {
  const normalized = String(value ?? "").toLowerCase();

  if (normalized === "healthy" || normalized === "approved" || normalized === "resolved") {
    return styles.healthy;
  }

  if (["attention", "warning", "critical", "rejected", "overdue"].includes(normalized)) {
    return styles.attention;
  }

  return styles.body;
}

function styleForColumn(row: GenericRow, column: TableColumn, styles: WorkbookStyles) {
  if (column.type === "status") {
    return statusStyle(row[column.key], styles);
  }

  if (column.type === "approval") {
    return styles.approval;
  }

  if (column.type === "number") {
    return styles.decimal2;
  }

  return styles.body;
}

function updateTemplateTable(workbook: Workbook, tablePath: string, reference: string) {
  const entry = (workbook as InternalWorkbook).zipFiles.files.get(tablePath);

  if (!entry) {
    throw new Error(`The report template is missing ${tablePath}.`);
  }

  const xml = new TextDecoder("utf-8").decode(entry.data).replace(/ref="A1:G\d+"/g, `ref="${reference}"`);
  entry.data = new TextEncoder().encode(xml).buffer;
}

function writeHeaders(sheet: Sheet, headers: string[], styles: WorkbookStyles) {
  headers.forEach((header, index) => setCell(sheet.cell(1, index + 1), header, styles.header));
}

function ensureBlankTableRow(sheet: Sheet, columnCount: number, style: Style) {
  for (let column = 1; column <= columnCount; column += 1) {
    setCell(sheet.cell(2, column), null, style);
  }
}

function writeGeneratorRegistry(workbook: Workbook, rows: GenericRow[], styles: WorkbookStyles) {
  const sheet = requireSheet(workbook, "Generator Registry");
  const headers = ["Generator ID", "Manufacturer", "kVA", "Duty", "Status", "Health", "Maintenance Due"];
  const tableEndRow = Math.max(2, rows.length + 1);
  const reference = `A1:G${tableEndRow}`;

  clearSheetValues(sheet);
  writeHeaders(sheet, headers, styles);
  setColumnWidths(sheet, [22, 30, 12, 14, 14, 12, 20]);
  sheet.freezePanes("A2");

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const values = [
      row.generator_id ? String(row.generator_id) : null,
      row.manufacturer ? String(row.manufacturer) : null,
      numericValue(row.rated_power_kva),
      humanizedValue(row.duty),
      humanizedValue(row.status),
      numericValue(row.health_score),
      row.next_maintenance_due ? formatDate(row.next_maintenance_due) : null
    ];

    values.forEach((value, columnIndex) => {
      let style = styles.body;

      if (columnIndex === 4) {
        style = statusStyle(row.status, styles);
      } else if (columnIndex === 5) {
        style = styles.integer;
      }

      setCell(sheet.cell(rowNumber, columnIndex + 1), value, style);
    });
  });

  if (rows.length === 0) {
    ensureBlankTableRow(sheet, headers.length, styles.body);
  }

  // The Excel table owns its AutoFilter. A second worksheet-level AutoFilter
  // over the same cells makes Excel repair and discard the table on open.
  sheet.autoFilter(null);
  updateTemplateTable(workbook, "xl/tables/table1.xml", reference);
}

function writeDseMonitoring({
  workbook,
  rows,
  generatorLabels,
  generatorRowMap,
  styles
}: {
  workbook: Workbook;
  rows: GenericRow[];
  generatorLabels: Map<string, string>;
  generatorRowMap: Map<string, GenericRow>;
  styles: WorkbookStyles;
}) {
  const sheet = requireSheet(workbook, "DSE Monitoring");
  const headers = ["Date", "Generator", "DSE / Model", "Running Hours", "Battery V", "Coolant", "Approval"];
  const tableEndRow = Math.max(2, rows.length + 1);
  const reference = `A1:G${tableEndRow}`;

  clearSheetValues(sheet);
  writeHeaders(sheet, headers, styles);
  setColumnWidths(sheet, [18, 42, 28, 16, 14, 12, 14]);
  sheet.freezePanes("A2");

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const generatorId = String(row.generator_id ?? "");
    const generator = generatorRowMap.get(generatorId);
    const controllerModel = generator?.dse_model ?? generator?.model ?? generator?.manufacturer;
    const values = [
      row.reading_date ? formatDate(row.reading_date) : null,
      generatorLabels.get(generatorId) ?? generatorId,
      controllerModel ? String(controllerModel) : null,
      numericValue(row.running_hours),
      numericValue(row.battery_voltage),
      numericValue(row.coolant_temperature),
      humanizedValue(row.approval_status)
    ];
    const rowStyles = [styles.dseBody, styles.dseBody, styles.dseBody, styles.decimal2, styles.decimal1, styles.integer, styles.approval];

    values.forEach((value, columnIndex) => setCell(sheet.cell(rowNumber, columnIndex + 1), value, rowStyles[columnIndex]));
  });

  if (rows.length === 0) {
    ensureBlankTableRow(sheet, headers.length, styles.dseBody);
  }

  updateTemplateTable(workbook, "xl/tables/table2.xml", reference);
}

function writeEmptySheet(sheet: Sheet, title: string, message: string, styles: WorkbookStyles) {
  clearSheetValues(sheet);
  sheet.resetPanes();
  setColumnWidths(sheet, [20, 55]);
  setCell(sheet.cell("A1"), title, styles.emptyTitle);
  setCell(sheet.cell("A3"), "Status", styles.emptyLabel);
  setCell(sheet.cell("B3"), message, styles.emptyMessage);
}

function writeGenericSection({
  sheet,
  moduleKey,
  rows,
  included,
  generatorLabels,
  styles
}: {
  sheet: Sheet;
  moduleKey: ModuleKey;
  rows: GenericRow[];
  included: boolean;
  generatorLabels: Map<string, string>;
  styles: WorkbookStyles;
}) {
  const definition = getModuleDefinition(moduleKey);
  const columns = reportSheetColumns[moduleKey] ?? definition.columns;

  if (!included || rows.length === 0) {
    writeEmptySheet(sheet, definition.title, included ? "No records found for this report period." : "Not included in this report type.", styles);
    return;
  }

  clearSheetValues(sheet);
  sheet.freezePanes("A2");
  setColumnWidths(sheet, genericSheetWidths[moduleKey] ?? columns.map(() => 20));
  writeHeaders(
    sheet,
    columns.map((column) => column.label),
    styles
  );

  rows.forEach((row, rowIndex) => {
    columns.forEach((column, columnIndex) => {
      setCell(sheet.cell(rowIndex + 2, columnIndex + 1), formatColumnValue(row, column, moduleKey, generatorLabels), styleForColumn(row, column, styles));
    });
  });

  sheet.range(1, 1, rows.length + 1, columns.length).autoFilter();
}

function sectionSummary(moduleKey: ModuleKey, rows: GenericRow[] | undefined, generatorRows: GenericRow[]) {
  if (moduleKey === "generators") {
    return generatorRows.length === 0 ? "No records found" : `${generatorRows.length} generator record${generatorRows.length === 1 ? "" : "s"}`;
  }

  if (!rows) {
    return "Not included in this report type";
  }

  if (rows.length === 0) {
    return "No records found";
  }

  const labels: Partial<Record<ModuleKey, string>> = {
    "weekly-inspections": "inspection",
    "dse-readings": "submitted",
    "ats-tests": "test",
    "maintenance-records": "maintenance",
    alarms: "alarm"
  };
  const label = labels[moduleKey] ?? "report";
  return `${rows.length} ${label} record${rows.length === 1 ? "" : "s"}`;
}

function exportedDateLabel(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Riyadh"
  }).format(value);
}

function reportingPeriodLabel(periodStart?: string, periodEnd?: string) {
  if (periodStart && periodEnd) {
    return `${formatDate(periodStart)} to ${formatDate(periodEnd)}`;
  }

  if (periodStart) {
    return `From ${formatDate(periodStart)}`;
  }

  if (periodEnd) {
    return `Through ${formatDate(periodEnd)}`;
  }

  return "Not set";
}

function writeDashboard({
  workbook,
  reportLabel,
  reportTitle,
  periodStart,
  periodEnd,
  exportedAt,
  sectionRows,
  generatorRows
}: {
  workbook: Workbook;
  reportLabel: string;
  reportTitle?: string;
  periodStart?: string;
  periodEnd?: string;
  exportedAt: Date;
  sectionRows: Map<ModuleKey, GenericRow[]>;
  generatorRows: GenericRow[];
}) {
  const dashboard = requireSheet(workbook, "Dashboard");
  const generatorEndRow = Math.max(2, generatorRows.length + 1);
  const dseRows = sectionRows.get("dse-readings") ?? [];
  const dseEndRow = Math.max(2, dseRows.length + 1);
  const title = reportTitle?.trim() || reportLabel;

  dashboard.cell("A1").value("GOM — Generator Operations Management");
  dashboard.cell("A2").value(`${title} Dashboard | Exported ${exportedDateLabel(exportedAt)} | Reporting period: ${reportingPeriodLabel(periodStart, periodEnd)}`);
  dashboard.cell("A5").formula(`COUNTA('Generator Registry'!A2:A${generatorEndRow})`);
  dashboard.cell("C5").formula(`COUNTIF('Generator Registry'!E2:E${generatorEndRow},"Healthy")`);
  dashboard.cell("E5").formula(`COUNTIF('Generator Registry'!E2:E${generatorEndRow},"Attention")`);
  dashboard.cell("G5").formula(`COUNTA('DSE Monitoring'!A2:A${dseEndRow})`);
  dashboard.cell("B10").formula(`COUNTIF('Generator Registry'!E2:E${generatorEndRow},"Healthy")`);
  dashboard.cell("B11").formula(`COUNTIF('Generator Registry'!E2:E${generatorEndRow},"Attention")`);

  const dashboardSections: Array<[number, ModuleKey, string]> = [
    [15, "generators", "Generator Asset Registry"],
    [16, "weekly-inspections", "Weekly Inspections"],
    [17, "dse-readings", "DSE Monitoring"],
    [18, "ats-tests", "ATS Monthly Tests"],
    [19, "maintenance-records", "Maintenance"],
    [20, "alarms", "Alarm History"]
  ];

  dashboardSections.forEach(([rowNumber, moduleKey, label]) => {
    dashboard.cell(rowNumber, 1).value(label);
    dashboard.cell(rowNumber, 2).value(sectionSummary(moduleKey, sectionRows.get(moduleKey), generatorRows));
  });
}

export async function buildReportExcel({
  reportLabel,
  reportTitle,
  periodStart,
  periodEnd,
  sections,
  generatorRows,
  exportedAt = new Date()
}: ReportExcelInput) {
  const workbook = await Workbook.fromData(await readFile(templatePath));
  const styles = captureStyles(workbook);
  const sectionRows = new Map(sections.map((section) => [section.moduleKey, section.rows]));
  const { labelMap: generatorLabels, rowMap: generatorRowMap } = buildGeneratorMaps(generatorRows);

  writeGeneratorRegistry(workbook, generatorRows, styles);
  writeDseMonitoring({
    workbook,
    rows: sectionRows.get("dse-readings") ?? [],
    generatorLabels,
    generatorRowMap,
    styles
  });

  for (const moduleKey of ["weekly-inspections", "ats-tests", "maintenance-records", "alarms"] as const) {
    const sheetName = sheetNames[moduleKey];

    if (!sheetName) {
      continue;
    }

    const rows = sectionRows.get(moduleKey);
    writeGenericSection({
      sheet: requireSheet(workbook, sheetName),
      moduleKey,
      rows: rows ?? [],
      included: Boolean(rows),
      generatorLabels,
      styles
    });
  }

  writeDashboard({
    workbook,
    reportLabel,
    reportTitle,
    periodStart,
    periodEnd,
    exportedAt,
    sectionRows,
    generatorRows
  });

  workbook.activeSheet("Dashboard");

  return workbook.output("node:buffer");
}
