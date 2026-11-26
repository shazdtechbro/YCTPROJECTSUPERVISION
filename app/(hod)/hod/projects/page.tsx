"use client";

import { useState } from "react";
import { LayoutGrid, Rows3 } from "lucide-react";

import { useAuth } from "@/lib/auth/auth-context";
import { getDepartmentProjectsPage } from "@/lib/firestore";
import { usePaginatedQuery } from "@/hooks/use-paginated-query";
import { QueryState } from "@/components/shared/query-state";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { CardGridSkeleton, ListSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { ProjectGrid, ProjectTable } from "@/components/app/project-list";
import { EmptySearch } from "@/components/illustrations";
import { cn } from "@/lib/utils";
import type { MilestoneStatus } from "@/lib/types";

const FILTERS: { value: MilestoneStatus | "all"; label: string; dot?: string }[] = [
  { value: "all", label: "All" },
  { value: "on_track", label: "On track", dot: "bg-brand-700" },
  { value: "behind", label: "Behind", dot: "bg-sun-400" },
  { value: "stalled", label: "Stalled", dot: "bg-stalled" },
];

export default function HodProjects() {
  const { claims } = useAuth();
  const dept = claims.department ?? "";
  const [filter, setFilter] = useState<MilestoneStatus | "all">("all");
  const [view, setView] = useState<"cards" | "table">("cards");

  const query = usePaginatedQuery((params) => getDepartmentProjectsPage(dept, filter, params), [dept, filter]);
  const href = (p: { id: string }) => `/hod/projects/${p.id}`;

  return (
    <div>
      <PageHeader title="Department projects" description={`Read-only view of every project in ${dept || "your department"}.`} />

      <div className="mb-5 flex items-center gap-2">
        <div role="tablist" aria-label="Filter by health" className="no-scrollbar -mx-4 flex flex-1 gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              role="tab"
              aria-selected={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={cn("flex min-h-[44px] shrink-0 items-center gap-2 rounded-full px-4 text-[14px] font-semibold transition",
                filter === f.value ? "bg-ink text-white" : "border border-line bg-white text-ink-2 hover:border-ink-3")}
            >
              {f.dot && <span className={cn("h-2 w-2 rounded-full", f.dot)} />}
              {f.label}
              {filter === f.value && query.phase === "ready" && <span className="opacity-70">{query.items.length}{query.hasMore ? "+" : ""}</span>}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 rounded-xl bg-cream-2 p-1">
          {(["cards", "table"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} aria-label={v === "cards" ? "Grid view" : "List view"} aria-pressed={view === v}
              className={cn("grid h-10 w-10 place-items-center rounded-lg text-ink-3", view === v && "bg-white text-ink shadow-card")}>
              {v === "table" ? <Rows3 className="h-[18px] w-[18px]" /> : <LayoutGrid className="h-[18px] w-[18px]" />}
            </button>
          ))}
        </div>
      </div>

      <QueryState
        phase={query.phase}
        error={query.error}
        onRetry={query.retry}
        skeleton={view === "table" ? <ListSkeleton rows={6} /> : <CardGridSkeleton count={6} />}
        empty={<EmptyState art={<EmptySearch />} title="No matching projects" description="Nothing in the department matches this filter yet." />}
      >
        {view === "table" ? <ProjectTable items={query.items} hrefFor={href} /> : <ProjectGrid items={query.items} hrefFor={href} />}
        {query.hasMore && (
          <div className="mt-5 flex justify-center">
            <Button variant="outline" onClick={query.loadMore} disabled={query.loadingMore}>{query.loadingMore ? "Loading..." : "Load more"}</Button>
          </div>
        )}
      </QueryState>
    </div>
  );
}
