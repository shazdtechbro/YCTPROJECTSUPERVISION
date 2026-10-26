"use client";

import Link from "next/link";
import { BarChart3, Clock, FolderKanban, Users } from "lucide-react";

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
import {
  StatCardsSkeleton,
  TableSkeleton,
} from "@/components/shared/skeletons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { ActivityPointDoc, DashboardStatsDoc } from "@/lib/types";

export default function HodDashboard() {
  const { claims } = useAuth();
  const dept = claims.department ?? "";

  const rollups = useAsyncData<DashboardStatsDoc[]>(
    () => getDepartmentDashboardStats(dept),
    [dept]
  );
  const activity = useAsyncData<ActivityPointDoc[]>(
    () => getDepartmentActivity(dept, 30),
    [dept]
  );

  const totals = (rollups.data ?? []).reduce(
    (a, r) => ({
      active: a.active + r.activeProjects,
      overdue: a.overdue + r.overdueCount,
      pending: a.pending + r.pendingSubmissions,
      supervisors: a.supervisors + 1,
    }),
    { active: 0, overdue: 0, pending: 0, supervisors: 0 }
  );
  const responders = (rollups.data ?? []).filter(
    (r) => r.avgResponseHours != null
  );
  const deptAvgResponse =
    responders.length > 0
      ? Math.round(
          (responders.reduce((s, r) => s + (r.avgResponseHours ?? 0), 0) /
            responders.length) *
            10
        ) / 10
      : null;

  const cards = [
    { label: "Supervisors", value: totals.supervisors, icon: Users },
    { label: "Active projects", value: totals.active, icon: FolderKanban },
    { label: "Overdue", value: totals.overdue, icon: BarChart3 },
    {
      label: "Dept. avg response",
      value: deptAvgResponse == null ? "—" : `${deptAvgResponse}h`,
      icon: Clock,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department dashboard"
        description={`Supervision oversight across ${dept || "your department"}.`}
      />

      <QueryState
        phase={
          rollups.phase === "ready" && (rollups.data?.length ?? 0) === 0
            ? "empty"
            : rollups.phase
        }
        error={rollups.error}
        onRetry={rollups.retry}
        skeleton={<StatCardsSkeleton count={4} />}
        empty={
          <EmptyState
            icon={BarChart3}
            title="No supervision data"
            description="Rollups appear once supervisors have active projects in the department."
          />
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <Card key={c.label}>
              <CardHeader className="flex-row items-center justify-between space-y-0 p-4 pb-1.5">
                <CardTitle className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                  {c.label}
                </CardTitle>
                <c.icon className="h-3.5 w-3.5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-semibold tnum">{c.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </QueryState>

      <Card>
        <CardHeader>
          <CardTitle>Supervision activity — last 30 days</CardTitle>
        </CardHeader>
        <CardContent>
          <QueryState
            phase={activity.phase}
            error={activity.error}
            onRetry={activity.retry}
            skeleton={<Skeleton className="h-64 rounded-lg" />}
            empty={
              <EmptyState
                className="min-h-[200px] border-0 bg-transparent"
                title="No activity recorded yet"
                description="Submissions, comments and activities will chart here as they happen."
              />
            }
          >
            <ActivityChart data={activity.data ?? []} />
          </QueryState>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supervisors</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <QueryState
            phase={rollups.phase}
            error={rollups.error}
            onRetry={rollups.retry}
            skeleton={<TableSkeleton rows={5} columns={5} />}
            empty={
              <EmptyState
                className="min-h-[160px] border-0 bg-transparent"
                title="No supervisors"
                description="Supervisor accounts with projects show up here."
              />
            }
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-surface/60">
                  <TableHead>Supervisor</TableHead>
                  <TableHead className="text-right">Active</TableHead>
                  <TableHead className="text-right">Overdue</TableHead>
                  <TableHead className="text-right">Pending</TableHead>
                  <TableHead className="text-right">Avg response</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(rollups.data ?? [])
                  .slice()
                  .sort((a, b) => b.overdueCount - a.overdueCount)
                  .map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/hod/supervisors/${r.supervisorId}`}
                          className="hover:underline"
                        >
                          {r.supervisorName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right tnum">
                        {r.activeProjects}
                      </TableCell>
                      <TableCell className="text-right tnum">
                        {r.overdueCount}
                      </TableCell>
                      <TableCell className="text-right tnum">
                        {r.pendingSubmissions}
                      </TableCell>
                      <TableCell className="text-right tnum text-muted-foreground">
                        {r.avgResponseHours == null
                          ? "—"
                          : `${r.avgResponseHours}h`}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </QueryState>
        </CardContent>
      </Card>
    </div>
  );
}
