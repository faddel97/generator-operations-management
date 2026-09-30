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

export type DashboardTrendMetric = "runningHours" | "batteryVoltage" | "coolantTemperature" | "starts" | "fuelLevelPercentage";

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
  mode: "average" | "latest";
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
          <p className="text-xs font-semibold uppercase text-teal-700">{mode === "average" ? "Per-generator average" : "Latest entry per generator"}</p>
          <h3 className="mt-1 text-base font-semibold text-slate-950">{title}</h3>
        </div>
        <p className="text-sm font-medium text-slate-700">
          {mode === "average" ? "Selected average" : "Selected generators"}: <span className="font-bold text-slate-950">{fleetAverage === null ? "Not recorded" : formatValue(fleetAverage, unit)}</span>
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
                    mode === "average"
                      ? `Average across ${item.payload.readingCount} reading${item.payload.readingCount === 1 ? "" : "s"}`
                      : "Latest recorded entry"
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
  visibleMetrics = ["runningHours", "batteryVoltage", "coolantTemperature", "starts", "fuelLevelPercentage"]
}: {
  data: FleetTrendDatum[];
  mode?: "average" | "latest";
  visibleMetrics?: DashboardTrendMetric[];
}) {
  const chartDefinitions: Array<{ metric: DashboardTrendMetric; averageTitle: string; latestTitle: string; color: string; unit?: string }> = [
    { metric: "runningHours", averageTitle: "Average Running Hours", latestTitle: "Running Hours", color: "#0f766e", unit: "h" },
    { metric: "batteryVoltage", averageTitle: "Average Battery Voltage", latestTitle: "Battery Voltage", color: "#2563eb", unit: "V" },
    { metric: "coolantTemperature", averageTitle: "Average Coolant Temperature", latestTitle: "Coolant Temperature", color: "#ca8a04", unit: "C" },
    { metric: "starts", averageTitle: "Average Number of Starts", latestTitle: "Number of Starts", color: "#b91c1c" },
    { metric: "fuelLevelPercentage", averageTitle: "Average Fuel Level", latestTitle: "Fuel Level", color: "#16a34a", unit: "%" }
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {chartDefinitions.filter((chart) => visibleMetrics.includes(chart.metric)).map((chart) => (
        <TrendChart
          key={chart.metric}
          title={mode === "average" ? chart.averageTitle : chart.latestTitle}
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
