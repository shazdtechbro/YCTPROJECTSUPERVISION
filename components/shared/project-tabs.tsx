"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Activity, BarChart3, CalendarClock, Flag, Ticket } from "lucide-react";

import { getProject, getSubmissionsPage } from "@/lib/firestore";
import { useAsyncData } from "@/hooks/use-async-data";
import { QueryState } from "./query-state";
import { EmptyState } from "./empty-state";
import { PageHeader } from "./page-header";
import { StatusBadge, STATUS_LABEL } from "./status-badge";
import { TicketList } from "./ticket-list";
import { SubmissionList } from "./submission-list";
import { FeedbackPanel } from "./feedback-panel";
import { DefenseDateControl } from "./defense-date-control";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Initials, ProgressBar, SectionCard, toneOf } from "@/components/app/stats";
import { deriveStages, StageTimeline } from "@/components/app/stage-timeline";
import { Reveal } from "@/components/app/motion";
import { EmptySearch } from "@/components/illustrations";
import { formatDate } from "@/lib/format";
import type { ProjectDoc, Role } from "@/lib/types";
import { cn } from "@/lib/utils";

const TABS = ["overview", "tickets", "submissions", "feedback"] as const;
type Tab = (typeof TABS)[number];

/**
 * Shared project workspace for student, supervisor and HOD. `role` decides
 * which actions are available (upload vs review, edit defence date).
 */
export function ProjectTabs({ projectId, role, backHref }: { projectId: string; role: Role; backHref: string }) {
  return (
    <Suspense fallback={<Skeleton className="h-64 rounded-[20px]" />}>
      <Inner projectId={projectId} role={role} backHref={backHref} />
    </Suspense>
  );
}

function daysUntil(iso: string | null) {
  if (!iso) return null;
  return Math.ceil((new Date(`${iso}T23:59:59`).getTime() - Date.now()) / 86_400_000);
}

function Inner({ projectId, role, backHref }: { projectId: string; role: Role; backHref: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const initial = (params.get("tab") as Tab) || "overview";
  const [tab, setTab] = useState<Tab>(TABS.includes(initial) ? initial : "overview");
  const [nonce, setNonce] = useState(0);

  const project = useAsyncData(() => getProject(projectId), [projectId, nonce]);

  function changeTab(t: string) {
    setTab(t as Tab);
    const q = new URLSearchParams(params.toString());
    q.set("tab", t);
    router.replace(`?${q.toString()}`, { scroll: false });
  }

  return (
    <QueryState
      phase={project.phase}
      error={project.error}
      onRetry={project.retry}
      skeleton={
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-9 w-3/4" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-[20px]" />)}</div>
        </div>
      }
      empty={<EmptyState art={<EmptySearch />} title="Project not found" description="It may have been archived, or you do not have access to it." />}
    >
      {project.data && (
        <Workspace project={project.data} role={role} backHref={backHref} tab={tab} changeTab={changeTab} onSaved={() => setNonce((n) => n + 1)} />
      )}
    </QueryState>
  );
}

function Workspace({ project: p, role, backHref, tab, changeTab, onSaved }: { project: ProjectDoc; role: Role; backHref: string; tab: Tab; changeTab: (t: string) => void; onSaved: () => void }) {
  const subs = useAsyncData(async () => (await getSubmissionsPage(p.id, { pageSize: 30 })).items, [p.id]);
  const stages = deriveStages(p, subs.data ?? []);
  const approved = stages.filter((s) => s.state === "approved").length;
  const left = daysUntil(p.defenseDate);

  const stats = [
    { label: "Health", value: STATUS_LABEL[p.milestoneStatus], sub: p.milestoneReason, icon: Activity, hl: true },
    { label: "Progress", value: `${p.progressPct}%`, sub: `${approved} of ${stages.length} stages`, icon: BarChart3 },
    { label: "Open tickets", value: String(p.openTicketCount), sub: "Questions and requests", icon: Ticket },
    { label: "Next deadline", value: formatDate(p.nextDeadline), sub: "Set by your supervisor", icon: Flag },
    { label: "Defence", value: formatDate(p.defenseDate), sub: left == null ? "Not scheduled" : left >= 0 ? `${left} days left` : "Date has passed", icon: CalendarClock },
  ];

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Projects", href: backHref }, { label: p.title }]}
        eyebrow={<><StatusBadge status={p.milestoneStatus} /><StatusBadge status={p.status} />{p.finalApproved && <span className="chip bg-brand-700 text-white">Final approved</span>}</>}
        title={p.title}
        description={`${role === "student" ? `Supervised by ${p.supervisorName}` : `${p.studentName} · supervised by ${p.supervisorName}`} · ${p.department}`}
      />

      <Tabs value={tab} onValueChange={changeTab}>
        <div className="-mx-4 overflow-x-auto px-4 no-scrollbar">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="tickets">Tickets{p.openTicketCount > 0 && <span className="ml-1.5 rounded-full bg-sun-400 px-1.5 text-xs text-ink">{p.openTicketCount}</span>}</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-5 space-y-5">
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 no-scrollbar md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0">
            {stats.map((s) => (
              <div key={s.label} className={cn("min-w-[160px] snap-start rounded-[20px] border p-4 shadow-card", s.hl ? "border-brand-100 bg-brand-50" : "border-line bg-white")}>
                <div className="flex items-center gap-2 text-xs text-ink-3"><s.icon className="h-4 w-4" />{s.label}</div>
                <div className="mt-2 font-display text-lg font-bold leading-tight md:text-xl">{s.value}</div>
                <div className="mt-0.5 line-clamp-2 text-xs text-ink-3">{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
            <div className="min-w-0 space-y-5">
              <Reveal>
                <SectionCard title="Review journey" action={<span className="hidden text-[13px] text-ink-3 sm:block">Built from real submissions</span>}>
                  {subs.phase === "loading" ? <Skeleton className="h-24" /> : <StageTimeline stages={stages} />}
                  <div className="mt-6">
                    <div className="mb-1.5 flex justify-between text-xs text-ink-3"><span>Overall progress</span><b className="tnum text-ink">{p.progressPct}%</b></div>
                    <ProgressBar value={p.progressPct} tone={toneOf(p.milestoneStatus)} />
                  </div>
                </SectionCard>
              </Reveal>
              <Reveal delay={0.06}>
                <SectionCard title="Abstract">
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink-2">{p.abstract}</p>
                </SectionCard>
              </Reveal>
            </div>
            <div className="space-y-5">
              <Reveal>
                <SectionCard title="Team">
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3"><Initials name={p.studentName} /><div><div className="text-sm font-semibold">{p.studentName}</div><div className="text-xs text-ink-3">Student</div></div></li>
                    <li className="flex items-center gap-3"><Initials name={p.supervisorName} /><div><div className="text-sm font-semibold">{p.supervisorName}</div><div className="text-xs text-ink-3">Supervisor</div></div></li>
                  </ul>
                </SectionCard>
              </Reveal>
              {role === "supervisor" && (
                <Reveal delay={0.06}>
                  <DefenseDateControl projectId={p.id} current={p.defenseDate} onSaved={onSaved} />
                </Reveal>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tickets" className="mt-5">
          <TicketList projectId={p.id} canPost={role !== "hod"} />
        </TabsContent>
        <TabsContent value="submissions" className="mt-5">
          <SubmissionList projectId={p.id} canUpload={role === "student"} canReview={role === "supervisor"} />
        </TabsContent>
        <TabsContent value="feedback" className="mt-5">
          <FeedbackPanel projectId={p.id} />
        </TabsContent>
      </Tabs>
    </>
  );
}
