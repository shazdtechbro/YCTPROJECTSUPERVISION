"use client";

import { useState } from "react";
import { FolderKanban } from "lucide-react";

import { useAuth } from "@/lib/auth/auth-context";
import { getSupervisorProjectsPage } from "@/lib/firestore";
import { usePaginatedQuery } from "@/hooks/use-paginated-query";
import { QueryState } from "@/components/shared/query-state";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton } from "@/components/shared/skeletons";
import { NewProjectDialog } from "@/components/shared/new-project-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectTable } from "@/components/app/project-list";
import type { ProjectStatus } from "@/lib/types";

const STATUS_TABS: { value: ProjectStatus; label: string }[] = [
  { value: "approved", label: "Approved" },
  { value: "submitted", label: "Submitted" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

export default function SupervisorProjects() {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const [status, setStatus] = useState<ProjectStatus>("active");
  const [nonce, setNonce] = useState(0);

  const query = usePaginatedQuery(
    (params) => getSupervisorProjectsPage(uid, status, params),
    [uid, status, nonce]
  );

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Every project where you are the assigned supervisor."
        actions={<NewProjectDialog onCreated={() => setNonce((n) => n + 1)} />}
      />

      <Tabs
        value={status}
        onValueChange={(v) => setStatus(v as ProjectStatus)}
        className="mb-4"
      >
        <TabsList>
          {STATUS_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <QueryState
        phase={query.phase}
        error={query.error}
        onRetry={query.retry}
        skeleton={<TableSkeleton rows={6} columns={5} />}
        empty={
          <EmptyState
            icon={FolderKanban}
            title={`No ${status} projects`}
            description={
              status === "active"
                ? "Create a project for one of your students to get started."
                : "Nothing here with this status."
            }
          />
        }
      >
        <ProjectTable items={query.items} hrefFor={(p) => `/supervisor/projects/${p.id}?tab=submissions`} showSupervisor={false} />
        {query.hasMore && (
          <div className="mt-5 flex justify-center">
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
