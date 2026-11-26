"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock, Ticket, Upload } from "lucide-react";

import { useAuth } from "@/lib/auth/auth-context";
import { getCommentsPage, getStudentProjectsPage, getSubmissionsPage, getTicketsPage } from "@/lib/firestore";
import { useAsyncData } from "@/hooks/use-async-data";
import { QueryState } from "@/components/shared/query-state";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Timeline } from "@/components/shared/timeline";
import { TimelineSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Initials, ProgressRing, SectionCard } from "@/components/app/stats";
import { Reveal } from "@/components/app/motion";
import { deriveStages, nextStep, StageTimeline } from "@/components/app/stage-timeline";
import { EmptyAllCaughtUp, EmptyNoSubmissions } from "@/components/illustrations";
import { formatDate, formatRelativeTime } from "@/lib/format";
import type { ActivityEvent, CommentDoc, ProjectDoc, SubmissionDoc } from "@/lib/types";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const first = (user?.displayName ?? "").split(" ")[0];

  const project = useAsyncData(async () => {
    const page = await getStudentProjectsPage(uid, { pageSize: 1 });
    return page.items[0] ?? null;
  }, [uid]);

  return (
    <div>
      <PageHeader
        title={`${greeting()}${first ? `, ${first}` : ""}`}
        description="Here is where your project stands today."
        actions={project.data && (
          <Button asChild>
            <Link href={`/student/project/${project.data.id}?tab=submissions`}><Upload /> Upload work</Link>
          </Button>
        )}
      />

      <QueryState
        phase={project.phase}
        error={project.error}
        onRetry={project.retry}
        skeleton={
          <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
            <Skeleton className="h-[420px] rounded-[20px]" />
            <div className="space-y-5"><Skeleton className="h-40 rounded-[20px]" /><Skeleton className="h-64 rounded-[20px]" /></div>
          </div>
        }
        empty={
          <EmptyState
            art={<EmptyNoSubmissions />}
            title="Your project is on its way"
            description="Your supervisor creates your project record. Once they do, your milestones, deadlines and feedback appear here."
          />
        }
      >
        {project.data && <DashboardBody project={project.data} />}
      </QueryState>
    </div>
  );
}

