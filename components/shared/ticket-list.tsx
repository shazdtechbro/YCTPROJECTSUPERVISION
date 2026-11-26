"use client";

import { useState } from "react";
import { EmptyAllCaughtUp } from "@/components/illustrations";
import { toast } from "sonner";

import { subscribeProjectTickets } from "@/lib/firestore";
import { useLiveCollection } from "@/hooks/use-live-collection";
import { EmptyState } from "./empty-state";
import { ErrorState } from "./error-state";
import { StatusBadge } from "./status-badge";
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
  high: "!bg-[#FDECEA] text-stalled",
  medium: "!bg-sun-100 text-behind",
  low: "text-ink-2",
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
      {phase === "loading" && <TimelineSkeleton rows={4} />}
      {phase === "error" && (
        <ErrorState description={error?.message} />
      )}
      {phase === "empty" && (
        <EmptyState
          art={<EmptyAllCaughtUp />}
          title="No tickets, all clear"
          description="Use a ticket to ask a question or request a change. New ones appear here instantly."
        />
      )}
      {phase === "ready" && (
        <ul className="space-y-3">
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
      toast.error("Couldn't update ticket", {
        description: (err as Error).message,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="flex flex-col gap-3 rounded-[20px] border border-line bg-white p-4 shadow-card sm:flex-row sm:items-start">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-semibold">{t.title}</span>
          <span
            className={cn(
              "chip bg-cream-2 capitalize",
              PRIORITY_TONE[t.priority]
            )}
          >
            {t.priority} priority
          </span>
        </div>
        <p className="mt-1 line-clamp-3 text-sm text-ink-2">
          {t.body}
        </p>
        <p className="mt-2 text-xs text-ink-3">
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
          <SelectTrigger className="h-11 w-full sm:w-[160px]" aria-label="Ticket status">
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
