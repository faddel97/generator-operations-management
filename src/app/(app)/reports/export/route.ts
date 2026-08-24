import { NextRequest, NextResponse } from "next/server";

import { getModuleRecord } from "@/lib/data";
import { getReportExportSections, isReportExportType, normalizeFileName, reportExportConfigs, reportSectionsToCsv } from "@/lib/report-export";
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
  const sections = await getReportExportSections({ reportType, periodStart, periodEnd });

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
