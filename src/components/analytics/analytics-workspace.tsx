"use client";

import { Activity, BarChart3, ChartPie, Gauge } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { OperationsCharts } from "@/components/dashboard/operations-charts";
import type { GeneratorAnalyticsItem } from "@/lib/data";
import { demoTrendData } from "@/lib/demo-data";
import { humanize } from "@/lib/format";

type AnalyticsMode = "fleet" | "generators";
type ChartType = "donut" | "bar" | "line";

type ChartDatum = {
  name: string;
  value: number;
  valueLabel: string;
};

type NumericMetricKey =
  | "ratedPowerKva"
  | "ratedPowerKw"
  | "ratedVoltage"
  | "ratedCurrent"
  | "frequency"
  | "rpm"
  | "powerFactor"
  | "fuelTankCapacity"
  | "operationTime"
  | "healthScore"
  | "runningHours"
  | "numberOfStarts"
  | "batteryVoltage"
  | "coolantTemperature";

const metrics: Array<{ key: NumericMetricKey; label: string; unit: string }> = [
  { key: "ratedPowerKva", label: "Capacity", unit: "kVA" },
  { key: "ratedPowerKw", label: "Rated Power", unit: "kW" },
  { key: "ratedVoltage", label: "Rated Voltage", unit: "V" },
  { key: "ratedCurrent", label: "Rated Current", unit: "A" },
  { key: "frequency", label: "Frequency", unit: "Hz" },
  { key: "rpm", label: "Rated Speed", unit: "RPM" },
  { key: "powerFactor", label: "Power Factor", unit: "" },
  { key: "fuelTankCapacity", label: "Fuel Capacity", unit: "L" },
  { key: "operationTime", label: "Operation Time", unit: "h" },
  { key: "healthScore", label: "Health Score", unit: "%" },
  { key: "runningHours", label: "DSE Running Hours", unit: "h" },
  { key: "numberOfStarts", label: "Number of Starts", unit: "" },
  { key: "batteryVoltage", label: "Battery Voltage", unit: "V" },
  { key: "coolantTemperature", label: "Coolant Temperature", unit: "C" }
];

const chartColors = ["#0f766e", "#2563eb", "#ca8a04", "#dc2626", "#7c3aed", "#0891b2", "#65a30d", "#ea580c"];

