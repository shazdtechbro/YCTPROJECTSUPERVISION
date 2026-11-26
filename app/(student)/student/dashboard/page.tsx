"use client";

import { OfficialDefence } from "@/components/shared/official-defence";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProgressRing } from "@/components/app/stats";
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
      <div className="mb-5"><OfficialDefence startedAt={project.data?.createdAt?.toMillis?.()} actualProgress={project.data?.progressPct} /></div>

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
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardContent className="flex flex-wrap items-center justify-between gap-6 p-5 sm:p-6">
          <div className="min-w-0 flex-1 space-y-3">
            <StatusBadge status={project.milestoneStatus} />
            <CardTitle className="break-words">{project.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{stage.label} · {project.progressPct}% chapter progress</p>
          <Link href={href} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
            Open My project <ArrowRight className="h-4 w-4" />
          </Link>
          </div>
          <div aria-hidden="true"><ProgressRing value={project.progressPct} size={80} stroke={7} /></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Needs your attention</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {project.topicStatus === "pending" ? (
            <p><strong>Waiting for {project.supervisorName || "your supervisor"}.</strong> Ask your supervisor to approve your topic. You can upload your proposal now, and chapter uploads open after approval.</p>
          ) : project.topicStatus === "declined" ? (
            <p><strong>Your topic needs changes.</strong> Open My project, read your supervisor’s feedback, and send a revised topic.</p>
          ) : <p>{project.milestoneReason}</p>}
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
          ) : <p className="text-muted-foreground">Ask your supervisor to set deadlines for your proposal and chapters. The dates will appear here.</p>}
        </CardContent>
      </Card>
      <div className="lg:col-span-2"><ProjectActivityLog projectId={project.id} title="Recent activity" limit={5} /></div>
    </div>
  );
}
