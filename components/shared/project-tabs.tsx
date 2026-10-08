"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarClock, GraduationCap, User } from "lucide-react";

import { getProject } from "@/lib/firestore";
import { useAsyncData } from "@/hooks/use-async-data";
import { QueryState } from "./query-state";
import { EmptyState } from "./empty-state";
import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";
import { TicketList } from "./ticket-list";
import { SubmissionList } from "./submission-list";
import { FeedbackPanel } from "./feedback-panel";
import { DefenseDateControl } from "./defense-date-control";
import { ProjectWorkflowPanel } from "./project-workflow-panel";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import type { Role } from "@/lib/types";

const TABS = ["overview", "tickets", "submissions", "feedback"] as const;
type Tab = (typeof TABS)[number];

/**
 * Shared project workspace for student & supervisor. `role` decides which
 * actions are available (upload vs review, edit defense date).
 */
export function ProjectTabs({
  projectId,
  role,
  backHref,
}: {
  projectId: string;
  role: Role;
  backHref: string;
}) {
  return (
    <Suspense fallback={<Skeleton className="h-64 rounded-lg" />}>
      <Inner projectId={projectId} role={role} backHref={backHref} />
    </Suspense>
  );
}

function Inner({
  projectId,
  role,
  backHref,
}: {
  projectId: string;
  role: Role;
  backHref: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const initial = (params.get("tab") as Tab) || "overview";
  const [tab, setTab] = useState<Tab>(
    TABS.includes(initial) ? initial : "overview"
  );
  const [nonce, setNonce] = useState(0);

  const project = useAsyncData(() => getProject(projectId), [projectId, nonce]);

  function changeTab(t: string) {
    setTab(t as Tab);
    const q = new URLSearchParams(params.toString());
    q.set("tab", t);
    router.replace(`?${q.toString()}`, { scroll: false });
  }

  return (
    <div>
      <QueryState
        phase={project.phase}
        error={project.error}
        onRetry={project.retry}
        skeleton={
          <div className="mb-6 space-y-2">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        }
        empty={
          <EmptyState
            title="Project not found"
            description="It may have been archived, or you don't have access."
          />
        }
      >
        {project.data && (
          <>
            <PageHeader
              crumbs={[
                { label: "Projects", href: backHref },
                { label: project.data.title },
              ]}
              title={
                <span className="flex flex-wrap items-center gap-2">
                  {project.data.title}
                  <StatusBadge status={project.data.milestoneStatus} />
                </span>
              }
              description={project.data.milestoneReason}
            />

            <Tabs value={tab} onValueChange={changeTab}>
              <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="tickets">Tickets</TabsTrigger>
                <TabsTrigger value="submissions">Submissions</TabsTrigger>
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <div className="space-y-4">
                <Card>
                  <CardContent className="space-y-5 p-5">
                    <div>
                      <p className="text-2xs uppercase tracking-wide text-muted-foreground">
                        Abstract
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                        {project.data.abstract}
                      </p>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span className="tnum">
                          {project.data.progressPct}%
                        </span>
                      </div>
                      <Progress value={project.data.progressPct} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      {role !== "student" && (
                        <Fact
                          icon={User}
                          label="Student"
                          value={`${project.data.studentName} · ${project.data.studentMatricNumber || "Matric number not recorded"}`}
                        />
                      )}
                      {role !== "supervisor" && (
                        <Fact
                          icon={GraduationCap}
                          label="Supervisor"
                          value={project.data.supervisorName}
                        />
                      )}
                      <Fact
                        icon={CalendarClock}
                        label="Defense date"
                        value={formatDate(project.data.defenseDate)}
                      />
                      <Fact
                        label="Open tickets"
                        value={String(project.data.openTicketCount)}
                      />
                    </div>
                    {project.data.memberMatricNumbers?.length ? <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Project team</p><ul className="mt-2 flex flex-wrap gap-2">{project.data.memberMatricNumbers.map((matric, index) => <li key={`${matric}-${index}`} className="rounded-full bg-secondary px-3 py-1 text-sm">{project.data?.memberNames?.[index] ?? "Student"}{matric ? ` · ${matric}` : ""}</li>)}</ul></div> : null}
                    {role === "supervisor" && (
                      <DefenseDateControl
                        projectId={projectId}
                        current={project.data.defenseDate}
                        onSaved={() => setNonce((n) => n + 1)}
                      />
                    )}
                  </CardContent>
                </Card>
                <ProjectWorkflowPanel project={project.data} role={role} onChanged={() => setNonce((n) => n + 1)} />
                </div>
              </TabsContent>

              <TabsContent value="tickets" className="mt-4">
                <TicketList projectId={projectId} canPost={role !== "hod"} />
              </TabsContent>

              <TabsContent value="submissions" className="mt-4">
                <SubmissionList
                  projectId={projectId}
                  canUpload={role === "student" && (project.data.topicStatus ?? "approved") === "approved"}
                  canReview={role === "supervisor"}
                />
                {role === "student" && project.data.topicStatus === "pending" && <p className="mt-3 rounded-md bg-secondary p-3 text-sm">Your supervisor must approve the project topic before chapter submissions can be uploaded.</p>}
              </TabsContent>

              <TabsContent value="feedback" className="mt-4">
                <FeedbackPanel projectId={projectId} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </QueryState>
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-1 text-2xs uppercase tracking-wide text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-medium">{value}</p>
    </div>
  );
}
