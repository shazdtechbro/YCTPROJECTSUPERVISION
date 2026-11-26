"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, FileClock, FolderKanban, Ticket, Users } from "lucide-react";

import { useAuth } from "@/lib/auth/auth-context";
import { getDashboardStats, getSupervisorProjectsPage } from "@/lib/firestore";
import { useAsyncData } from "@/hooks/use-async-data";
import { QueryState } from "@/components/shared/query-state";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCardsSkeleton, ListSkeleton } from "@/components/shared/skeletons";
import { NewProjectDialog } from "@/components/shared/new-project-dialog";
import { Button } from "@/components/ui/button";
import { Initials, ProgressBar, SectionCard, StatCard, toneOf } from "@/components/app/stats";
import { Reveal, Stagger, StaggerItem } from "@/components/app/motion";
import { EmptyAllCaughtUp } from "@/components/illustrations";
import { formatRelativeTime } from "@/lib/format";
import type { DashboardStatsDoc, ProjectDoc } from "@/lib/types";
import { cn } from "@/lib/utils";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function SupervisorDashboard() {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const first = (user?.displayName ?? "").split(" ")[0];
  const stats = useAsyncData(() => getDashboardStats(uid), [uid]);
  const pending = stats.data?.pendingSubmissions ?? 0;

  return (
    <div>
      <PageHeader
        title="Supervisor workspace"
        description={stats.data ? (pending ? `You have ${pending} submission${pending === 1 ? "" : "s"} waiting for review.` : "No submissions are waiting for you.") : `${greeting()}${first ? `, ${first}` : ""}. Review submissions and manage your assigned projects.`}
        actions={<><Button asChild variant="outline"><Link href="/supervisor/roster"><Users /> Students</Link></Button><NewProjectDialog onCreated={stats.retry} /></>}
      />

      <QueryState
        phase={stats.phase}
        error={stats.error}
        onRetry={stats.retry}
        skeleton={<StatCardsSkeleton count={4} />}
        empty={<EmptyState icon={FolderKanban} title="No projects yet" description="Create a project for one of your students and your numbers will appear here." />}
      >
        {stats.data && <Stats stats={stats.data} />}
      </QueryState>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
        <Queue uid={uid} />
        {stats.data && <HealthDonut stats={stats.data} />}
      </div>
    </div>
  );
}

function Stats({ stats }: { stats: DashboardStatsDoc }) {
  return (
    <Stagger className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
      <StaggerItem><StatCard dark label="Active projects" value={stats.activeProjects} icon={FolderKanban} sub="You are supervising" /></StaggerItem>
      <StaggerItem><StatCard label="Pending reviews" value={stats.pendingSubmissions} icon={FileClock} sub="Waiting for your decision" /></StaggerItem>
      <StaggerItem><StatCard label="Overdue" value={stats.overdueCount} icon={AlertTriangle} sub={`${stats.openTickets} open tickets`} /></StaggerItem>
      <StaggerItem><StatCard label="Avg. response" value={stats.avgResponseHours == null ? "No replies yet" : `${stats.avgResponseHours}h`} icon={Clock} sub="Time to first reply" /></StaggerItem>
    </Stagger>
  );
}

const SEGMENTS = [
  { key: "attention", label: "Needs attention" },
  { key: "tickets", label: "Open tickets" },
  { key: "recent", label: "Recent" },
] as const;

