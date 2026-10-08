"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  FileClock,
  FolderKanban,
  Ticket,
} from "lucide-react";

import { useAuth } from "@/lib/auth/auth-context";
import {
  getDashboardStats,
  getSupervisorProjectsPage,
} from "@/lib/firestore";
import { useAsyncData } from "@/hooks/use-async-data";
import { QueryState } from "@/components/shared/query-state";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCardsSkeleton, ListSkeleton } from "@/components/shared/skeletons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/format";
import type { DashboardStatsDoc, ProjectDoc } from "@/lib/types";

export default function SupervisorDashboard() {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const stats = useAsyncData(() => getDashboardStats(uid), [uid]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Rollup across the projects you supervise (read from dashboard_stats)."
      />

      <QueryState
        phase={stats.phase}
        error={stats.error}
        onRetry={stats.retry}
        skeleton={<StatCardsSkeleton count={5} />}
        empty={
          <EmptyState
            icon={FolderKanban}
            title="No stats yet"
            description="Your rollup is generated once you have an active project."
          />
        }
      >
        {stats.data && <Stats stats={stats.data} />}
      </QueryState>

      <AttentionList uid={uid} />
    </div>
  );
}

function Stats({ stats }: { stats: DashboardStatsDoc }) {
  const cards = [
    { label: "Active projects", value: stats.activeProjects, icon: FolderKanban },
    { label: "Overdue", value: stats.overdueCount, icon: AlertTriangle },
    { label: "Pending reviews", value: stats.pendingSubmissions, icon: FileClock },
    { label: "Open tickets", value: stats.openTickets, icon: Ticket },
    {
      label: "Avg response",
      value:
        stats.avgResponseHours == null
          ? "—"
          : `${stats.avgResponseHours}h`,
      icon: Clock,
    },
  ];
  const total =
    stats.byMilestoneStatus.on_track +
      stats.byMilestoneStatus.behind +
      stats.byMilestoneStatus.stalled || 1;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
            Milestone health
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex h-2 overflow-hidden rounded-full bg-secondary">
            <span
              className="bg-[hsl(var(--status-on-track))]"
              style={{ width: `${(stats.byMilestoneStatus.on_track / total) * 100}%` }}
            />
            <span
              className="bg-[hsl(var(--status-behind))]"
              style={{ width: `${(stats.byMilestoneStatus.behind / total) * 100}%` }}
            />
            <span
              className="bg-[hsl(var(--status-stalled))]"
              style={{ width: `${(stats.byMilestoneStatus.stalled / total) * 100}%` }}
            />
          </div>
          <div className="mt-2 flex gap-4 text-2xs text-muted-foreground">
            <span>On track {stats.byMilestoneStatus.on_track}</span>
            <span>Behind {stats.byMilestoneStatus.behind}</span>
            <span>Stalled {stats.byMilestoneStatus.stalled}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AttentionList({ uid }: { uid: string }) {
  const data = useAsyncData<ProjectDoc[]>(async () => {
    const page = await getSupervisorProjectsPage(uid, "active", { pageSize: 40 });
    return page.items
      .filter((p) => p.milestoneStatus !== "on_track")
      .slice(0, 6);
  }, [uid]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Needs attention</CardTitle>
      </CardHeader>
      <CardContent>
        <QueryState
          phase={data.phase}
          error={data.error}
          onRetry={data.retry}
          skeleton={<ListSkeleton rows={3} />}
          empty={
            <EmptyState
              className="min-h-[140px] border-0 bg-transparent"
              title="Everything's on track"
              description="No behind or stalled projects right now."
            />
          }
        >
          <ul className="divide-y rounded-lg border">
            {(data.data ?? []).map((p) => (
              <li key={p.id}>
                <Link
                  href={`/supervisor/projects/${p.id}`}
                  className="flex items-center justify-between gap-3 p-3.5 hover:bg-accent/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.title}</p>
                    <p className="truncate text-2xs text-muted-foreground">
                      {p.studentName} · {p.studentMatricNumber || "Matric number not recorded"} · {p.milestoneReason} ·{" "}
                      {formatRelativeTime(p.lastActivityAt)}
                    </p>
                  </div>
                  <StatusBadge status={p.milestoneStatus} />
                </Link>
              </li>
            ))}
          </ul>
        </QueryState>
      </CardContent>
    </Card>
  );
}
