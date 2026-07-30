import Image from "next/image";
import { ChevronDown, Cog, ListChecks } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { generatorPartCategories, generatorPartImagePath, generatorParts } from "@/lib/generator-parts";

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

            <div className="grid gap-px bg-slate-100 xl:grid-cols-2">
              {parts.map((part) => (
                <details key={part.number} className="group bg-white">
                  <summary className="grid cursor-pointer list-none gap-4 p-4 transition hover:bg-slate-50 sm:grid-cols-[128px_1fr_auto] sm:items-center">
                    <Image
                      src={generatorPartImagePath(part)}
                      alt={`${part.name} component`}
                      width={360}
                      height={220}
                      className="h-28 w-full rounded-md border border-slate-200 bg-white object-contain p-2 sm:h-24 sm:w-32"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-slate-900 px-2 text-xs font-semibold text-white">
                          {part.number}
                        </span>
                        <span className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold uppercase text-slate-500">{part.category}</span>
                      </div>
                      <h4 className="mt-2 text-base font-semibold text-slate-950">{part.name}</h4>
                    </div>
                    <ChevronDown className="h-5 w-5 text-slate-500 transition group-open:rotate-180" aria-hidden="true" />
                  </summary>

                  <div className="border-t border-slate-200 px-5 pb-5 pt-4">
                    <dl className="grid gap-4 lg:grid-cols-2">
                      <div>
                        <dt className="text-xs font-semibold uppercase text-slate-500">Purpose</dt>
                        <dd className="mt-1 text-sm leading-6 text-slate-700">{part.purpose}</dd>
                      </div>
                      <div className="border-l-2 border-teal-600 pl-3">
                        <dt className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                          <ListChecks className="h-4 w-4 text-teal-700" aria-hidden="true" />
                          Technician Focus
                        </dt>
                        <dd className="mt-1 text-sm leading-6 text-slate-700">{part.technicianFocus}</dd>
                      </div>
                    </dl>
                  </div>
                </details>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
