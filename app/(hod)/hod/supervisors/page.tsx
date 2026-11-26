"use client";

import Link from "next/link";
import { ChevronRight, HelpCircle, Users } from "lucide-react";

import { useAuth } from "@/lib/auth/auth-context";
import { getDepartmentDashboardStats } from "@/lib/firestore";
import { useAsyncData } from "@/hooks/use-async-data";
import { QueryState } from "@/components/shared/query-state";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { CardGridSkeleton } from "@/components/shared/skeletons";
import { Initials } from "@/components/app/stats";
import { Stagger, StaggerItem } from "@/components/app/motion";
import { cn } from "@/lib/utils";
import type { DashboardStatsDoc } from "@/lib/types";

export default function HodSupervisors() {
  const { claims } = useAuth();
  const dept = claims.department ?? "";
  const rollups = useAsyncData<DashboardStatsDoc[]>(() => getDepartmentDashboardStats(dept), [dept]);

  return (
    <div>
      <PageHeader title="Supervisors" description="Workload and responsiveness per supervisor. Tap a card for details." />
      <QueryState
        phase={rollups.phase}
        error={rollups.error}
        onRetry={rollups.retry}
        skeleton={<CardGridSkeleton count={6} />}
        empty={<EmptyState icon={Users} title="No supervisors yet" description="Supervisor accounts with active projects appear here." />}
      >
        <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(rollups.data ?? []).slice().sort((a, b) => b.overdueCount - a.overdueCount).map((r) => (
            <StaggerItem key={r.id}>
              <Link href={`/hod/supervisors/${r.supervisorId}`} className="lift block h-full rounded-[20px] border border-line bg-card p-5 shadow-card">
                <div className="flex items-center gap-3">
                  <Initials name={r.supervisorName} size="lg" />
                  <div className="min-w-0 flex-1"><div className="truncate font-semibold">{r.supervisorName}</div><div className="text-xs text-ink-3">Supervisor · {r.department}</div></div>
                  <span className="grid h-10 w-10 place-items-center rounded-xl border border-line"><ChevronRight className="h-4 w-4" /></span>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  <Tile label="Active" value={r.activeProjects} />
                  <Tile label="Overdue" value={r.overdueCount} warn={r.overdueCount > 0} />
                  <Tile label="Response" value={r.avgResponseHours == null ? "None yet" : `${r.avgResponseHours}h`} small={r.avgResponseHours == null} />
                </div>
                {r.activeProjects === 0 && <div className="mt-4 flex items-center gap-1.5 text-xs text-ink-3"><HelpCircle className="h-4 w-4" />No projects assigned yet</div>}
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </QueryState>
    </div>
  );
}

function Tile({ label, value, warn, small }: { label: string; value: number | string; warn?: boolean; small?: boolean }) {
  return (
    <div className="rounded-xl bg-cream-2 py-3">
      <div className={cn("font-display font-extrabold tnum", small ? "pt-1.5 text-sm" : "text-[22px]", warn && "text-behind")}>{value}</div>
      <div className="text-xs text-ink-3">{label}</div>
    </div>
  );
}