function displayValue(value: number, unit: string) {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)}${unit ? ` ${unit}` : ""}`;
}

function statusClasses(status: string) {
  switch (status.toLowerCase()) {
    case "healthy":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "attention":
      return "bg-amber-50 text-amber-800 ring-amber-200";
    case "critical":
      return "bg-red-50 text-red-700 ring-red-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

function ChartTypeControl({ value, onChange }: { value: ChartType; onChange: (value: ChartType) => void }) {
  return (
    <label className="block min-w-44">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-500">
        <ChartPie className="h-3.5 w-3.5" aria-hidden="true" />
        Chart type
      </span>
      <select value={value} onChange={(event) => onChange(event.target.value as ChartType)} className="form-input min-h-11">
        <option value="donut">Donut</option>
        <option value="bar">Column</option>
        <option value="line">Line</option>
      </select>
    </label>
  );
}

function DonutChart({ data, centerLabel }: { data: ChartDatum[]; centerLabel: string }) {
  return (
    <div className="relative h-[410px] min-w-[620px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="44%" innerRadius={82} outerRadius={132} paddingAngle={2} stroke="#ffffff" strokeWidth={3}>
            {data.map((item, index) => (
              <Cell key={`${item.name}-${index}`} fill={chartColors[index % chartColors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value, _name, item) => [String(item.payload.valueLabel ?? value), item.payload.name]} />
          <Legend iconType="circle" verticalAlign="bottom" wrapperStyle={{ fontSize: 12, lineHeight: "22px" }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute left-1/2 top-[44%] w-36 -translate-x-1/2 -translate-y-1/2 text-center">
        <p className="text-xs font-semibold uppercase text-slate-500">Current view</p>
        <p className="mt-1 text-sm font-bold text-slate-950">{centerLabel}</p>
      </div>
    </div>
  );
}

function GeneratorAnalytics({ generators }: { generators: GeneratorAnalyticsItem[] }) {
  const [view, setView] = useState<"profile" | "compare">("profile");
  const [chartType, setChartType] = useState<ChartType>("donut");
  const [selectedGeneratorId, setSelectedGeneratorId] = useState(generators[0]?.id ?? "");
  const availableMetrics = useMemo(() => metrics.filter((metric) => generators.some((generator) => generator[metric.key] !== null)), [generators]);
  const [selectedMetricKey, setSelectedMetricKey] = useState<NumericMetricKey>("ratedPowerKva");
  const selectedGenerator = generators.find((generator) => generator.id === selectedGeneratorId) ?? generators[0];
  const selectedMetric = availableMetrics.find((metric) => metric.key === selectedMetricKey) ?? availableMetrics[0];

  const profileData = useMemo(() => {
    if (!selectedGenerator) {
      return [];
    }

    return availableMetrics.flatMap((metric) => {
      const value = selectedGenerator[metric.key];

      if (value === null) {
        return [];
      }

      const fleetMaximum = Math.max(...generators.map((generator) => generator[metric.key] ?? 0), value);

      return [
        {
          name: metric.label,
          feature: metric.label,
          relativeValue: fleetMaximum > 0 ? (value / fleetMaximum) * 100 : 0,
          valueLabel: displayValue(value, metric.unit)
        }
      ];
    });
  }, [availableMetrics, generators, selectedGenerator]);

  const comparisonData = useMemo(() => {
    if (!selectedMetric) {
      return [];
    }

    return generators.flatMap((generator) => {
      const value = generator[selectedMetric.key];
      return value === null
        ? []
        : [{ name: generator.generatorId, generator: generator.generatorId, value, valueLabel: displayValue(value, selectedMetric.unit) }];
    });
  }, [generators, selectedMetric]);

  if (generators.length === 0) {
    return (
      <div className="border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
        <Gauge className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
        <h3 className="mt-3 text-base font-semibold text-slate-900">No generator data available</h3>
        <p className="mt-1 text-sm text-slate-600">Generator analytics will appear after the first generator is registered.</p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-5 bg-[#12304a] px-5 py-5 text-white lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-teal-200">Performance workspace</p>
          <h3 className="mt-1 text-xl font-semibold">Generator Analytics</h3>
          <p className="mt-1 text-sm text-slate-200">{generators.length} registered generator{generators.length === 1 ? "" : "s"}</p>
        </div>
        <div className="inline-flex w-fit rounded-md border border-white/20 bg-white/10 p-1" role="tablist" aria-label="Generator analytics view">
          <button
            type="button"
            role="tab"
            aria-selected={view === "profile"}
            onClick={() => setView("profile")}
            className={`inline-flex min-h-9 items-center gap-2 rounded px-3 text-sm font-semibold ${view === "profile" ? "bg-white text-slate-950 shadow-sm" : "text-slate-200 hover:text-white"}`}
          >
            <Gauge className="h-4 w-4" aria-hidden="true" />
            Generator profile
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "compare"}
            onClick={() => setView("compare")}
            className={`inline-flex min-h-9 items-center gap-2 rounded px-3 text-sm font-semibold ${view === "compare" ? "bg-white text-slate-950 shadow-sm" : "text-slate-200 hover:text-white"}`}
          >
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
            Compare feature
          </button>
        </div>
      </div>

      {view === "profile" && selectedGenerator ? (
        <div className="p-5">
          <div className="grid gap-4 border-b border-slate-200 pb-5 lg:grid-cols-[minmax(260px,1fr)_minmax(180px,auto)_2fr] lg:items-end">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase text-slate-500">Generator</span>
              <select value={selectedGenerator.id} onChange={(event) => setSelectedGeneratorId(event.target.value)} className="form-input min-h-11">
                {generators.map((generator) => (
                  <option key={generator.id} value={generator.id}>
                    {generator.label}
                  </option>
                ))}
              </select>
            </label>
            <ChartTypeControl value={chartType} onChange={setChartType} />
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="text-slate-500">Manufacturer</span>
                <span className="ml-2 font-semibold text-slate-900">{selectedGenerator.manufacturer}</span>
              </div>
              <div>
                <span className="text-slate-500">Model</span>
                <span className="ml-2 font-semibold text-slate-900">{selectedGenerator.model || "Not set"}</span>
              </div>
              <div>
                <span className="text-slate-500">Duty</span>
                <span className="ml-2 font-semibold text-slate-900">{humanize(selectedGenerator.duty)}</span>
              </div>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusClasses(selectedGenerator.status)}`}>
                {humanize(selectedGenerator.status)}
              </span>
            </div>
          </div>

          {profileData.length ? (
            <div className="mt-5 overflow-x-auto">
              {chartType === "donut" ? (
                <DonutChart
                  data={profileData.map((item) => ({ name: item.name, value: item.relativeValue, valueLabel: item.valueLabel }))}
                  centerLabel={selectedGenerator.generatorId}
                />
              ) : null}
              {chartType === "bar" ? (
                <div className="h-[430px] min-w-[680px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={profileData} layout="vertical" margin={{ top: 4, right: 90, bottom: 4, left: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} stroke="#64748b" tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="feature" width={135} stroke="#64748b" tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value, _name, item) => [String(item.payload.valueLabel ?? value), "Recorded value"]} />
                      <Bar dataKey="relativeValue" name="Fleet-relative level" fill="#0f766e" radius={[0, 4, 4, 0]} maxBarSize={22}>
                        <LabelList dataKey="valueLabel" position="right" fill="#334155" fontSize={12} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : null}
              {chartType === "line" ? (
                <div className="h-[410px] min-w-[680px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={profileData} margin={{ top: 28, right: 30, bottom: 40, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="feature" angle={-25} textAnchor="end" interval={0} height={78} stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} stroke="#64748b" tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value, _name, item) => [String(item.payload.valueLabel ?? value), "Recorded value"]} />
                      <Line type="monotone" dataKey="relativeValue" name="Fleet-relative level" stroke="#0f766e" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-slate-600">No numeric specifications or monitoring readings are recorded for this generator.</p>
          )}
        </div>
      ) : null}

      {view === "compare" ? (
        <div className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase text-slate-500">Feature</span>
              <select
                value={selectedMetric?.key ?? ""}
                onChange={(event) => setSelectedMetricKey(event.target.value as NumericMetricKey)}
                className="form-input min-h-11"
              >
                {availableMetrics.map((metric) => (
                  <option key={metric.key} value={metric.key}>
                    {metric.label}{metric.unit ? ` (${metric.unit})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <ChartTypeControl value={chartType} onChange={setChartType} />
          </div>

          {comparisonData.length ? (
            <div className="mt-5 overflow-x-auto border-t border-slate-200 pt-5">
              {chartType === "donut" ? (
                <DonutChart data={comparisonData} centerLabel={selectedMetric?.label ?? "Feature"} />
              ) : null}
              {chartType === "bar" ? (
                <div className="h-80" style={{ minWidth: `${Math.max(680, comparisonData.length * 100)}px` }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} margin={{ top: 12, right: 16, bottom: 8, left: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="generator" stroke="#64748b" tick={{ fontSize: 12 }} interval={0} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value, _name, item) => [String(item.payload.valueLabel ?? value), selectedMetric?.label ?? "Value"]} />
                      <Bar dataKey="value" name={selectedMetric?.label ?? "Value"} fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={54}>
                        <LabelList dataKey="valueLabel" position="top" fill="#334155" fontSize={12} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : null}
              {chartType === "line" ? (
                <div className="h-80" style={{ minWidth: `${Math.max(680, comparisonData.length * 100)}px` }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={comparisonData} margin={{ top: 18, right: 24, bottom: 8, left: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="generator" stroke="#64748b" tick={{ fontSize: 12 }} interval={0} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value, _name, item) => [String(item.payload.valueLabel ?? value), selectedMetric?.label ?? "Value"]} />
                      <Line type="monotone" dataKey="value" name={selectedMetric?.label ?? "Value"} stroke="#ca8a04" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-slate-600">No recorded values are available for comparison.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}

export function AnalyticsWorkspace({ trends, generators }: { trends: typeof demoTrendData; generators: GeneratorAnalyticsItem[] }) {
  const [mode, setMode] = useState<AnalyticsMode>("fleet");

  return (
    <div className="space-y-5">
      <div className="flex w-fit rounded-md border border-slate-300 bg-white p-1" role="tablist" aria-label="Analytics section">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "fleet"}
          onClick={() => setMode("fleet")}
          className={`inline-flex min-h-10 items-center gap-2 rounded px-4 text-sm font-semibold ${mode === "fleet" ? "bg-[#15201f] text-white" : "text-slate-600 hover:text-slate-950"}`}
        >
          <Activity className="h-4 w-4" aria-hidden="true" />
          Fleet trends
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "generators"}
          onClick={() => setMode("generators")}
          className={`inline-flex min-h-10 items-center gap-2 rounded px-4 text-sm font-semibold ${mode === "generators" ? "bg-[#15201f] text-white" : "text-slate-600 hover:text-slate-950"}`}
        >
          <Gauge className="h-4 w-4" aria-hidden="true" />
          Generators
        </button>
      </div>

      {mode === "fleet" ? <OperationsCharts data={trends} /> : <GeneratorAnalytics generators={generators} />}
    </div>
  );
}
