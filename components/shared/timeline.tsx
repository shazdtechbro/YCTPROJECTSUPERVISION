import Link from "next/link";
import { CalendarClock, ClipboardCheck, GraduationCap, FileText, GitCommitHorizontal, MessageSquare, Ticket } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { ActivityEvent } from "@/lib/types";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const ICONS: Record<ActivityEvent["kind"], { Icon: LucideIcon; cls: string }> = {
  ticket: { Icon: Ticket, cls: "bg-brand-50 text-brand-700" },
  submission: { Icon: FileText, cls: "bg-sun-100 text-ink" },
  comment: { Icon: MessageSquare, cls: "bg-[#E6F1FA] text-[#1D5A86]" },
  review: { Icon: ClipboardCheck, cls: "bg-brand-50 text-brand-700" },
  topic: { Icon: GraduationCap, cls: "bg-cream-2 text-ink-2" },
  extension: { Icon: CalendarClock, cls: "bg-sun-100 text-ink" },
  status_change: { Icon: GitCommitHorizontal, cls: "bg-cream-2 text-ink-2" },
};

/** Cross-role activity feed. Presentational: feed it `ActivityEvent[]`. */
export function Timeline({ events, className }: { events: ActivityEvent[]; className?: string }) {
  return (
    <ol className={cn("relative", className)}>
      {events.map((event, i) => {
        const { Icon, cls } = ICONS[event.kind];
        const isLast = i === events.length - 1;
        return (
          <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast && <span aria-hidden className="absolute left-[15px] top-9 h-[calc(100%-28px)] w-px bg-line" />}
            <span className={cn("z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full", cls)}><Icon className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1 pt-0.5">
              {event.href ? (
                <Link href={event.href} className="text-sm font-medium leading-snug hover:text-brand-700">{event.title}</Link>
              ) : (
                <span className="text-sm font-medium leading-snug">{event.title}</span>
              )}
              <p className="mt-0.5 text-xs text-ink-3">{event.actorName} · {formatRelativeTime(event.at)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
