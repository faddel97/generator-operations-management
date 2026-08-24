import { Download, FileText } from "lucide-react";

import { DemoBanner } from "@/components/demo-banner";
import { moduleActionErrorMessage, moduleSaveMessage } from "@/components/module/module-pages";
import { ModuleTable } from "@/components/module/module-table";
import { PageHeader } from "@/components/page-header";
import { getGeneratorLabelMap, getModuleRows } from "@/lib/data";
import { getModuleDefinition } from "@/lib/module-definitions";
import { requireAuthenticated } from "@/lib/auth";

const reportTypes = [
  { label: "Weekly report", value: "weekly" },
  { label: "Monthly report", value: "monthly" },
  { label: "Generator health report", value: "generator_health" },
  { label: "Maintenance due report", value: "maintenance_due" },
  { label: "Alarm history report", value: "alarm_history" },
  { label: "Event log analysis", value: "event_log_analysis" }
];

type ModuleSearchParams = {
  actionError?: string;
  saved?: string;
};

export default async function ReportsPage({ searchParams }: { searchParams: Promise<ModuleSearchParams> }) {
  const { actionError, saved } = await searchParams;
  const definition = getModuleDefinition("reports");
  const context = await requireAuthenticated();
  const [{ rows, isDemo, error }, generatorMap] = await Promise.all([getModuleRows("reports"), getGeneratorLabelMap()]);
  const actionErrorText = moduleActionErrorMessage(actionError);
  const savedText = moduleSaveMessage(saved);

  return (
    <div className="space-y-5">
      <PageHeader title={definition.title} description={definition.description} addHref="/reports/new" addLabel={definition.addLabel} role={context.role} allowedRoles={definition.createRoles} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reportTypes.map((type) => (
          <div key={type.value} className="rounded-md border border-slate-200 bg-white p-5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-teal-50 text-teal-700">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="font-semibold text-slate-950">{type.label}</h3>
            <a href={`/reports/export?type=${type.value}`} className="mt-4 inline-flex min-h-9 items-center gap-2 rounded-md border border-teal-700 px-3 text-sm font-semibold text-teal-800 hover:bg-teal-50">
              <Download className="h-4 w-4" aria-hidden="true" />
              Export CSV
            </a>
          </div>
        ))}
      </div>
      {isDemo ? <DemoBanner /> : null}
      {savedText ? <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{savedText}</div> : null}
      {actionErrorText ? <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{actionErrorText}</div> : null}
      {error ? <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
      <ModuleTable definition={definition} rows={rows} context={context} generatorMap={generatorMap} />
    </div>
  );
}
