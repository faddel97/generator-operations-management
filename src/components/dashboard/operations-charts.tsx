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

type TrendMetric = "runningHours" | "batteryVoltage" | "coolantTemperature" | "starts";

function formatValue(value: number, unit?: string) {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)}${unit ? ` ${unit}` : ""}`;
}

function TrendChart({
  title,
  data,
  dataKey,
  color,
  unit
}: {
  title: string;
  data: FleetTrendDatum[];
  dataKey: TrendMetric;
  color: string;
  unit?: string;
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
          <p className="text-xs font-semibold uppercase text-teal-700">Per-generator average</p>
          <h3 className="mt-1 text-base font-semibold text-slate-950">{title}</h3>
        </div>
        <p className="text-sm font-medium text-slate-700">
          Fleet average: <span className="font-bold text-slate-950">{fleetAverage === null ? "Not recorded" : formatValue(fleetAverage, unit)}</span>
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
                    `Average across ${item.payload.readingCount} reading${item.payload.readingCount === 1 ? "" : "s"}`
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

export function OperationsCharts({ data }: { data: FleetTrendDatum[] }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <TrendChart title="Average Running Hours" data={data} dataKey="runningHours" color="#0f766e" unit="h" />
      <TrendChart title="Average Battery Voltage" data={data} dataKey="batteryVoltage" color="#2563eb" unit="V" />
      <TrendChart title="Average Coolant Temperature" data={data} dataKey="coolantTemperature" color="#ca8a04" unit="C" />
      <TrendChart title="Average Number of Starts" data={data} dataKey="starts" color="#b91c1c" />
    </div>
  );
}
