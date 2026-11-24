"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { getStudentProjectsPage, getSubmissionsPage } from "@/lib/firestore";
import { useAsyncData } from "@/hooks/use-async-data";
import { QueryState } from "@/components/shared/query-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCardsSkeleton } from "@/components/shared/skeletons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { currentStage, PROJECT_STAGES, stageDeadline, stageLabel } from "@/lib/project-stages";
import type { ProjectDoc } from "@/lib/types";
import { ProjectRequestForm } from "@/components/student/project-request-form";
import { ProjectActivityLog } from "@/components/shared/project-activity-log";
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
        description="Alerts, deadlines and recent updates."
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
        empty={<ProjectRequestForm onCreated={project.retry} />}
      >
        {project.data && (
          <DashboardBody project={project.data} />
        )}
      </QueryState>
    </div>
  );
}

function DashboardBody({ project }: { project: ProjectDoc }) {
  const stage = currentStage(project);
  const href = `/student/project/${project.id}`;
  const feedback = useAsyncData(async () => {
    const page = await getSubmissionsPage(project.id, { pageSize: 25 });
    const seen = new Set<string>();
    return page.items.filter((submission) => {
      const key = submission.chapterNumber ? `chapter${submission.chapterNumber}` : submission.kind;
      if (seen.has(key)) return false;
      seen.add(key);
      return submission.status === "changes_requested";
    });
  }, [project.id, project.updatedAt]);
  const deadlines = PROJECT_STAGES.flatMap((key) => {
    const date = stageDeadline(project, key);
    return date ? [{ key, date, title: stageLabel(key) }] : [];
  }).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>{project.title}</CardTitle>
          <div><StatusBadge status={project.milestoneStatus} /></div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>{stage.label} · {project.progressPct}% chapter progress</p>
          <Link href={href} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
            Open My project <ArrowRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Needs your attention</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>{project.milestoneReason}</p>
          {project.extensionStatus === "pending" && <p>Your extension request is awaiting a decision.</p>}
          {project.topicStatus === "declined" && <Link className="text-primary underline" href={href}>Revise your project topic</Link>}
          {feedback.error && <button type="button" className="text-primary underline" onClick={feedback.retry}>Retry loading revision alerts</button>}
          {feedback.data?.map((submission) => (
            <p key={submission.id}>
              <Link className="text-primary underline" href={`${href}?tab=feedback`}>Changes requested · {submission.title}</Link>
              {submission.revisionDueDate && ` · Due ${formatDate(submission.revisionDueDate)}`}
            </p>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Stage deadlines</CardTitle></CardHeader>
        <CardContent className="text-sm">
          {deadlines.length > 0 ? (
            <ul className="space-y-2">
              {deadlines.map(({ key, date, title }) => <li className="flex flex-wrap justify-between gap-2" key={key}><span>{title}</span><time dateTime={date}>{formatDate(date)}</time></li>)}
            </ul>
          ) : <p className="text-muted-foreground">Your supervisor hasn’t set any stage deadlines yet.</p>}
        </CardContent>
      </Card>
      <ProjectActivityLog projectId={project.id} title="Recent activity" limit={5} />
    </div>
  );
}
