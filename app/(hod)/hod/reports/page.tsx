"use client";

import { BarChart3 } from "lucide-react";

import { useAuth } from "@/lib/auth/auth-context";
import {
  getDepartmentActivity,
  getDepartmentDashboardStats,
} from "@/lib/firestore";
import { useAsyncData } from "@/hooks/use-async-data";
import { QueryState } from "@/components/shared/query-state";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { ActivityChart } from "@/components/shared/activity-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ActivityPointDoc, DashboardStatsDoc } from "@/lib/types";

export default function HodReports() {
  const { claims } = useAuth();
  const dept = claims.department ?? "";

  const activity = useAsyncData<ActivityPointDoc[]>(
    () => getDepartmentActivity(dept, 60),
    [dept]
  );
  const rollups = useAsyncData<DashboardStatsDoc[]>(
    () => getDepartmentDashboardStats(dept),
    [dept]
  );

  const milestone = (rollups.data ?? []).reduce(
    (a, r) => ({
      on_track: a.on_track + r.byMilestoneStatus.on_track,
      behind: a.behind + r.byMilestoneStatus.behind,
      stalled: a.stalled + r.byMilestoneStatus.stalled,
    }),
    { on_track: 0, behind: 0, stalled: 0 }
  );
  const mTotal =
    milestone.on_track + milestone.behind + milestone.stalled || 1;
  const totalActivity = (activity.data ?? []).reduce(
    (a, d) => ({
      submissions: a.submissions + d.submissions,
      comments: a.comments + d.comments,
      tickets: a.tickets + d.tickets,
    }),
    { submissions: 0, comments: 0, tickets: 0 }
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description={`Supervision analytics for ${dept || "your department"}.`}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Submissions · 60d", totalActivity.submissions],
          ["Comments · 60d", totalActivity.comments],
          ["Activities · 60d", totalActivity.tickets],
        ].map(([label, value]) => (
          <Card key={label as string}>
            <CardContent className="p-4">
              <p className="text-2xl font-semibold tnum">{value}</p>
              <p className="text-2xs uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity over time — last 60 days</CardTitle>
        </CardHeader>
        <CardContent>
          <QueryState
            phase={activity.phase}
            error={activity.error}
            onRetry={activity.retry}
            skeleton={<Skeleton className="h-64 rounded-lg" />}
            empty={
              <EmptyState
                icon={BarChart3}
                className="min-h-[200px] border-0 bg-transparent"
                title="No activity yet"
                description="Charts fill in as work happens in the department."
              />
            }
          >
            <ActivityChart data={activity.data ?? []} />
          </QueryState>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Milestone distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex h-3 overflow-hidden rounded-full bg-secondary">
            <span
              className="bg-[hsl(var(--status-on-track))]"
              style={{ width: `${(milestone.on_track / mTotal) * 100}%` }}
            />
            <span
              className="bg-[hsl(var(--status-behind))]"
              style={{ width: `${(milestone.behind / mTotal) * 100}%` }}
            />
            <span
              className="bg-[hsl(var(--status-stalled))]"
              style={{ width: `${(milestone.stalled / mTotal) * 100}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Legend label="On track" value={milestone.on_track} tone="on-track" />
            <Legend label="Behind" value={milestone.behind} tone="behind" />
            <Legend label="Stalled" value={milestone.stalled} tone="stalled" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Legend({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "on-track" | "behind" | "stalled";
}) {
  return (
    <div>
      <p className={`text-lg font-semibold tnum text-[hsl(var(--status-${tone}))]`}>
        {value}
      </p>
      <p className="text-2xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
