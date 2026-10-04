import { NextRequest, NextResponse } from "next/server";

import { getModuleRecord, getModuleRowsForExport } from "@/lib/data";
import { buildReportExcel } from "@/lib/report-excel";
import { getReportExportSections, isReportExportType, isTemplatedExcelReportType, normalizeFileName, reportExportConfigs, reportSectionsToCsv, resolveReportPeriod } from "@/lib/report-export";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

function riyadhDateStamp(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Riyadh"
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}`;
}

function reportDateStamp(periodEnd?: string) {
  const periodDate = periodEnd?.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  return periodDate ?? riyadhDateStamp();
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
  let reportCreatedAt: string | undefined;

  if (reportId) {
    const { row, error } = await getModuleRecord("reports", reportId);

    if (error) {
      return new NextResponse(error, { status: 500 });
    }

    if (!row) {
      return new NextResponse("Report not found.", { status: 404 });
    }

    reportType = typeof row.report_type === "string" ? row.report_type : null;
    reportTitle = typeof row.title === "string" ? row.title : undefined;
    periodStart = typeof row.period_start === "string" ? row.period_start : undefined;
    periodEnd = typeof row.period_end === "string" ? row.period_end : undefined;
    reportCreatedAt = typeof row.created_at === "string" ? row.created_at : undefined;
  }

  if (!isReportExportType(reportType)) {
    return new NextResponse("Unknown report export type.", { status: 400 });
  }

  const resolvedPeriod = resolveReportPeriod({
    reportType,
    periodStart,
    periodEnd,
    referenceDate: reportCreatedAt ? new Date(reportCreatedAt) : new Date()
  });
  periodStart = resolvedPeriod.periodStart;
  periodEnd = resolvedPeriod.periodEnd;

  const config = reportExportConfigs[reportType];
  const sections = await getReportExportSections({ reportType, periodStart, periodEnd });

  if (isTemplatedExcelReportType(reportType)) {
    const { rows: generatorRows, error } = await getModuleRowsForExport("generators");

    if (error) {
      return new NextResponse(error, { status: 500 });
    }

    const workbook = await buildReportExcel({
      reportType,
      reportLabel: config.label,
      reportTitle,
      periodStart,
      periodEnd,
      sections,
      generatorRows
    });
    const fileName = `GOM_${reportType === "weekly" ? "Weekly" : "Monthly"}_Report_Excel_${reportDateStamp(periodEnd)}.xlsx`;

    return new NextResponse(new Uint8Array(workbook), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }
    });
  }

  const csv = reportSectionsToCsv({
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
