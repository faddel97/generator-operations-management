import { AlertTriangle, CalendarClock, Gauge, HeartPulse } from "lucide-react";

import { AnalyticsWorkspace } from "@/components/analytics/analytics-workspace";
import { DemoBanner } from "@/components/demo-banner";
import { StatCard } from "@/components/dashboard/stat-card";
import { getDashboardData } from "@/lib/data";

export default async function AnalyticsPage() {
  const dashboard = await getDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-950">Analytics</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Fleet trends, generator specifications, monitored readings, and maintenance exposure.</p>
      </div>
      {dashboard.isDemo ? <DemoBanner /> : null}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Fleet Size" value={dashboard.stats.totalGenerators} detail="Registered generators" icon={Gauge} />
        <StatCard label="Alarm History" value={dashboard.stats.latestAlarms} detail="Open alarm trend input" icon={AlertTriangle} />
        <StatCard label="PM Due" value={dashboard.stats.maintenanceDue} detail="Due in the next 30 days" icon={CalendarClock} />
        <StatCard label="Health Score" value={`${dashboard.stats.averageHealthScore}%`} detail="Fleet-level health summary" icon={HeartPulse} />
      </div>
      <AnalyticsWorkspace trends={dashboard.trends} generators={dashboard.generators} />
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