function Queue({ uid }: { uid: string }) {
  const [seg, setSeg] = useState<(typeof SEGMENTS)[number]["key"]>("attention");
  const data = useAsyncData<ProjectDoc[]>(async () => (await getSupervisorProjectsPage(uid, "active", { pageSize: 40 })).items, [uid]);
  const items = (data.data ?? [])
    .filter((p) => (seg === "attention" ? p.milestoneStatus !== "on_track" : seg === "tickets" ? p.openTicketCount > 0 : true))
    .sort((a, b) => (b.lastActivityAt?.toMillis?.() ?? 0) - (a.lastActivityAt?.toMillis?.() ?? 0))
    .slice(0, 8);

  return (
    <Reveal>
      <SectionCard title="Your queue">
        <div role="tablist" aria-label="Filter queue" className="no-scrollbar -mx-1 mb-4 flex gap-1 overflow-x-auto rounded-full bg-cream-2 p-1">
          {SEGMENTS.map((s) => (
            <button key={s.key} role="tab" aria-selected={seg === s.key} onClick={() => setSeg(s.key)}
              className={cn("min-h-[40px] flex-1 whitespace-nowrap rounded-full px-3 text-[13px] font-semibold transition", seg === s.key ? "bg-card text-ink shadow-card" : "text-ink-2")}>
              {s.label}
            </button>
          ))}
        </div>
        <QueryState
          phase={data.phase === "ready" && items.length === 0 ? "empty" : data.phase}
          error={data.error}
          onRetry={data.retry}
          skeleton={<ListSkeleton rows={4} />}
          empty={<EmptyState className="min-h-[200px] border-0 bg-transparent" art={<EmptyAllCaughtUp />} title="All caught up" description="Nothing needs you in this view right now." />}
        >
          <ul className="-mx-2 divide-y divide-line">
            {items.map((p) => (
              <li key={p.id}>
                <Link href={`/supervisor/projects/${p.id}`} className="flex items-center gap-3 rounded-xl px-2 py-3.5 hover:bg-cream/70">
                  <Initials name={p.studentName} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{p.title}</p>
                    <p className="truncate text-xs text-ink-3">{p.studentName} · {p.milestoneReason} · {formatRelativeTime(p.lastActivityAt)}</p>
                    <div className="mt-2 md:hidden"><ProgressBar value={p.progressPct} tone={toneOf(p.milestoneStatus)} /></div>
                  </div>
                  <StatusBadge status={p.milestoneStatus} />
                  <span className="hidden w-28 md:block"><ProgressBar value={p.progressPct} tone={toneOf(p.milestoneStatus)} /></span>
                  {p.openTicketCount > 0 && <span className="hidden items-center gap-1 text-xs text-ink-3 sm:flex"><Ticket className="h-4 w-4" />{p.openTicketCount}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </QueryState>
      </SectionCard>
    </Reveal>
  );
}

function HealthDonut({ stats }: { stats: Pick<DashboardStatsDoc, "byMilestoneStatus"> }) {
  const d = [
    { label: "On track", v: stats.byMilestoneStatus.on_track, c: "#006600", dot: "bg-brand-700" },
    { label: "Behind", v: stats.byMilestoneStatus.behind, c: "#FDC800", dot: "bg-sun-400" },
    { label: "Overdue", v: stats.byMilestoneStatus.stalled, c: "#C8352A", dot: "bg-stalled" },
  ];
  const tot = d.reduce((a, x) => a + x.v, 0);
  const C = 2 * Math.PI * 42;
  let acc = 0;
  return (
    <Reveal delay={0.06}>
      <SectionCard title="Project health">
        <div className="flex items-center gap-6">
          <div className="relative shrink-0">
            <svg width="120" height="120" className="-rotate-90" role="img" aria-label={d.map((x) => `${x.label} ${x.v}`).join(", ")}>
              <circle cx="60" cy="60" r="42" fill="none" stroke="#F4EFE3" strokeWidth="16" />
              {tot > 0 && d.map((x) => {
                const len = (C * x.v) / tot;
                const el = x.v > 0 ? <circle key={x.label} cx="60" cy="60" r="42" fill="none" stroke={x.c} strokeWidth="16" strokeDasharray={`${Math.max(0, len - 2)} ${C}`} strokeDashoffset={-acc} /> : null;
                acc += len;
                return el;
              })}
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center"><div><div className="font-display text-2xl font-extrabold">{tot}</div><div className="text-xs text-ink-3">projects</div></div></div>
          </div>
          <ul className="flex-1 space-y-2.5 text-sm">
            {d.map((x) => <li key={x.label} className="flex items-center gap-2"><span className={cn("h-2.5 w-2.5 rounded-full", x.dot)} />{x.label}<b className="ml-auto tnum">{x.v}</b></li>)}
          </ul>
        </div>
      </SectionCard>
    </Reveal>
  );
}
