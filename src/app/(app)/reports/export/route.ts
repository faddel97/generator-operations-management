import { NextRequest, NextResponse } from "next/server";

import { getModuleRecord, getModuleRows } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { getModuleDefinition } from "@/lib/module-definitions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ModuleKey } from "@/types/app";
import type { GenericRow } from "@/types/database";

type ReportExportType = "weekly" | "monthly" | "generator_health" | "maintenance_due" | "alarm_history" | "event_log_analysis";

const reportExportConfigs: Record<ReportExportType, { label: string; modules: ModuleKey[] }> = {
  weekly: {
    label: "Weekly Report",
    modules: ["weekly-inspections", "dse-readings", "maintenance-records", "alarms"]
  },
  monthly: {
    label: "Monthly Report",
    modules: ["generators", "weekly-inspections", "dse-readings", "ats-tests", "maintenance-records", "load-tests", "vibration-tests", "alarms"]
  },
  generator_health: {
    label: "Generator Health Report",
    modules: ["generators", "dse-readings", "maintenance-records", "alarms"]
  },
  maintenance_due: {
    label: "Maintenance Due Report",
    modules: ["generators", "maintenance-records"]
  },
  alarm_history: {
    label: "Alarm History Report",
    modules: ["alarms"]
  },
  event_log_analysis: {
    label: "Event Log Analysis",
    modules: ["event-logs"]
  }
};

function isReportExportType(value: string | null): value is ReportExportType {
  return Boolean(value && value in reportExportConfigs);
}

function csvEscape(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = typeof value === "object" ? JSON.stringify(value) : String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
}

function normalizeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getComparableDate(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

function isWithinPeriod(row: GenericRow, moduleKey: ModuleKey, periodStart?: string, periodEnd?: string) {
  if (!periodStart && !periodEnd) {
    return true;
  }

  const definition = getModuleDefinition(moduleKey);
  const rowTime = getComparableDate(row[definition.dateField ?? "created_at"]);

  if (rowTime === null) {
    return true;
  }

  const startTime = periodStart ? getComparableDate(periodStart) : null;
  const endTime = periodEnd ? getComparableDate(periodEnd) : null;
  const inclusiveEnd = endTime === null ? null : endTime + 86400000 - 1;

  return (startTime === null || rowTime >= startTime) && (inclusiveEnd === null || rowTime <= inclusiveEnd);
}

function orderedExportKeys(rows: GenericRow[], moduleKey: ModuleKey) {
  const definition = getModuleDefinition(moduleKey);
  const keys = new Set<string>(["id"]);

  for (const column of definition.columns) {
    keys.add(column.key);
  }

  for (const field of definition.fields) {
    if (field.type !== "file") {
      keys.add(field.name);
    }
  }

  keys.add(definition.dateField ?? "created_at");
  keys.add("created_at");
  keys.add("updated_at");

  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!key.endsWith("_path") && !key.endsWith("_paths")) {
        keys.add(key);
      }
    }
  }

  return Array.from(keys);
}

function rowsToCsv({
  reportLabel,
  reportTitle,
  periodStart,
  periodEnd,
  sections
}: {
  reportLabel: string;
  reportTitle?: string;
  periodStart?: string;
  periodEnd?: string;
  sections: Array<{ moduleKey: ModuleKey; rows: GenericRow[] }>;
}) {
  const csvRows: unknown[][] = [
    ["Report", reportLabel],
    ["Title", reportTitle ?? ""],
    ["Period Start", periodStart ? formatDate(periodStart) : ""],
    ["Period End", periodEnd ? formatDate(periodEnd) : ""],
    ["Exported At", new Date().toISOString()],
    []
  ];

  for (const section of sections) {
    const definition = getModuleDefinition(section.moduleKey);
    const keys = orderedExportKeys(section.rows, section.moduleKey);

    csvRows.push([definition.title]);
    csvRows.push(["Module", ...keys]);

    if (section.rows.length === 0) {
      csvRows.push([definition.singularTitle, "No records"]);
    } else {
      for (const row of section.rows) {
        csvRows.push([definition.singularTitle, ...keys.map((key) => row[key])]);
      }
    }

    csvRows.push([]);
  }

  return `\uFEFF${csvRows.map((row) => row.map(csvEscape).join(",")).join("\r\n")}`;
}

async function requireExportSession() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}

export async function GET(request: NextRequest) {
  const user = await requireExportSession();

  if (isSupabaseConfigured() && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const reportId = request.nextUrl.searchParams.get("reportId");
  let reportType = request.nextUrl.searchParams.get("type");
  let reportTitle: string | undefined;
  let periodStart: string | undefined;
  let periodEnd: string | undefined;

  if (reportId) {
    const { row } = await getModuleRecord("reports", reportId);

    if (!row) {
      return new NextResponse("Report not found.", { status: 404 });
    }

    reportType = typeof row.report_type === "string" ? row.report_type : null;
    reportTitle = typeof row.title === "string" ? row.title : undefined;
    periodStart = typeof row.period_start === "string" ? row.period_start : undefined;
    periodEnd = typeof row.period_end === "string" ? row.period_end : undefined;
  }

  if (!isReportExportType(reportType)) {
    return new NextResponse("Unknown report export type.", { status: 400 });
  }

  const config = reportExportConfigs[reportType];
  const sections = await Promise.all(
    config.modules.map(async (moduleKey) => {
      const { rows, error } = await getModuleRows(moduleKey);

      if (error) {
        throw new Error(error);
      }

      return {
        moduleKey,
        rows: rows.filter((row) => isWithinPeriod(row, moduleKey, periodStart, periodEnd))
      };
    })
  );

  const csv = rowsToCsv({
    reportLabel: config.label,
    reportTitle,
    periodStart,
    periodEnd,
    sections
  });
  const fileNameBase = reportTitle ? normalizeFileName(reportTitle) : normalizeFileName(config.label);
  const fileName = `gom-${fileNameBase || "report"}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Type": "text/csv; charset=utf-8"
    }
  });
}
