"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export interface MpgPoint {
  label: string; // e.g. "Jan 5"
  mpg: number;
}

export interface CostPoint {
  label: string; // e.g. "Jan '25"
  cost: number;
}

export interface CostByType {
  type: string;
  cost: number;
}

const TOOLTIP_STYLE = {
  backgroundColor: "var(--color-bg, #fff)",
  border: "1px solid var(--color-border, #e4e4e7)",
  borderRadius: 8,
  fontSize: 12,
};

export function MpgChart({ data }: { data: MpgPoint[] }) {
  if (data.length < 2) {
    return (
      <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Need at least two full-tank fill-ups to show MPG trend.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} unit=" mpg" />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(v: number) => [`${v.toFixed(1)} mpg`, "MPG"]}
        />
        <Line
          type="monotone"
          dataKey="mpg"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 3, fill: "#3b82f6" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function MonthlyCostChart({ data }: { data: CostPoint[] }) {
  if (data.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
        No cost data yet.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(v: number) => [`$${v.toFixed(2)}`, "Cost"]}
        />
        <Bar dataKey="cost" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CostByTypeChart({ data }: { data: CostByType[] }) {
  if (data.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
        No cost data yet.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(120, data.length * 40)}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 4, right: 40, bottom: 0, left: 16 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
        <YAxis type="category" dataKey="type" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={52} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(v: number) => [`$${v.toFixed(2)}`, "Total"]}
        />
        <Bar dataKey="cost" fill="#f59e0b" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
