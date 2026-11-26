"use client";

import { AlertTriangle, Clock, FileClock, FolderKanban } from "lucide-react";

import { useAuth } from "@/lib/auth/auth-context";
import {
  getDashboardStats,
  getDepartmentProjectsPage,
} from "@/lib/firestore";
import { useAsyncData } from "@/hooks/use-async-data";
import { QueryState } from "@/components/shared/query-state";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import {
  StatCardsSkeleton,
  TableSkeleton,
} from "@/components/shared/skeletons";
import { StatCard } from "@/components/app/stats";
import { ProjectTable } from "@/components/app/project-list";
import type { DashboardStatsDoc, ProjectDoc } from "@/lib/types";

export default function SupervisorDrilldown({
  params,
}: {
  params: { supervisorId: string };
}) {
  const { claims } = useAuth();
  const dept = claims.department ?? "";
  const sid = params.supervisorId;

  const stats = useAsyncData<DashboardStatsDoc | null>(
    () => getDashboardStats(sid),
    [sid]
  );
  const projects = useAsyncData<ProjectDoc[]>(async () => {
    const page = await getDepartmentProjectsPage(dept, "all", { pageSize: 100 });
    return page.items.filter((p) => p.supervisorId === sid);
  }, [dept, sid]);

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[
          { label: "Supervisors", href: "/hod/supervisors" },
          { label: stats.data?.supervisorName ?? "Supervisor" },
        ]}
        title={stats.data?.supervisorName ?? "Supervisor"}
        description="Supervision load, responsiveness and every project they look after."
      />

      <QueryState
        phase={stats.phase}
        error={stats.error}
        onRetry={stats.retry}
        skeleton={<StatCardsSkeleton count={4} />}
        empty={
          <EmptyState
            title="No rollup for this supervisor"
            description="They have no active projects yet."
          />
        }
      >
        {stats.data && (
          <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
            <StatCard dark label="Active projects" value={stats.data.activeProjects} icon={FolderKanban} />
            <StatCard label="Overdue" value={stats.data.overdueCount} icon={AlertTriangle} />
            <StatCard label="Pending reviews" value={stats.data.pendingSubmissions} icon={FileClock} />
            <StatCard label="Avg. response" value={stats.data.avgResponseHours == null ? "No replies yet" : `${stats.data.avgResponseHours}h`} icon={Clock} />
          </div>
        )}
      </QueryState>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold">Projects</h2>
        <div>
          <QueryState
            phase={projects.phase}
            error={projects.error}
            onRetry={projects.retry}
            skeleton={<TableSkeleton rows={5} columns={5} />}
            empty={
              <EmptyState
                icon={FolderKanban}
                
                title="No projects"
                description="This supervisor has no projects in the department."
              />
            }
          >
            <ProjectTable items={projects.data ?? []} hrefFor={(p) => `/hod/projects/${p.id}`} showSupervisor={false} />
          </QueryState>
        </div>
      </section>
    </div>
  );
}

