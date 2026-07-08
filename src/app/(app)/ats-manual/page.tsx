import Link from "next/link";
import { ArrowRight, SlidersHorizontal } from "lucide-react";

import { DemoBanner } from "@/components/demo-banner";
import { moduleActionErrorMessage, moduleSaveMessage } from "@/components/module/module-pages";
import { ModuleTable } from "@/components/module/module-table";
import { PageHeader } from "@/components/page-header";
import { getGeneratorLabelMap, getModuleRows } from "@/lib/data";
import { getModuleDefinition } from "@/lib/module-definitions";
import { requireAuthenticated } from "@/lib/auth";

const procedures = [
  {
    title: "Case 1: ATS stuck on Mains",
    href: "/ats-manual/stuck-on-mains",
    summary: "Manual transfer from mains to generator when the generator is running and stable."
  },
  {
    title: "Case 2: ATS stuck on Generator",
    href: "/ats-manual/stuck-on-generator",
    summary: "Manual return to mains after the mains source is restored and stable."
  }
];

type ModuleSearchParams = {
  actionError?: string;
  saved?: string;
};

export default async function AtsManualPage({ searchParams }: { searchParams: Promise<ModuleSearchParams> }) {
  const { actionError, saved } = await searchParams;
  const definition = getModuleDefinition("ats-manual-operations");
  const context = await requireAuthenticated();
  const [{ rows, isDemo, error }, generatorMap] = await Promise.all([getModuleRows("ats-manual-operations"), getGeneratorLabelMap()]);
  const actionErrorText = moduleActionErrorMessage(actionError);
  const savedText = moduleSaveMessage(saved);

  return (
    <div className="space-y-5">
      <PageHeader
        title={definition.title}
        description={definition.description}
        addHref="/ats-manual/new"
        addLabel={definition.addLabel}
        role={context.role}
        allowedRoles={definition.createRoles}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {procedures.map((procedure) => (
          <Link key={procedure.href} href={procedure.href} className="group rounded-md border border-slate-200 bg-white p-5 transition hover:border-teal-300 hover:bg-teal-50/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-teal-50 text-teal-700">
                  <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-slate-950">{procedure.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{procedure.summary}</p>
              </div>
              <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-slate-400 transition group-hover:text-teal-700" aria-hidden="true" />
            </div>
          </Link>
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
