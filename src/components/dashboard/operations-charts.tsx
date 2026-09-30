"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { FleetTrendDatum } from "@/types/app";

export type DashboardTrendMetric =
  | "runningHours"
  | "batteryVoltage"
  | "coolantTemperature"
  | "starts"
  | "engineSpeedRpm"
  | "fuelLevelLiters"
  | "fuelLevelPercentage";

export type DashboardTrendMode = "average" | "lowest" | "highest" | "latest";

export const dashboardTrendDefinitions: Array<{
  metric: DashboardTrendMetric;
  label: string;
  color: string;
  unit?: string;
}> = [
  { metric: "runningHours", label: "Running Hours", color: "#0f766e", unit: "h" },
  { metric: "starts", label: "Number of Starts", color: "#b91c1c" },
  { metric: "batteryVoltage", label: "Battery Voltage", color: "#2563eb", unit: "V" },
  { metric: "coolantTemperature", label: "Coolant Temperature", color: "#ca8a04", unit: "C" },
  { metric: "engineSpeedRpm", label: "Engine Speed", color: "#7c3aed", unit: "RPM" },
  { metric: "fuelLevelLiters", label: "Fuel in Tank", color: "#0891b2", unit: "L" },
  { metric: "fuelLevelPercentage", label: "Fuel Level", color: "#16a34a", unit: "%" }
];

const modeLabels: Record<DashboardTrendMode, string> = {
  average: "Average",
  lowest: "Lowest",
  highest: "Highest",
  latest: "Latest Entry"
};

function formatValue(value: number, unit?: string) {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)}${unit ? ` ${unit}` : ""}`;
}

function TrendChart({
  title,
  data,
  dataKey,
  color,
  unit,
  mode
}: {
  title: string;
  data: FleetTrendDatum[];
  dataKey: DashboardTrendMetric;
  color: string;
  unit?: string;
  mode: DashboardTrendMode;
}) {
  const chartData = data.flatMap((row) => {
    const value = row[dataKey];

    return typeof value === "number"
      ? [
          {
            generatorName: row.generatorName,
            readingCount: row.readingCount,
            value,
            valueLabel: formatValue(value, unit)
          }
        ]
      : [];
  });
  const fleetAverage = chartData.length ? chartData.reduce((sum, row) => sum + row.value, 0) / chartData.length : null;
  const chartMinWidth = Math.max(460, chartData.length * 150);

  return (
    <div className="rounded-md border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-teal-700">{modeLabels[mode]} per generator</p>
          <h3 className="mt-1 text-base font-semibold text-slate-950">{title}</h3>
        </div>
        <p className="text-sm font-medium text-slate-700">
          Selected generators: <span className="font-bold text-slate-950">{fleetAverage === null ? "Not recorded" : formatValue(fleetAverage, unit)}</span>
        </p>
      </div>

      {chartData.length ? (
        <div className="mt-4 overflow-x-auto">
          <div className="h-80" style={{ minWidth: `${chartMinWidth}px` }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: 0, right: 18, top: 28, bottom: 46 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="generatorName"
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  angle={-18}
                  textAnchor="end"
                  interval={0}
                  height={72}
                />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip
                  labelFormatter={(label) => `Generator: ${label}`}
                  formatter={(value, _name, item) => [
                    String(item.payload.valueLabel ?? value),
                    mode === "latest"
                      ? "Latest recorded entry"
                      : `${modeLabels[mode]} across ${item.payload.readingCount} reading${item.payload.readingCount === 1 ? "" : "s"}`
                  ]}
                />
                <Bar dataKey="value" name={title} fill={color} radius={[4, 4, 0, 0]} maxBarSize={58}>
                  <LabelList dataKey="valueLabel" position="top" fill="#334155" fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <p className="mt-8 text-center text-sm text-slate-600">No recorded readings are available for this measurement.</p>
      )}
    </div>
  );
}

export function OperationsCharts({
  data,
  mode = "average",
  visibleMetrics = dashboardTrendDefinitions.map((chart) => chart.metric)
}: {
  data: FleetTrendDatum[];
  mode?: DashboardTrendMode;
  visibleMetrics?: DashboardTrendMetric[];
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {dashboardTrendDefinitions.filter((chart) => visibleMetrics.includes(chart.metric)).map((chart) => (
        <TrendChart
          key={chart.metric}
          title={`${modeLabels[mode]} ${chart.label}`}
          data={data}
          dataKey={chart.metric}
          color={chart.color}
          unit={chart.unit}
          mode={mode}
        />
      ))}
    </div>
  );
}
