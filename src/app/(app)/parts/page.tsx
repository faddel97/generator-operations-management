import { Cog, ListChecks } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { generatorPartCategories, generatorParts } from "@/lib/generator-parts";

export default function GeneratorPartsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Generator Parts"
        description="Component-level reference for how a diesel generator is built, what each part does, and what technicians should monitor during inspection and maintenance."
      />

      <section className="rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-950">Parts Overview</h3>
        </div>
        <dl className="grid gap-px bg-slate-100 sm:grid-cols-2 xl:grid-cols-4">
          <div className="bg-white px-5 py-4">
            <dt className="text-xs font-semibold uppercase text-slate-500">Total Parts</dt>
            <dd className="mt-1 text-2xl font-semibold text-slate-950">{generatorParts.length}</dd>
          </div>
          <div className="bg-white px-5 py-4">
            <dt className="text-xs font-semibold uppercase text-slate-500">Categories</dt>
            <dd className="mt-1 text-2xl font-semibold text-slate-950">{generatorPartCategories.length}</dd>
          </div>
          <div className="bg-white px-5 py-4">
            <dt className="text-xs font-semibold uppercase text-slate-500">Primary Purpose</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">Reliability, safety, operation, and maintenance readiness</dd>
          </div>
          <div className="bg-white px-5 py-4">
            <dt className="text-xs font-semibold uppercase text-slate-500">Use In System</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">Inspection, maintenance, troubleshooting, and component history</dd>
          </div>
        </dl>
      </section>

      {generatorPartCategories.map((category) => {
        const parts = generatorParts.filter((part) => part.category === category);

        return (
          <section key={category} className="rounded-md border border-slate-200 bg-white">
            <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-50 text-teal-700">
                  <Cog className="h-4 w-4" aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold text-slate-950">{category}</h3>
              </div>
              <span className="text-sm font-medium text-slate-500">{parts.length} parts</span>
            </div>

            <div className="grid gap-px bg-slate-100 lg:grid-cols-2 2xl:grid-cols-3">
              {parts.map((part) => (
                <article key={part.number} className="bg-white p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-900 text-sm font-semibold text-white">
                      {part.number}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-base font-semibold text-slate-950">{part.name}</h4>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{part.purpose}</p>
                      <div className="mt-4 border-l-2 border-teal-600 pl-3">
                        <div className="flex items-start gap-2">
                          <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" aria-hidden="true" />
                          <div>
                            <div className="text-xs font-semibold uppercase text-slate-500">Technician Focus</div>
                            <p className="mt-1 text-sm leading-6 text-slate-700">{part.technicianFocus}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
