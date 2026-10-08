"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderKanban } from "lucide-react";

import { useAuth } from "@/lib/auth/auth-context";
import { getSupervisorProjectsPage } from "@/lib/firestore";
import { usePaginatedQuery } from "@/hooks/use-paginated-query";
import { QueryState } from "@/components/shared/query-state";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableSkeleton } from "@/components/shared/skeletons";
import { NewProjectDialog } from "@/components/shared/new-project-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatRelativeTime } from "@/lib/format";
import type { ProjectStatus } from "@/lib/types";

const STATUS_TABS: { value: ProjectStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
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
        description="Projects where you are the assigned supervisor."
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
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface/60">
                <TableHead>Project</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Milestone</TableHead>
                <TableHead>Defense</TableHead>
                <TableHead className="text-right">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.items.map((p) => (
                <TableRow key={p.id} className="group">
                  <TableCell className="font-medium">
                    <Link
                      href={`/supervisor/projects/${p.id}`}
                      className="hover:underline"
                    >
                      {p.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <span className="block">{p.studentName}</span>
                    <span className="text-xs">{p.studentMatricNumber || "Matric number not recorded"}</span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={p.milestoneStatus} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(p.defenseDate)}
                  </TableCell>
                  <TableCell className="text-right text-2xs text-muted-foreground">
                    {formatRelativeTime(p.lastActivityAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {query.hasMore && (
          <div className="mt-3 flex justify-center">
            <Button
              variant="outline"
              size="sm"
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
