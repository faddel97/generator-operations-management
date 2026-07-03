import { Download, FileText } from "lucide-react";

import { DemoBanner } from "@/components/demo-banner";
import { ModuleTable } from "@/components/module/module-table";
import { PageHeader } from "@/components/page-header";
import { getGeneratorLabelMap, getModuleRows } from "@/lib/data";
import { getModuleDefinition } from "@/lib/module-definitions";
import { requireAuthenticated } from "@/lib/auth";

const reportTypes = ["Weekly report", "Monthly report", "Generator health report", "Maintenance due report", "Alarm history report", "Event log analysis"];

export default async function ReportsPage() {
  const definition = getModuleDefinition("reports");
  const context = await requireAuthenticated();
  const [{ rows, isDemo, error }, generatorMap] = await Promise.all([getModuleRows("reports"), getGeneratorLabelMap()]);

  return (
    <div className="space-y-5">
      <PageHeader title={definition.title} description={definition.description} addHref="/reports/new" addLabel={definition.addLabel} role={context.role} allowedRoles={definition.createRoles} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reportTypes.map((type) => (
          <div key={type} className="rounded-md border border-slate-200 bg-white p-5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-teal-50 text-teal-700">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="font-semibold text-slate-950">{type}</h3>
            <p className="mt-2 text-sm text-slate-600">Export workflow placeholder for PDF and CSV generation.</p>
            <button type="button" disabled className="mt-4 inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-500">
              <Download className="h-4 w-4" aria-hidden="true" />
              Export placeholder
            </button>
          </div>
        ))}
      </div>
      {isDemo ? <DemoBanner /> : null}
      {error ? <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
      <ModuleTable definition={definition} rows={rows} context={context} generatorMap={generatorMap} />
    </div>
  );
}
