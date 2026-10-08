import {
  FileText,
  GitCommitHorizontal,
  MessageSquare,
  MessageSquareText,
  Clock3,
  Ticket,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { ActivityEvent } from "@/lib/types";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const ICONS: Record<ActivityEvent["kind"], LucideIcon> = {
  ticket: Ticket,
  submission: FileText,
  comment: MessageSquare,
  status_change: GitCommitHorizontal,
  review: MessageSquareText,
  topic: GitCommitHorizontal,
  extension: Clock3,
};

/** Cross-role activity feed. Presentational — feed it `ActivityEvent[]`. */
export function Timeline({
  events,
  className,
}: {
  events: ActivityEvent[];
  className?: string;
}) {
  return (
    <ol className={cn("relative", className)}>
      {events.map((event, i) => {
        const Icon = ICONS[event.kind];
        const isLast = i === events.length - 1;
        return (
          <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast && (
              <span
                aria-hidden
                className="absolute left-[13px] top-7 h-full w-px bg-border"
              />
            )}
            <span className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-sm leading-tight">
                {event.href ? (
                  <a
                    href={event.href}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {event.title}
                  </a>
                ) : (
                  <span className="font-medium">{event.title}</span>
                )}
              </p>
              <p className="mt-0.5 text-2xs text-muted-foreground">
                {event.actorName} · {formatRelativeTime(event.at)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
