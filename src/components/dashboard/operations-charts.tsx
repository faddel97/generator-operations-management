"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { demoTrendData } from "@/lib/demo-data";

type TrendRow = (typeof demoTrendData)[number];

function TrendChart({
  title,
  data,
  dataKey,
  color,
  unit
}: {
  title: string;
  data: TrendRow[];
  dataKey: keyof TrendRow;
  color: string;
  unit?: string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-5">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="period" stroke="#64748b" tick={{ fontSize: 12 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => [`${value}${unit ?? ""}`, title]} />
            <Legend />
            <Line type="monotone" dataKey={dataKey} name={title} stroke={color} strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function OperationsCharts({ data }: { data: TrendRow[] }) {
  const chartData = data.length > 0 ? data : demoTrendData;

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <TrendChart title="Running Hours Trend" data={chartData} dataKey="runningHours" color="#0f766e" />
      <TrendChart title="Battery Voltage Trend" data={chartData} dataKey="batteryVoltage" color="#2563eb" unit=" V" />
      <TrendChart title="Coolant Temperature Trend" data={chartData} dataKey="coolantTemperature" color="#ca8a04" unit=" C" />
      <TrendChart title="Number of Starts Trend" data={chartData} dataKey="starts" color="#b91c1c" />
    </div>
  );
}
