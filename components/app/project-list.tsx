"use client";

import Link from "next/link";
import { CalendarClock, ChevronRight } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Initials, ProgressBar, toneOf } from "./stats";
import { Stagger, StaggerItem } from "./motion";
import { formatDate, formatRelativeTime } from "@/lib/format";
import type { ProjectDoc } from "@/lib/types";

/** Project card with health, people, coloured progress and defence date. */
export function ProjectCard({ p, href, showSupervisor = true }: { p: ProjectDoc; href: string; showSupervisor?: boolean }) {
  return (
    <Link href={href} className="lift block h-full rounded-[20px] border border-line bg-white p-5 shadow-card">
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
        <span className="flex items-center gap-1.5"><CalendarClock className="h-4 w-4" />Defence {formatDate(p.defenseDate)}</span>
        <span>{formatRelativeTime(p.lastActivityAt)}</span>
      </div>
    </Link>
  );
}

export function ProjectGrid({ items, hrefFor, showSupervisor }: { items: ProjectDoc[]; hrefFor: (p: ProjectDoc) => string; showSupervisor?: boolean }) {
  return (
    <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((p) => <StaggerItem key={p.id}><ProjectCard p={p} href={hrefFor(p)} showSupervisor={showSupervisor} /></StaggerItem>)}
    </Stagger>
  );
}

/** Dense list: a table on desktop, stacked rows on phones (no horizontal scroll). */
export function ProjectTable({ items, hrefFor, showSupervisor = true }: { items: ProjectDoc[]; hrefFor: (p: ProjectDoc) => string; showSupervisor?: boolean }) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-line bg-white shadow-card">
      <div className="hidden grid-cols-[2fr_1fr_1fr_120px_110px] gap-4 border-b border-line px-5 py-3 text-xs font-medium text-ink-3 md:grid">
        <span>Project</span><span>{showSupervisor ? "Supervisor" : "Student"}</span><span>Health</span><span>Progress</span><span className="text-right">Defence</span>
      </div>
      <ul className="divide-y divide-line">
        {items.map((p) => (
          <li key={p.id}>
            <Link href={hrefFor(p)} className="flex items-center gap-3 px-4 py-4 hover:bg-cream/60 md:grid md:grid-cols-[2fr_1fr_1fr_120px_110px] md:gap-4 md:px-5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.title}</p>
                <p className="truncate text-xs text-ink-3">{p.studentName}<span className="md:hidden"> · {formatDate(p.defenseDate)}</span></p>
                <div className="mt-2 flex items-center gap-2 md:hidden"><StatusBadge status={p.milestoneStatus} /><span className="flex-1"><ProgressBar value={p.progressPct} tone={toneOf(p.milestoneStatus)} /></span></div>
              </div>
              <span className="hidden truncate text-sm text-ink-2 md:block">{showSupervisor ? p.supervisorName : p.studentName}</span>
              <span className="hidden md:block"><StatusBadge status={p.milestoneStatus} /></span>
              <span className="hidden items-center gap-2 md:flex"><span className="flex-1"><ProgressBar value={p.progressPct} tone={toneOf(p.milestoneStatus)} /></span><span className="tnum text-xs">{p.progressPct}%</span></span>
              <span className="hidden text-right text-sm text-ink-2 md:block">{formatDate(p.defenseDate)}</span>
              <ChevronRight className="h-5 w-5 shrink-0 text-ink-3 md:hidden" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
