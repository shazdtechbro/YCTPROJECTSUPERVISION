"use client";

import { useState } from "react";
import { Ticket as TicketIcon } from "lucide-react";
import { toast } from "sonner";

import { subscribeProjectTickets } from "@/lib/firestore";
import { useLiveCollection } from "@/hooks/use-live-collection";
import { EmptyState } from "./empty-state";
import { ErrorState } from "./error-state";
import { StatusBadge } from "./status-badge";
import { ProjectActivityLog } from "./project-activity-log";
import { NewTicketDialog } from "./new-ticket-dialog";
import { TimelineSkeleton } from "./skeletons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import type { TicketDoc, TicketStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRIORITY_TONE: Record<string, string> = {
  high: "text-[hsl(var(--status-stalled))]",
  medium: "text-[hsl(var(--status-behind))]",
  low: "text-muted-foreground",
};

export function TicketList({
  projectId,
  canPost = true,
}: {
  projectId: string;
  canPost?: boolean;
}) {
  const { phase, items, error } = useLiveCollection<TicketDoc>(
    (h) => subscribeProjectTickets(projectId, h),
    [projectId]
  );

  return (
    <div className="space-y-3">
      {canPost && (
        <div className="flex justify-end">
          <NewTicketDialog projectId={projectId} />
        </div>
      )}
      <ProjectActivityLog projectId={projectId} refreshKey={items} />
      {phase === "loading" && <TimelineSkeleton rows={4} />}
      {phase === "error" && (
        <ErrorState description={error?.message} />
      )}
      {phase === "empty" && (
        <EmptyState
          icon={TicketIcon}
          title="No activities"
          description="Record supervision tasks, questions and updates. New activities appear here in real time."
        />
      )}
      {phase === "ready" && (
        <ul className="divide-y rounded-lg border">
          {items.map((t) => (
            <TicketRow
              key={t.id}
              projectId={projectId}
              ticket={t}
              editable={canPost}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function TicketRow({
  projectId,
  ticket: t,
  editable,
}: {
  projectId: string;
  ticket: TicketDoc;
  editable: boolean;
}) {
  const [saving, setSaving] = useState(false);

  async function setStatus(status: TicketStatus) {
    setSaving(true);
    try {
      await api.setTicketStatus(projectId, t.id, status);
    } catch (err) {
      toast.error("Couldn't update activity", {
        description: (err as Error).message,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="flex flex-wrap items-start gap-3 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{t.title}</span>
          <span
            className={cn(
              "text-2xs font-medium uppercase",
              PRIORITY_TONE[t.priority]
            )}
          >
            {t.priority}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
          {t.body}
        </p>
        <p className="mt-1 text-2xs text-muted-foreground">
          {t.authorName} · {formatRelativeTime(t.createdAt)}
          {t.dueDate ? ` · due ${t.dueDate}` : ""}
        </p>
      </div>
      {editable ? (
        <Select
          value={t.status}
          onValueChange={(v) => setStatus(v as TicketStatus)}
          disabled={saving}
        >
          <SelectTrigger className="h-8 w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <StatusBadge status={t.status} />
      )}
    </li>
  );
}
