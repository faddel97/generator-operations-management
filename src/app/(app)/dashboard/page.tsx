import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, ClipboardCheck, Gauge, HeartPulse, TimerOff } from "lucide-react";

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
        <p className="mt-2 text-sm leading-6 text-slate-600">Fleet condition, preventive maintenance readiness, alarms, inspections, and monitored operating trends.</p>
      </div>
      {dashboard.isDemo ? <DemoBanner /> : null}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Generators" value={dashboard.stats.totalGenerators} detail="Registered generator assets" icon={Gauge} />
        <StatCard label="Health Score" value={`${dashboard.stats.averageHealthScore}%`} detail="Average registered health" icon={HeartPulse} />
        <StatCard label="Open Alarms" value={dashboard.stats.latestAlarms} detail="Unresolved recent alarms" icon={AlertTriangle} />
        <StatCard label="Inspections" value={dashboard.stats.latestInspections} detail="Latest weekly records" icon={ClipboardCheck} />
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-teal-700">Status PM</p>
            <h3 className="mt-1 text-xl font-semibold text-slate-950">Preventive Maintenance</h3>
          </div>
          <Link href="/maintenance" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-900">
            Open maintenance
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/maintenance" className="group border-l-4 border-amber-500 bg-white px-5 py-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-amber-800">PM Due</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{dashboard.stats.maintenanceDue}</p>
                <p className="mt-2 text-sm text-slate-600">Next 30 days</p>
              </div>
              <CalendarClock className="h-6 w-6 text-amber-600" aria-hidden="true" />
            </div>
          </Link>
          <Link href="/maintenance" className="group border-l-4 border-red-600 bg-white px-5 py-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-red-700">PM Overdue</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{dashboard.stats.maintenanceOverdue}</p>
                <p className="mt-2 text-sm text-slate-600">Past due date</p>
              </div>
              <TimerOff className="h-6 w-6 text-red-600" aria-hidden="true" />
            </div>
          </Link>
          <Link href="/maintenance" className="group border-l-4 border-emerald-600 bg-white px-5 py-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-emerald-700">PM Completed</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{dashboard.stats.maintenanceCompleted}</p>
                <p className="mt-2 text-sm text-slate-600">Approved PM records</p>
              </div>
              <CheckCircle2 className="h-6 w-6 text-emerald-600" aria-hidden="true" />
            </div>
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase text-teal-700">DSE Monitoring</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-950">Operating Trends</h3>
        </div>
        <OperationsCharts data={dashboard.trends} />
      </section>

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
