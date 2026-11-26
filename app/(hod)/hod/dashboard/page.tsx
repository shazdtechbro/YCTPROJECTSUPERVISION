"use client";

import Link from "next/link";
import { AlertTriangle, BarChart3, Clock, FolderKanban, Users } from "lucide-react";

import { useAuth } from "@/lib/auth/auth-context";
import { getDepartmentActivity, getDepartmentDashboardStats, getDepartmentProjectsPage } from "@/lib/firestore";
import { useAsyncData } from "@/hooks/use-async-data";
import { QueryState } from "@/components/shared/query-state";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ActivityChart } from "@/components/shared/activity-chart";
import { ListSkeleton, StatCardsSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Initials, SectionCard, StatCard } from "@/components/app/stats";
import { Reveal, Stagger, StaggerItem } from "@/components/app/motion";
import { EmptyAllCaughtUp } from "@/components/illustrations";
import type { ActivityPointDoc, DashboardStatsDoc, ProjectDoc } from "@/lib/types";

export default function HodDashboard() {
  const { claims } = useAuth();
  const dept = claims.department ?? "";

  const rollups = useAsyncData<DashboardStatsDoc[]>(() => getDepartmentDashboardStats(dept), [dept]);
  const activity = useAsyncData<ActivityPointDoc[]>(() => getDepartmentActivity(dept, 30), [dept]);
  const attention = useAsyncData<ProjectDoc[]>(async () => {
    const page = await getDepartmentProjectsPage(dept, "all", { pageSize: 60 });
    return page.items.filter((p) => p.milestoneStatus !== "on_track").slice(0, 5);
  }, [dept]);

  const list = rollups.data ?? [];
  const totals = list.reduce(
    (a, r) => ({ active: a.active + r.activeProjects, overdue: a.overdue + r.overdueCount, onTrack: a.onTrack + r.byMilestoneStatus.on_track, idle: a.idle + (r.activeProjects === 0 ? 1 : 0) }),
    { active: 0, overdue: 0, onTrack: 0, idle: 0 }
  );
  const responders = list.filter((r) => r.avgResponseHours != null);
  const avg = responders.length ? Math.round((responders.reduce((s, r) => s + (r.avgResponseHours ?? 0), 0) / responders.length) * 10) / 10 : null;
  const maxLoad = Math.max(1, ...list.map((r) => r.activeProjects));

  return (
    <div>
      <section className="mb-6 rounded-[24px] border border-line bg-card p-5 sm:p-7">
        <PageHeader
          title="Department oversight"
          description={`${dept || "Your department"} · Monitor project health and supervisor workload across the department.`}
          actions={<Button asChild><Link href="/hod/reports"><BarChart3 /> View reports</Link></Button>}
        />
        <nav aria-label="Department tools" className="flex flex-wrap gap-3">
          <Button asChild variant="outline"><Link href="/hod/projects"><FolderKanban /> Department projects</Link></Button>
          <Button asChild variant="outline"><Link href="/hod/supervisors"><Users /> Supervisor workload</Link></Button>
        </nav>
      </section>

      <QueryState
        phase={rollups.phase === "ready" && list.length === 0 ? "empty" : rollups.phase}
        error={rollups.error}
        onRetry={rollups.retry}
        skeleton={<StatCardsSkeleton count={4} />}
        empty={<EmptyState icon={BarChart3} title="No supervision data yet" description="Numbers appear once supervisors have active projects in the department." />}
      >
        <Stagger className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
          <StaggerItem><StatCard dark label="Supervisors" value={list.length} icon={Users} sub={totals.idle ? `${totals.idle} with no projects yet` : "All have projects"} /></StaggerItem>
          <StaggerItem><StatCard label="Active projects" value={totals.active} icon={FolderKanban} sub={`${totals.onTrack} on track`} /></StaggerItem>
          <StaggerItem><StatCard label="Overdue items" value={totals.overdue} icon={AlertTriangle} sub="Across the department" /></StaggerItem>
          <StaggerItem><StatCard label="Avg. response" value={avg == null ? "No replies yet" : `${avg}h`} icon={Clock} sub="Time to first reply" /></StaggerItem>
        </Stagger>
      </QueryState>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_340px]">
        <Reveal>
          <SectionCard title="Supervision activity · last 30 days">
            <QueryState
              phase={activity.phase}
              error={activity.error}
              onRetry={activity.retry}
              skeleton={<Skeleton className="h-64" />}
              empty={<EmptyState className="min-h-[200px] border-0 bg-transparent" title="No activity recorded yet" description="Submissions, comments and tickets will chart here as they happen." />}
            >
              <ActivityChart data={activity.data ?? []} />
            </QueryState>
          </SectionCard>
        </Reveal>
        <Reveal delay={0.06}>
          <SectionCard title="Needs attention" action={<Link href="/hod/projects" className="text-[13px] font-semibold text-brand-700">All projects</Link>}>
            <QueryState
              phase={attention.phase === "ready" && (attention.data?.length ?? 0) === 0 ? "empty" : attention.phase}
              error={attention.error}
              onRetry={attention.retry}
              skeleton={<ListSkeleton rows={3} />}
              empty={<EmptyState className="min-h-[200px] border-0 bg-transparent p-0" art={<EmptyAllCaughtUp />} title="Everything is on track" description="No projects are behind or overdue right now." />}
            >
              <ul className="space-y-3">
                {(attention.data ?? []).map((p) => (
                  <li key={p.id}>
                    <Link href={`/hod/projects/${p.id}`} className="block rounded-xl border border-line p-3 hover:border-ink-3">
                      <div className="flex items-start justify-between gap-2"><span className="line-clamp-2 text-[13px] font-semibold">{p.title}</span><StatusBadge status={p.milestoneStatus} /></div>
                      <div className="mt-1 text-xs text-ink-3">{p.supervisorName} · {p.milestoneReason}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            </QueryState>
          </SectionCard>
        </Reveal>
      </div>

      <Reveal className="mt-5">
        <SectionCard title="Supervisor workload" action={<Link href="/hod/supervisors" className="text-[13px] font-semibold text-brand-700">See all</Link>}>
          {rollups.phase === "loading" ? <ListSkeleton rows={4} /> : list.length === 0 ? (
            <p className="text-sm text-ink-3">Supervisor accounts with projects show up here.</p>
          ) : (
            <div>
              <div className="hidden grid-cols-[1.6fr_1.4fr_70px_70px_120px] gap-4 pb-2 text-xs font-medium text-ink-3 md:grid">
                <span>Supervisor</span><span>Workload</span><span className="text-right">Active</span><span className="text-right">Overdue</span><span className="text-right">Avg. response</span>
              </div>
              <ul className="divide-y divide-line">
                {list.slice().sort((a, b) => b.overdueCount - a.overdueCount).map((r) => (
                  <li key={r.id}>
                    <Link href={`/hod/supervisors/${r.supervisorId}`} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 py-3 md:grid-cols-[1.6fr_1.4fr_70px_70px_120px]">
                      <span className="flex min-w-0 items-center gap-3"><Initials name={r.supervisorName} /><b className="truncate text-sm font-semibold">{r.supervisorName}</b></span>
                      <span className="order-last col-span-2 md:order-none md:col-span-1">
                        <span className="block h-2 rounded-full bg-cream-2"><span className="block h-full rounded-full bg-brand-700" style={{ width: `${(r.activeProjects / maxLoad) * 100}%` }} /></span>
                      </span>
                      <span className="text-right text-sm tnum"><span className="text-ink-3 md:hidden">Active </span>{r.activeProjects}</span>
                      <span className={`hidden text-right text-sm tnum md:block ${r.overdueCount ? "font-semibold text-behind" : ""}`}>{r.overdueCount}</span>
                      <span className="hidden text-right text-sm tnum md:block">{r.avgResponseHours == null ? <span className="text-ink-3">No replies yet</span> : `${r.avgResponseHours}h`}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </SectionCard>
      </Reveal>
    </div>
  );
}
