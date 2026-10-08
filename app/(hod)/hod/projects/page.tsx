"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderKanban, LayoutGrid, Rows3 } from "lucide-react";

import { useAuth } from "@/lib/auth/auth-context";
import { getDepartmentProjectsPage } from "@/lib/firestore";
import { usePaginatedQuery } from "@/hooks/use-paginated-query";
import { QueryState } from "@/components/shared/query-state";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  CardGridSkeleton,
  TableSkeleton,
} from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import type { MilestoneStatus } from "@/lib/types";

const FILTERS: { value: MilestoneStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "on_track", label: "On track" },
  { value: "behind", label: "Behind" },
  { value: "stalled", label: "Stalled" },
];

export default function HodProjects() {
  const { claims } = useAuth();
  const dept = claims.department ?? "";
  const [filter, setFilter] = useState<MilestoneStatus | "all">("all");
  const [view, setView] = useState<"table" | "cards">("table");

  const query = usePaginatedQuery(
    (params) => getDepartmentProjectsPage(dept, filter, params),
    [dept, filter]
  );

  return (
    <div>
      <PageHeader
        title="Department projects"
        description="Read-only, department-wide."
        actions={
          <div className="flex rounded-md border p-0.5">
            {(["table", "cards"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground",
                  view === v && "bg-secondary text-foreground"
                )}
                aria-label={`${v} view`}
              >
                {v === "table" ? (
                  <Rows3 className="h-3.5 w-3.5" />
                ) : (
                  <LayoutGrid className="h-3.5 w-3.5" />
                )}
              </button>
            ))}
          </div>
        }
      />

      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as MilestoneStatus | "all")}
        className="mb-4"
      >
        <TabsList>
          {FILTERS.map((f) => (
            <TabsTrigger key={f.value} value={f.value}>
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <QueryState
        phase={query.phase}
        error={query.error}
        onRetry={query.retry}
        skeleton={
          view === "table" ? (
            <TableSkeleton rows={8} columns={5} />
          ) : (
            <CardGridSkeleton count={6} />
          )
        }
        empty={
          <EmptyState
            icon={FolderKanban}
            title="No matching projects"
            description="Nothing in the department matches this filter."
          />
        }
      >
        {view === "table" ? (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface/60">
                  <TableHead>Project</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Supervisor</TableHead>
                  <TableHead>Milestone</TableHead>
                  <TableHead>Defense</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/hod/projects/${p.id}`}
                        className="hover:underline"
                      >
                        {p.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className="block">{p.studentName}</span>
                      <span className="text-xs">{p.studentMatricNumber || "Matric number not recorded"}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.supervisorName}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={p.milestoneStatus} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(p.defenseDate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {query.items.map((p) => (
              <Card key={p.id} interactive>
                <Link href={`/hod/projects/${p.id}`}>
                  <CardContent className="space-y-2.5 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 text-sm font-medium">
                        {p.title}
                      </p>
                      <StatusBadge status={p.milestoneStatus} dot={false} />
                    </div>
                    <p className="text-2xs text-muted-foreground">
                      {p.studentName} · {p.supervisorName}
                    </p>
                    <Progress value={p.progressPct} />
                    <p className="text-2xs text-muted-foreground">
                      Defense {formatDate(p.defenseDate)}
                    </p>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
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
