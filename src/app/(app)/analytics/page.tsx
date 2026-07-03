import { AlertTriangle, BrainCircuit, ClipboardList, Droplets, HeartPulse, Wrench } from "lucide-react";

import { DemoBanner } from "@/components/demo-banner";
import { OperationsCharts } from "@/components/dashboard/operations-charts";
import { StatCard } from "@/components/dashboard/stat-card";
import { getDashboardData } from "@/lib/data";

export default async function AnalyticsPage() {
  const dashboard = await getDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-950">Reports and Analytics</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Trend analysis for running hours, starts, battery voltage, coolant temperature, alarms, leaks, maintenance due, and health score.</p>
      </div>
      {dashboard.isDemo ? <DemoBanner /> : null}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Alarm History" value={dashboard.stats.latestAlarms} detail="Open alarm trend input" icon={AlertTriangle} />
        <StatCard label="Maintenance Due" value={dashboard.stats.maintenanceDue} detail="Upcoming planned work" icon={Wrench} />
        <StatCard label="Health Score" value={`${dashboard.stats.averageHealthScore}%`} detail="Fleet-level health summary" icon={HeartPulse} />
        <StatCard label="Event Analysis" value="Ready" detail="DSE parser extension point" icon={ClipboardList} />
        <StatCard label="Leak History" value="Tracked" detail="Derived from inspection checklist findings" icon={Droplets} />
        <StatCard label="Predictive Maintenance" value="Placeholder" detail="Model-ready data collection surface" icon={BrainCircuit} />
      </div>
      <OperationsCharts data={dashboard.trends} />
      <section className="rounded-md border border-slate-200 bg-white p-5">
        <h3 className="text-base font-semibold text-slate-950">Recommendations</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-900">Review recurring alarms</p>
            <p className="mt-2 text-sm text-slate-600">Prioritize unresolved critical and warning alarms before scheduled load tests.</p>
          </div>
          <div className="rounded-md border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-900">Watch battery voltage</p>
            <p className="mt-2 text-sm text-slate-600">Flag downward voltage movement across biweekly DSE readings.</p>
          </div>
          <div className="rounded-md border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-900">Plan maintenance capacity</p>
            <p className="mt-2 text-sm text-slate-600">Use due-date reports to group work by site and generator criticality.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
