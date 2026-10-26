"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ActivityPointDoc } from "@/lib/types";

/** Supervision activity over time. Feed it `getDepartmentActivity()` output. */
export function ActivityChart({ data }: { data: ActivityPointDoc[] }) {
  const rows = data.map((d) => ({
    ...d,
    label: d.day.slice(5), // mm-dd
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id="gSub" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "hsl(var(--muted-foreground))" }}
          />
          <Area
            type="monotone"
            dataKey="submissions"
            name="Submissions"
            stroke="hsl(var(--primary))"
            fill="url(#gSub)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="comments"
            name="Comments"
            stroke="hsl(var(--status-on-track))"
            fill="transparent"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="tickets"
            name="Activities"
            stroke="hsl(var(--status-behind))"
            fill="transparent"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