function DashboardBody({ project }: { project: ProjectDoc }) {
  const data = useAsyncData(async () => {
    const [tickets, subs] = await Promise.all([
      getTicketsPage(project.id, { pageSize: 6 }),
      getSubmissionsPage(project.id, { pageSize: 30 }),
    ]);
    const latestSub = subs.items[0];
    let comments: CommentDoc[] = [];
    if (latestSub) {
      const page = await getCommentsPage(project.id, latestSub.id, { pageSize: 20 });
      comments = page.items.slice(-2).reverse();
    }
    const events: ActivityEvent[] = [
      ...tickets.items.map((t) => ({ id: `t_${t.id}`, kind: "ticket" as const, title: t.title, actorName: t.authorName, at: t.createdAt, href: `/student/project/${project.id}?tab=tickets` })),
      ...subs.items.slice(0, 6).map((s) => ({ id: `s_${s.id}`, kind: "submission" as const, title: `${s.title} (v${s.version})`, actorName: s.submittedByName, at: s.createdAt, href: `/student/project/${project.id}?tab=submissions` })),
    ].sort((a, b) => (b.at?.toMillis?.() ?? 0) - (a.at?.toMillis?.() ?? 0));
    return { subs: subs.items as SubmissionDoc[], events: events.slice(0, 6), comments, latestSub };
  }, [project.id]);

  const stages = deriveStages(project, data.data?.subs ?? []);
  const step = nextStep(project, stages);
  const approved = stages.filter((s) => s.state === "approved").length;
  const href = `/student/project/${project.id}`;

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-5">
        <Reveal>
          <section className="rounded-[20px] border border-line bg-white p-5 shadow-card md:p-6">
            <div className="flex flex-col-reverse gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={project.milestoneStatus} />
                  <StatusBadge status={project.status} />
                </div>
                <h2 className="mt-3 font-display text-[22px] font-bold leading-tight md:text-[24px]">{project.title}</h2>
                <p className="mt-2 text-sm text-ink-2">{project.milestoneReason}</p>
                <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 text-[13px] sm:flex sm:flex-wrap sm:gap-x-8">
                  <div>
                    <dt className="text-ink-3">Supervisor</dt>
                    <dd className="mt-1 flex items-center gap-2 font-semibold"><Initials name={project.supervisorName} size="sm" /><span className="truncate">{project.supervisorName}</span></dd>
                  </div>
                  <div><dt className="text-ink-3">Defence date</dt><dd className="mt-1 font-semibold">{formatDate(project.defenseDate)}</dd></div>
                  <div><dt className="text-ink-3">Open tickets</dt><dd className="mt-1 font-semibold">{project.openTicketCount}</dd></div>
                  <div><dt className="text-ink-3">Next deadline</dt><dd className="mt-1 font-semibold">{formatDate(project.nextDeadline)}</dd></div>
                </dl>
              </div>
              <div className="self-center sm:self-start">
                <ProgressRing value={project.progressPct} size={132} label="Progress" />
              </div>
            </div>
            <div className="mt-7 border-t border-line pt-6">
              {data.phase === "loading" ? <Skeleton className="h-24" /> : <StageTimeline stages={stages} />}
              <p className="mt-4 text-xs text-ink-3">{approved} of {stages.length} stages complete</p>
            </div>
          </section>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-2">
          <Reveal delay={0.06}>
            <SectionCard title="Latest feedback" action={<Link href={`${href}?tab=feedback`} className="text-[13px] font-semibold text-brand-700">View all</Link>} className="h-full">
              {data.phase === "loading" ? <TimelineSkeleton rows={2} /> : (data.data?.comments.length ?? 0) === 0 ? (
                <div className="text-center"><EmptyAllCaughtUp /><p className="mt-2 text-sm text-ink-2">No comments yet. Feedback on your latest upload shows here.</p></div>
              ) : (
                <ul className="space-y-4">
                  {data.data!.comments.map((c) => (
                    <li key={c.id} className="flex gap-3">
                      <Initials name={c.authorName} />
                      <div className="min-w-0">
                        <div className="text-[13px]"><b>{c.authorName}</b> <span className="text-ink-3">· {formatRelativeTime(c.createdAt)}</span></div>
                        <p className="mt-1 line-clamp-3 text-sm text-ink-2">{c.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </Reveal>
          <Reveal delay={0.12}>
            <SectionCard title="Key dates" className="h-full">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-3 rounded-xl bg-cream-2 p-3"><CalendarClock className="h-5 w-5 text-brand-700" /><span className="flex-1">Defence</span><b>{formatDate(project.defenseDate)}</b></li>
                <li className="flex items-center gap-3 rounded-xl bg-cream-2 p-3"><CalendarClock className="h-5 w-5 text-behind" /><span className="flex-1">Next deadline</span><b>{formatDate(project.nextDeadline)}</b></li>
                <li className="flex items-center gap-3 rounded-xl bg-cream-2 p-3"><Ticket className="h-5 w-5 text-ink-2" /><span className="flex-1">Open tickets</span><b>{project.openTicketCount}</b></li>
              </ul>
            </SectionCard>
          </Reveal>
        </div>
      </div>

      <div className="space-y-5">
        <Reveal>
          <section className="rounded-[20px] bg-sun-400 p-5 shadow-card md:p-6">
            <div className="text-[13px] font-semibold">Your next step</div>
            <div className="mt-2 font-display text-[22px] font-extrabold leading-tight">{step.title}</div>
            <p className="mt-1 text-sm text-ink/80">{step.body}</p>
            <Button asChild variant="secondary" className="mt-4 w-full sm:w-auto">
              <Link href={href}>Open project <ArrowRight /></Link>
            </Button>
          </section>
        </Reveal>
        <Reveal delay={0.06}>
          <SectionCard title="Activity">
            {data.phase === "loading" ? <TimelineSkeleton rows={4} /> : (data.data?.events.length ?? 0) === 0 ? (
              <EmptyState className="min-h-[160px] border-0 bg-transparent p-0" art={<EmptyAllCaughtUp />} title="Nothing yet" description="Tickets and uploads will appear here as they happen." />
            ) : <Timeline events={data.data!.events} />}
          </SectionCard>
        </Reveal>
      </div>
    </div>
  );
}
