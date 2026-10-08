"use client";

import Link from "next/link";
import { FolderKanban } from "lucide-react";

import { useAuth } from "@/lib/auth/auth-context";
import {
  getDashboardStats,
  getDepartmentProjectsPage,
} from "@/lib/firestore";
import { useAsyncData } from "@/hooks/use-async-data";
import { QueryState } from "@/components/shared/query-state";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
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
import { formatDate, formatRelativeTime } from "@/lib/format";
import type { DashboardStatsDoc, ProjectDoc } from "@/lib/types";

export default function SupervisorDrilldown({
  params,
}: {
  params: { supervisorId: string };
}) {
  const { claims } = useAuth();
  const dept = claims.department ?? "";
  const sid = params.supervisorId;

  const stats = useAsyncData<DashboardStatsDoc | null>(
    () => getDashboardStats(sid),
    [sid]
  );
  const projects = useAsyncData<ProjectDoc[]>(async () => {
    const page = await getDepartmentProjectsPage(dept, "all", { pageSize: 100 });
    return page.items.filter((p) => p.supervisorId === sid);
  }, [dept, sid]);

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[
          { label: "Supervisors", href: "/hod/supervisors" },
          { label: stats.data?.supervisorName ?? "Supervisor" },
        ]}
        title={stats.data?.supervisorName ?? "Supervisor"}
        description="Supervision load, responsiveness and every project's audit trail."
      />

      <QueryState
        phase={stats.phase}
        error={stats.error}
        onRetry={stats.retry}
        skeleton={<StatCardsSkeleton count={4} />}
        empty={
          <EmptyState
            title="No rollup for this supervisor"
            description="They have no active projects yet."
          />
        }
      >
        {stats.data && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Active projects" value={stats.data.activeProjects} />
            <Metric label="Overdue" value={stats.data.overdueCount} />
            <Metric label="Pending reviews" value={stats.data.pendingSubmissions} />
            <Metric
              label="Avg response"
              value={
                stats.data.avgResponseHours == null
                  ? "—"
                  : `${stats.data.avgResponseHours}h`
              }
            />
          </div>
        )}
      </QueryState>

      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <QueryState
            phase={projects.phase}
            error={projects.error}
            onRetry={projects.retry}
            skeleton={<TableSkeleton rows={5} columns={5} />}
            empty={
              <EmptyState
                icon={FolderKanban}
                className="min-h-[160px] border-0 bg-transparent"
                title="No projects"
                description="This supervisor has no projects in the department."
              />
            }
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-surface/60">
                  <TableHead>Project</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Milestone</TableHead>
                  <TableHead>Defense</TableHead>
                  <TableHead className="text-right">Last activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(projects.data ?? []).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/hod/projects/${p.id}`}
                        className="hover:underline"
                      >
                        {p.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.studentName} · {p.studentMatricNumber || "Matric number not recorded"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={p.milestoneStatus} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(p.defenseDate)}
                    </TableCell>
                    <TableCell className="text-right text-2xs text-muted-foreground">
                      {formatRelativeTime(p.lastActivityAt)}
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

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-2xl font-semibold tnum">{value}</p>
        <p className="text-2xs uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
      </CardContent>
    </Card>
  );
}
