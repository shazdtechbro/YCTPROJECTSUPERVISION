"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Initials, ProgressBar, toneOf } from "./stats";
import { Stagger, StaggerItem } from "./motion";
import { formatDate, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { currentStage } from "@/lib/project-stages";
import type { ProjectDoc } from "@/lib/types";

/** Project card with health, people, coloured progress and defence date. */
export function ProjectCard({ p, href, showSupervisor = true, showStage = false }: { p: ProjectDoc; href: string; showSupervisor?: boolean; showStage?: boolean }) {
  const stage = showStage ? currentStage(p) : null;
  return (
    <Link href={href} className="lift block h-full rounded-[20px] border border-line bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 font-semibold leading-snug">{p.title}</h3>
        <StatusBadge status={p.milestoneStatus} />
      </div>
      <div className="mt-3 flex min-w-0 items-center gap-2 text-[13px] text-ink-2">
        <Initials name={p.studentName} size="sm" />
        <span className="truncate">{p.studentName}{showSupervisor && <span className="text-ink-3"> · {p.supervisorName}</span>}</span>
      </div>
      <div className="mt-5 flex items-center justify-between text-xs text-ink-3"><span>Progress</span><b className="tnum text-ink">{p.progressPct}%</b></div>
      <div className="mt-1.5"><ProgressBar value={p.progressPct} tone={toneOf(p.milestoneStatus)} /></div>
      <div className="mt-4 flex items-center justify-between text-xs text-ink-3">
        {stage && <span>{stage.label}{stage.deadline && ` · ${formatDate(stage.deadline)}`}</span>}
        <span>{formatRelativeTime(p.lastActivityAt)}</span>
      </div>
    </Link>
  );
}

export function ProjectGrid({ items, hrefFor, showSupervisor, showStage }: { items: ProjectDoc[]; hrefFor: (p: ProjectDoc) => string; showSupervisor?: boolean; showStage?: boolean }) {
  return (
    <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((p) => <StaggerItem key={p.id}><ProjectCard p={p} href={hrefFor(p)} showSupervisor={showSupervisor} showStage={showStage} /></StaggerItem>)}
    </Stagger>
  );
}

/** Dense list: a table on desktop, stacked rows on phones (no horizontal scroll). */
export function ProjectTable({ items, hrefFor, showSupervisor = true, showStage = false }: { items: ProjectDoc[]; hrefFor: (p: ProjectDoc) => string; showSupervisor?: boolean; showStage?: boolean }) {
  const columns = showStage ? "md:grid-cols-[2fr_1fr_1fr_120px_110px]" : "md:grid-cols-[2fr_1fr_1fr_120px]";
  return (
    <div className="overflow-hidden rounded-[20px] border border-line bg-card shadow-card">
      <div className={cn("hidden gap-4 border-b border-line px-5 py-3 text-xs font-medium text-ink-3 md:grid", columns)}>
        <span>Project</span><span>{showSupervisor ? "Supervisor" : "Student"}</span><span>Health</span><span>Progress</span>{showStage && <span className="text-right">Current stage</span>}
      </div>
      <ul className="divide-y divide-line">
        {items.map((p) => (
          <li key={p.id}>
            <Link href={hrefFor(p)} className={cn("flex items-center gap-3 px-4 py-4 hover:bg-cream/60 md:grid md:gap-4 md:px-5", columns)}>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.title}</p>
                <p className="truncate text-xs text-ink-3">{p.studentName}{showStage && <span className="md:hidden"> · {currentStage(p).label}</span>}</p>
                <div className="mt-2 flex items-center gap-2 md:hidden"><StatusBadge status={p.milestoneStatus} /><span className="flex-1"><ProgressBar value={p.progressPct} tone={toneOf(p.milestoneStatus)} /></span></div>
              </div>
              <span className="hidden truncate text-sm text-ink-2 md:block">{showSupervisor ? p.supervisorName : p.studentName}</span>
              <span className="hidden md:block"><StatusBadge status={p.milestoneStatus} /></span>
              <span className="hidden items-center gap-2 md:flex"><span className="flex-1"><ProgressBar value={p.progressPct} tone={toneOf(p.milestoneStatus)} /></span><span className="tnum text-xs">{p.progressPct}%</span></span>
              {showStage && <span className="hidden text-right text-sm text-ink-2 md:block">{currentStage(p).label}{currentStage(p).deadline && <span className="block text-xs">{formatDate(currentStage(p).deadline)}</span>}</span>}
              <ChevronRight className="h-5 w-5 shrink-0 text-ink-3 md:hidden" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
