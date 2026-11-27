"use client";

import { Users } from "lucide-react";

import { useAuth } from "@/lib/auth/auth-context";
import { getSupervisorProjectsPage } from "@/lib/firestore";
import { usePaginatedQuery } from "@/hooks/use-paginated-query";
import { QueryState } from "@/components/shared/query-state";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { CardGridSkeleton } from "@/components/shared/skeletons";
import { ProjectGrid } from "@/components/app/project-list";
import { NewProjectDialog } from "@/components/shared/new-project-dialog";
import { Button } from "@/components/ui/button";

export default function SupervisorRoster() {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const query = usePaginatedQuery(
    (params) => getSupervisorProjectsPage(uid, "active", params),
    [uid]
  );

  return (
    <div>
      <PageHeader
        title="Student roster"
        description="Your students and how each project is doing right now."
        actions={<NewProjectDialog onCreated={query.retry} />}
      />

      <QueryState
        phase={query.phase}
        error={query.error}
        onRetry={query.retry}
        skeleton={<CardGridSkeleton count={6} />}
        empty={
          <EmptyState
            icon={Users}
            title="No students yet"
            description="Create a project for a student and they'll appear here."
          />
        }
      >
        <ProjectGrid items={query.items} hrefFor={(p) => `/supervisor/projects/${p.id}?tab=submissions`} showSupervisor={false} />
        {query.hasMore && (
          <div className="mt-3 flex justify-center">
            <Button
              variant="outline"
              onClick={query.loadMore}
              disabled={query.loadingMore}
            >
              {query.loadingMore ? "Loading…" : "Load more"}
            </Button>
          </div>
        )}
      </QueryState>
    </div>
  );
}
