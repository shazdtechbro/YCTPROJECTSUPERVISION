"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { ActivityPointDoc } from "@/lib/types";

const SERIES = [
  { key: "submissions", name: "Submissions", color: "#006600" },
  { key: "comments", name: "Comments", color: "#E6B400" },
  { key: "tickets", name: "Tasks", color: "#4E8FBF" },
] as const;

/** Supervision activity over time. Monotone lines, axis floored at zero. */
export function ActivityChart({ data }: { data: ActivityPointDoc[] }) {
  const rows = data.map((d) => ({
    ...d,
    label: new Date(`${d.day}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
  }));
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-4 text-xs font-semibold">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5"><span className="h-1 w-3 rounded" style={{ background: s.color }} />{s.name}</span>
        ))}
      </div>
      <div className="h-60 w-full md:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid stroke="#E7E2D5" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6B7269" }} tickLine={false} axisLine={false} minTickGap={28} />
            <YAxis allowDecimals={false} domain={[0, "auto"]} tick={{ fontSize: 12, fill: "#6B7269" }} tickLine={false} axisLine={false} width={36} />
            <Tooltip
              contentStyle={{ background: "#fff", border: "1px solid #E7E2D5", borderRadius: 12, fontSize: 13, boxShadow: "0 8px 24px -12px rgba(17,22,17,.2)" }}
              labelStyle={{ color: "#4A5149", fontWeight: 600 }}
            />
            {SERIES.map((s) => (
              <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2.5} dot={false}
                activeDot={{ r: 4 }} animationDuration={1600} animationEasing="ease-out" />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
