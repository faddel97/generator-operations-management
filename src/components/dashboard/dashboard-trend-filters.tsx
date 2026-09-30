"use client";

import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

import {
  dashboardTrendDefinitions,
  OperationsCharts,
  type DashboardTrendMetric,
  type DashboardTrendMode
} from "@/components/dashboard/operations-charts";
import type { FleetTrendDatum } from "@/types/app";

type DropdownOption = {
  id: string;
  label: string;
  detail?: string;
};

function CheckboxDropdown({
  label,
  options,
  selected,
  onToggle,
  onSelectAll,
  onClear
}: {
  label: string;
  options: DropdownOption[];
  selected: string[];
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
}) {
  return (
    <details className="group relative">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:border-teal-500 [&::-webkit-details-marker]:hidden">
        <span>{label} <span className="font-normal text-slate-500">({selected.length}/{options.length})</span></span>
        <ChevronDown className="h-4 w-4 text-slate-500 transition group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="absolute left-0 z-30 mt-2 w-full min-w-72 rounded-md border border-slate-200 bg-white p-3 shadow-xl">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <button type="button" onClick={onSelectAll} className="text-xs font-semibold text-teal-700 hover:text-teal-900">Select all</button>
          <span className="text-slate-300">|</span>
          <button type="button" onClick={onClear} className="text-xs font-semibold text-slate-600 hover:text-slate-900">Clear</button>
        </div>
        <div className="mt-2 max-h-72 space-y-1 overflow-y-auto pr-1">
          {options.map((option) => (
            <label key={option.id} className="flex cursor-pointer items-start gap-2 rounded px-2 py-2 text-sm text-slate-800 hover:bg-slate-50">
              <input type="checkbox" checked={selected.includes(option.id)} onChange={() => onToggle(option.id)} className="mt-0.5 h-4 w-4 shrink-0 accent-teal-700" />
              <span>
                <span className="block">{option.label}</span>
                {option.detail ? <span className="block text-xs text-slate-500">{option.detail}</span> : null}
              </span>
            </label>
          ))}
        </div>
      </div>
    </details>
  );
}

const calculationOptions: Array<{ id: DashboardTrendMode; label: string; detail: string }> = [
  { id: "average", label: "Average", detail: "Mean of all recorded entries" },
  { id: "lowest", label: "Lowest", detail: "Minimum recorded value" },
  { id: "highest", label: "Highest", detail: "Maximum recorded value" },
  { id: "latest", label: "Latest entry", detail: "Most recent recorded value" }
];

export function DashboardTrendFilters({
  averageData,
  lowestData,
  highestData,
  latestData
}: {
  averageData: FleetTrendDatum[];
  lowestData: FleetTrendDatum[];
  highestData: FleetTrendDatum[];
  latestData: FleetTrendDatum[];
}) {
  const generatorOptions = useMemo<DropdownOption[]>(() => averageData.map((row) => ({
    id: row.generatorId,
    label: row.generatorName,
    detail: row.readingCount ? `${row.readingCount} DSE reading${row.readingCount === 1 ? "" : "s"}` : "No DSE readings yet"
  })), [averageData]);
  const characteristicOptions = useMemo<DropdownOption[]>(() => dashboardTrendDefinitions.map((definition) => ({
    id: definition.metric,
    label: definition.label,
    detail: definition.unit ? `Unit: ${definition.unit}` : undefined
  })), []);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => generatorOptions.map((option) => option.id));
  const [selectedMetrics, setSelectedMetrics] = useState<DashboardTrendMetric[]>(() => dashboardTrendDefinitions.map((option) => option.metric));
  const [mode, setMode] = useState<DashboardTrendMode>("average");
  const sourceByMode: Record<DashboardTrendMode, FleetTrendDatum[]> = {
    average: averageData,
    lowest: lowestData,
    highest: highestData,
    latest: latestData
  };
  const filteredData = sourceByMode[mode].filter((row) => selectedIds.includes(row.generatorId));

  function toggleGenerator(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleMetric(id: string) {
    const metric = id as DashboardTrendMetric;
    setSelectedMetrics((current) => current.includes(metric) ? current.filter((item) => item !== metric) : [...current, metric]);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-slate-200 bg-white p-5">
        <div>
          <h4 className="font-semibold text-slate-950">Dashboard filters</h4>
          <p className="mt-1 text-sm text-slate-600">Choose any generators and characteristics, then select how readings should be calculated.</p>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <CheckboxDropdown
            label="Generators"
            options={generatorOptions}
            selected={selectedIds}
            onToggle={toggleGenerator}
            onSelectAll={() => setSelectedIds(generatorOptions.map((option) => option.id))}
            onClear={() => setSelectedIds([])}
          />
          <CheckboxDropdown
            label="Characteristics"
            options={characteristicOptions}
            selected={selectedMetrics}
            onToggle={toggleMetric}
            onSelectAll={() => setSelectedMetrics(dashboardTrendDefinitions.map((option) => option.metric))}
            onClear={() => setSelectedMetrics([])}
          />
          <details className="group relative">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:border-teal-500 [&::-webkit-details-marker]:hidden">
              <span>Calculation <span className="font-normal text-slate-500">({calculationOptions.find((option) => option.id === mode)?.label})</span></span>
              <ChevronDown className="h-4 w-4 text-slate-500 transition group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="absolute right-0 z-30 mt-2 w-full min-w-72 rounded-md border border-slate-200 bg-white p-3 shadow-xl">
              {calculationOptions.map((option) => (
                <label key={option.id} className="flex cursor-pointer items-start gap-2 rounded px-2 py-2 text-sm text-slate-800 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={mode === option.id}
                    onChange={() => setMode(option.id)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-teal-700"
                  />
                  <span>
                    <span className="block font-medium">{option.label}</span>
                    <span className="block text-xs text-slate-500">{option.detail}</span>
                  </span>
                </label>
              ))}
            </div>
          </details>
        </div>
      </div>

      {selectedIds.length && selectedMetrics.length ? (
        <OperationsCharts data={filteredData} mode={mode} visibleMetrics={selectedMetrics} />
      ) : (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-6 text-center text-sm text-amber-900">Select at least one generator and one characteristic to display DSE charts.</div>
      )}
    </div>
  );
}
