import { AlertTriangle, ClipboardCheck, Gauge, HeartPulse, Wrench } from "lucide-react";

import { DemoBanner } from "@/components/demo-banner";
import { OperationsCharts } from "@/components/dashboard/operations-charts";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getDashboardData, getGeneratorLabelMap } from "@/lib/data";
import { formatDate } from "@/lib/format";

export default async function DashboardPage() {
  const [dashboard, generatorMap] = await Promise.all([getDashboardData(), getGeneratorLabelMap()]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-950">Operations Dashboard</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Asset health, maintenance exposure, latest alarms, inspection activity, and DSE trend analytics.</p>
      </div>
      {dashboard.isDemo ? <DemoBanner /> : null}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Generators" value={dashboard.stats.totalGenerators} detail="Registered generator assets" icon={Gauge} />
        <StatCard label="Maintenance Due" value={dashboard.stats.maintenanceDue} detail="Due within 30 days" icon={Wrench} />
        <StatCard label="Latest Alarms" value={dashboard.stats.latestAlarms} detail="Open alarm records" icon={AlertTriangle} />
        <StatCard label="Latest Inspections" value={dashboard.stats.latestInspections} detail="Recent weekly records" icon={ClipboardCheck} />
        <StatCard label="Health Score" value={`${dashboard.stats.averageHealthScore}%`} detail="Average registered health" icon={HeartPulse} />
      </div>

      <OperationsCharts data={dashboard.trends} />

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-md border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-base font-semibold text-slate-950">Latest Alarms</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {dashboard.latestAlarms.length ? (
              dashboard.latestAlarms.map((alarm) => (
                <div key={String(alarm.id)} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto]">
                  <div>
                    <p className="font-medium text-slate-900">{String(alarm.message ?? "Alarm record")}</p>
                    <p className="mt-1 text-sm text-slate-500">{generatorMap.get(String(alarm.generator_id)) ?? String(alarm.generator_id ?? "Unassigned")}</p>
                  </div>
                  <StatusBadge value={alarm.severity} />
                </div>
              ))
            ) : (
              <p className="px-5 py-6 text-sm text-slate-600">No alarms found.</p>
            )}
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-base font-semibold text-slate-950">Latest Inspections</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {dashboard.latestInspections.length ? (
              dashboard.latestInspections.map((inspection) => (
                <div key={String(inspection.id)} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto]">
                  <div>
                    <p className="font-medium text-slate-900">{generatorMap.get(String(inspection.generator_id)) ?? String(inspection.generator_id ?? "Generator")}</p>
                    <p className="mt-1 text-sm text-slate-500">{formatDate(inspection.inspection_date)}</p>
                  </div>
                  <StatusBadge value={inspection.overall_status ?? inspection.approval_status} />
                </div>
              ))
            ) : (
              <p className="px-5 py-6 text-sm text-slate-600">No inspections found.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
