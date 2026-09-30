"use client";

import { useMemo, useState } from "react";

import { OperationsCharts, type DashboardTrendMetric } from "@/components/dashboard/operations-charts";
import type { FleetTrendDatum } from "@/types/app";

export function DashboardTrendFilters({
  averageData,
  latestData
}: {
  averageData: FleetTrendDatum[];
  latestData: FleetTrendDatum[];
}) {
  const generatorOptions = useMemo(() => {
    const options = new Map<string, string>();
    [...averageData, ...latestData].forEach((row) => options.set(row.generatorId, row.generatorName));
    return Array.from(options, ([id, label]) => ({ id, label }));
  }, [averageData, latestData]);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => generatorOptions.map((option) => option.id));
  const [mode, setMode] = useState<"average" | "latest">("average");
  const metricOptions: Array<{ id: DashboardTrendMetric; label: string }> = [
    { id: "runningHours", label: "Running hours" },
    { id: "batteryVoltage", label: "Battery voltage" },
    { id: "coolantTemperature", label: "Coolant temperature" },
    { id: "starts", label: "Number of starts" },
    { id: "fuelLevelPercentage", label: "Fuel level" }
  ];
  const [selectedMetrics, setSelectedMetrics] = useState<DashboardTrendMetric[]>(() => metricOptions.map((option) => option.id));
  const source = mode === "average" ? averageData : latestData;
  const filteredData = source.filter((row) => selectedIds.includes(row.generatorId));

  function toggleGenerator(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleMetric(id: DashboardTrendMetric) {
    setSelectedMetrics((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h4 className="font-semibold text-slate-950">Dashboard filters</h4>
            <p className="mt-1 text-sm text-slate-600">Choose one or more generators and display either their average values or latest entry.</p>
          </div>
          <div className="flex rounded-md border border-slate-300 p-1">
            {(["average", "latest"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`rounded px-3 py-1.5 text-sm font-semibold ${mode === value ? "bg-teal-700 text-white" : "text-slate-700 hover:bg-slate-50"}`}
              >
                {value === "average" ? "Average" : "Latest entry"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => setSelectedIds(generatorOptions.map((option) => option.id))} className="text-xs font-semibold text-teal-700 hover:text-teal-900">Select all</button>
          <span className="text-slate-300">|</span>
          <button type="button" onClick={() => setSelectedIds([])} className="text-xs font-semibold text-slate-600 hover:text-slate-900">Clear</button>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {generatorOptions.map((option) => (
            <label key={option.id} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800">
              <input type="checkbox" checked={selectedIds.includes(option.id)} onChange={() => toggleGenerator(option.id)} className="h-4 w-4 accent-teal-700" />
              <span>{option.label}</span>
            </label>
          ))}
        </div>

        <div className="mt-5 border-t border-slate-200 pt-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Show on dashboard</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {metricOptions.map((option) => (
              <label key={option.id} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800">
                <input type="checkbox" checked={selectedMetrics.includes(option.id)} onChange={() => toggleMetric(option.id)} className="h-4 w-4 accent-teal-700" />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {selectedIds.length && selectedMetrics.length ? (
        <OperationsCharts data={filteredData} mode={mode} visibleMetrics={selectedMetrics} />
      ) : (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-6 text-center text-sm text-amber-900">Select at least one generator and one measurement to display DSE charts.</div>
      )}
    </div>
  );
}
