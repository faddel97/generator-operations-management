import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { atsStuckOnMainsItems } from "@/lib/module-definitions";

export default function AtsStuckOnMainsPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="ATS Stuck on Mains" description="Emergency manual operation procedure for transferring the ATS from mains to generator side." />
      <section className="rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-950">Procedure Steps</h3>
        </div>
        <ol className="divide-y divide-slate-100">
          {atsStuckOnMainsItems.map((item, index) => (
            <li key={item.key} className="flex gap-4 px-5 py-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-teal-50 text-sm font-semibold text-teal-700">{index + 1}</div>
              <div className="flex items-center gap-3 text-sm font-medium text-slate-800">
                <CheckCircle2 className="h-4 w-4 text-teal-700" aria-hidden="true" />
                {item.label}
              </div>
            </li>
          ))}
        </ol>
      </section>
      <Link href="/ats-manual/new" className="inline-flex min-h-10 items-center justify-center rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800">
        Record this operation
      </Link>
    </div>
  );
}
