"use client";

import Link from "next/link";
import { Users } from "lucide-react";

import { useAuth } from "@/lib/auth/auth-context";
import { getSupervisorProjectsPage } from "@/lib/firestore";
import { usePaginatedQuery } from "@/hooks/use-paginated-query";
import { QueryState } from "@/components/shared/query-state";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { CardGridSkeleton } from "@/components/shared/skeletons";
import { NewProjectDialog } from "@/components/shared/new-project-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate } from "@/lib/format";

function initials(n: string) {
  return n
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

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
        title="Roster"
        description="Your students and their live milestone status."
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
            title="No supervised projects yet"
            description="Students in your department can submit topics to you. Approved and pending projects will appear here."
          />
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {query.items.map((p) => (
            <Card key={p.id} interactive className="overflow-hidden">
              <Link href={`/supervisor/projects/${p.id}`}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-2xs">
                        {initials(p.studentName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {p.studentName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{p.studentMatricNumber || "Matric number not recorded"}</p>
                      <p className="truncate text-2xs text-muted-foreground">
                        {p.title}
                      </p>
                    </div>
                    <StatusBadge status={p.milestoneStatus} dot={false} />
                  </div>
                  <Progress value={p.progressPct} />
                  <div className="flex justify-between text-2xs text-muted-foreground">
                    <span>Defense {formatDate(p.defenseDate)}</span>
                    <span className="tnum">{p.progressPct}%</span>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
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
