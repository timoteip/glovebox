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
  mpg: number; // economy value, in the vehicle's unit
  legacy?: boolean; // imported reading, not a full-to-full interval
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

export function MpgChart({ data, unit = "mpg" }: { data: MpgPoint[]; unit?: string }) {
  if (data.length < 2) {
    return (
      <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Need at least two fill-ups to show the economy trend.
      </p>
    );
  }

  const hasLegacy = data.some((d) => d.legacy);

  // Imported readings are drawn in amber so they read as a separate, historical
  // series from the blue full-to-full intervals.
  const renderDot = (props: { cx?: number; cy?: number; index?: number; payload?: MpgPoint }) => {
    const { cx, cy, index, payload } = props;
    const legacy = payload?.legacy;
    return (
      <circle
        key={index}
        cx={cx}
        cy={cy}
        r={3}
        fill={legacy ? "#f59e0b" : "#3b82f6"}
      />
    );
  };

  return (
    <>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={44} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(v) => [`${(v as number).toFixed(1)} ${unit}`, "Economy"]}
          />
          <Line
            type="monotone"
            dataKey="mpg"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={renderDot}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
      {hasLegacy && (
        <p className="mt-2 text-center text-xs text-zinc-400 dark:text-zinc-500">
          <span className="text-amber-500">●</span> Imported readings — shown for reference, excluded from the stats above.
        </p>
      )}
    </>
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
          formatter={(v) => [`$${(v as number).toFixed(2)}`, "Cost"]}
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
          formatter={(v) => [`$${(v as number).toFixed(2)}`, "Total"]}
        />
        <Bar dataKey="cost" fill="#f59e0b" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
