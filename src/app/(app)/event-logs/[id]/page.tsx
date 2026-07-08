import { notFound } from "next/navigation";

import { DemoBanner } from "@/components/demo-banner";
import { PageHeader } from "@/components/page-header";
import { getGeneratorLabelMap, getModuleRecord } from "@/lib/data";
import { formatDate, humanize } from "@/lib/format";
import { requireAuthenticated } from "@/lib/auth";

function prettyJson(value: unknown) {
  if (value === null || value === undefined) {
    return "{}";
  }

  return JSON.stringify(value, null, 2);
}

export default async function EventLogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAuthenticated();
  const [{ row, isDemo, error }, generatorMap] = await Promise.all([getModuleRecord("event-logs", id), getGeneratorLabelMap()]);

  if (!row) {
    notFound();
  }

  const generatorLabel = typeof row.generator_id === "string" ? generatorMap.get(row.generator_id) ?? row.generator_id : null;
  const changedFields = Array.isArray(row.changed_fields) ? row.changed_fields : [];
  const beforeData = row.before_data ?? {};
  const afterData = row.after_data ?? {};
  const payload = row.details ?? row.raw_payload ?? {};

  return (
    <div className="space-y-5">
      <PageHeader
        title={String(row.entity_label ?? row.message ?? "Audit event")}
        description={String(row.message ?? "Automatic audit trail entry.")}
      />
      {isDemo ? <DemoBanner /> : null}
      {error ? <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
      <section className="rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-950">Event Overview</h3>
        </div>
        <dl className="grid gap-px bg-slate-100 md:grid-cols-2 xl:grid-cols-3">
          {[
            ["Event Date", formatDate(row.event_date)],
            ["Action", humanize(String(row.event_action ?? row.event_type ?? "Not set"))],
            ["Source Table", humanize(String(row.entity_table ?? "Not set"))],
            ["Record", String(row.entity_label ?? row.entity_id ?? "Not set")],
            ["Actor", String(row.actor_name ?? row.actor_email ?? "System")],
            ["Actor Role", humanize(String(row.actor_role ?? "system"))],
            ["Generator", generatorLabel ?? "Not linked"],
            ["Changed Fields", changedFields.length ? changedFields.join(", ") : "None captured"]
          ].map(([label, value]) => (
            <div key={label} className="bg-white px-5 py-4">
              <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-md border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-base font-semibold text-slate-950">Change Payload</h3>
          </div>
          <div className="space-y-4 p-5">
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Before</h4>
              <pre className="mt-2 overflow-x-auto rounded-md bg-slate-950 px-4 py-3 text-xs leading-5 text-slate-100">{prettyJson(beforeData)}</pre>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800">After</h4>
              <pre className="mt-2 overflow-x-auto rounded-md bg-slate-950 px-4 py-3 text-xs leading-5 text-slate-100">{prettyJson(afterData)}</pre>
            </div>
          </div>
        </section>
        <section className="rounded-md border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-base font-semibold text-slate-950">Raw Event Data</h3>
          </div>
          <div className="space-y-4 p-5">
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Details</h4>
              <pre className="mt-2 overflow-x-auto rounded-md bg-slate-950 px-4 py-3 text-xs leading-5 text-slate-100">{prettyJson(payload)}</pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
