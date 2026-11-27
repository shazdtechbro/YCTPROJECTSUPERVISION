"use client";

import Link from "next/link";

import { BarChart3, FileText, MessageSquare, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/app/stats";

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
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        description={`Supervision analytics for ${dept || "your department"}.`}
      />

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline"><Link href="/hod/projects">View department projects</Link></Button>
        <Button asChild variant="outline"><Link href="/hod/supervisors">View supervisor workload</Link></Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
        <Link href="/hod/projects?tab=submissions" aria-label="Browse project submissions" className="rounded-xl focus-visible:ring-2"><StatCard dark label="Submissions · 60 days" value={totalActivity.submissions} icon={FileText} sub="Browse submissions" /></Link>
        <Link href="/hod/projects?tab=feedback" aria-label="Open submission comments" className="rounded-xl focus-visible:ring-2"><StatCard label="Comments · 60 days" value={totalActivity.comments} icon={MessageSquare} sub="Open submission comments" /></Link>
        <Link href="/hod/projects?tab=tickets" aria-label="Browse project tasks" className="rounded-xl focus-visible:ring-2"><StatCard label="Tasks · 60 days" value={totalActivity.tickets} icon={Ticket} sub="Browse tasks" /></Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity over time · last 60 days</CardTitle>
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
          <CardTitle>Project health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-cream-2">
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
            <Legend label="On track" value={milestone.on_track} tone="on-track" health="on_track" />
            <Legend label="Behind" value={milestone.behind} tone="behind" health="behind" />
            <Legend label="Overdue" value={milestone.stalled} tone="stalled" health="stalled" />
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
  health,
}: {
  label: string;
  value: number;
  tone: "on-track" | "behind" | "stalled";
  health: "on_track" | "behind" | "stalled";
}) {
  return (
    <Link href={`/hod/projects?health=${health}`} className="rounded-lg p-2 hover:bg-cream-2 focus-visible:ring-2">
      <p className={`font-display text-2xl font-extrabold tnum text-[hsl(var(--status-${tone}))]`}>
        {value}
      </p>
      <p className="text-xs text-ink-3">
        {label} projects
      </p>
    </Link>
  );
}
