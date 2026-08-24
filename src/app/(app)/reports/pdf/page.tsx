import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { ReportPdfForm } from "@/components/reports/report-pdf-form";
import { getModuleRecord } from "@/lib/data";
import { isReportExportType, reportExportConfigs, reportExportOptions, type ReportExportType } from "@/lib/report-export";
import { requireAuthenticated } from "@/lib/auth";

type ReportPdfPageProps = {
  searchParams: Promise<{
    type?: string;
    reportId?: string;
  }>;
};

export default async function ReportPdfPage({ searchParams }: ReportPdfPageProps) {
  await requireAuthenticated();

  const { type, reportId } = await searchParams;
  const requestedType = type ?? null;
  let initialType: ReportExportType = isReportExportType(requestedType) ? requestedType : "weekly";
  let initialTitle: string | undefined;
  let initialPeriodStart: string | undefined;
  let initialPeriodEnd: string | undefined;

  if (reportId) {
    const { row } = await getModuleRecord("reports", reportId);

    if (!row || typeof row.report_type !== "string" || !isReportExportType(row.report_type)) {
      notFound();
    }

    initialType = row.report_type;
    initialTitle = typeof row.title === "string" ? row.title : undefined;
    initialPeriodStart = typeof row.period_start === "string" ? row.period_start : undefined;
    initialPeriodEnd = typeof row.period_end === "string" ? row.period_end : undefined;
  }

  return (
    <div className="space-y-5">
      <PageHeader title={`${reportExportConfigs[initialType].label} PDF`} description="Formal report package with entered observations and current system records." />
      <ReportPdfForm reportOptions={reportExportOptions} initialType={initialType} initialTitle={initialTitle} initialPeriodStart={initialPeriodStart} initialPeriodEnd={initialPeriodEnd} />
    </div>
  );
}
