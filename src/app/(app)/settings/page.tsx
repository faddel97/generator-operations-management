import { ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/page-header";

const roles = [
  ["Admin", "Create, edit, delete, approve, and manage all operational records."],
  ["Supervisor", "Review and approve submitted inspections, readings, tests, and maintenance."],
  ["Technician", "Submit records, photos, and files for operational workflows."],
  ["Viewer", "View dashboards, reports, and analytics only."]
];

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Settings" description="Administrative reference for role-based access control." />
      <section className="rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-950">Roles</h3>
        </div>
        <div className="grid gap-px bg-slate-100 md:grid-cols-2">
          {roles.map(([role, description]) => (
            <div key={role} className="bg-white p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-teal-50 text-teal-700">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <h4 className="font-semibold text-slate-950">{role}</h4>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
