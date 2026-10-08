"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock, FileText, Ticket } from "lucide-react";

import { useAuth } from "@/lib/auth/auth-context";
import {
  getStudentProjectsPage,
  getTicketsPage,
  getSubmissionsPage,
} from "@/lib/firestore";
import { useAsyncData } from "@/hooks/use-async-data";
import { QueryState } from "@/components/shared/query-state";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Timeline } from "@/components/shared/timeline";
import { StatCardsSkeleton, TimelineSkeleton } from "@/components/shared/skeletons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import type { ActivityEvent, ProjectDoc } from "@/lib/types";
import { ProjectRequestForm } from "@/components/student/project-request-form";
import { MatricNumberSetup } from "@/components/student/matric-number-setup";

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const uid = user?.uid ?? "";

  const project = useAsyncData(async () => {
    const page = await getStudentProjectsPage(uid, { pageSize: 1 });
    return page.items[0] ?? null;
  }, [uid]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Your project, milestone health and recent activity."
      />
      <MatricNumberSetup />

      <QueryState
        phase={project.phase}
        error={project.error}
        onRetry={project.retry}
        skeleton={
          <div className="space-y-6">
            <Skeleton className="h-44 rounded-lg" />
            <StatCardsSkeleton count={3} />
          </div>
        }
        empty={
          <ProjectRequestForm onCreated={project.retry} />
        }
      >
        {project.data && <DashboardBody project={project.data} />}
      </QueryState>
    </div>
  );
}

function DashboardBody({ project }: { project: ProjectDoc }) {
  const activity = useAsyncData<ActivityEvent[]>(async () => {
    const [tickets, subs] = await Promise.all([
      getTicketsPage(project.id, { pageSize: 6 }),
      getSubmissionsPage(project.id, { pageSize: 6 }),
    ]);
    const events: ActivityEvent[] = [
      ...tickets.items.map((t) => ({
        id: `t_${t.id}`,
        kind: "ticket" as const,
        title: t.title,
        actorName: t.authorName,
        at: t.createdAt,
        href: `/student/project/${project.id}?tab=tickets`,
      })),
      ...subs.items.map((s) => ({
        id: `s_${s.id}`,
        kind: "submission" as const,
        title: `${s.title} (v${s.version})`,
        actorName: s.submittedByName,
        at: s.createdAt,
        href: `/student/project/${project.id}?tab=submissions`,
      })),
    ].sort((a, b) => (b.at?.toMillis?.() ?? 0) - (a.at?.toMillis?.() ?? 0));
    return events.slice(0, 8);
  }, [project.id]);

  const tone =
    project.milestoneStatus === "on_track"
      ? "border-[hsl(var(--status-on-track)/0.3)] bg-[hsl(var(--status-on-track)/0.05)]"
      : project.milestoneStatus === "behind"
        ? "border-[hsl(var(--status-behind)/0.3)] bg-[hsl(var(--status-behind)/0.05)]"
        : "border-[hsl(var(--status-stalled)/0.3)] bg-[hsl(var(--status-stalled)/0.05)]";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="gap-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <CardTitle className="text-base">{project.title}</CardTitle>
            <StatusBadge status={project.milestoneStatus} />
          </div>
          {project.topicStatus && <p className="w-fit rounded-full border px-3 py-1 text-xs font-medium capitalize">Topic {project.topicStatus}</p>}
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {project.abstract}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`rounded-md border px-3 py-2 text-xs ${tone}`}>
            {project.milestoneReason}
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span className="tnum">{project.progressPct}%</span>
            </div>
            <Progress value={project.progressPct} />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <Meta label="Supervisor" value={project.supervisorName} />
            <Meta
              label="Defense date"
              value={formatDate(project.defenseDate)}
              icon={CalendarClock}
            />
            <Meta label="Open tickets" value={String(project.openTicketCount)} icon={Ticket} />
          </div>
          <Link
            href={`/student/project/${project.id}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Open project <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          <QueryState
            phase={activity.phase}
            error={activity.error}
            onRetry={activity.retry}
            skeleton={<TimelineSkeleton rows={4} />}
            empty={
              <EmptyState
                icon={FileText}
                className="min-h-[140px] border-0 bg-transparent"
                title="Nothing yet"
                description="Tickets and submissions will appear here as they happen."
              />
            }
          >
            <Timeline events={activity.data ?? []} />
          </QueryState>
        </CardContent>
      </Card>
    </div>
  );
}

function Meta({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ElementType;
}) {
  return (
    <div>
      <p className="flex items-center gap-1 text-2xs uppercase tracking-wide text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <p className="mt-0.5 truncate font-medium">{value}</p>
    </div>
  );
}
