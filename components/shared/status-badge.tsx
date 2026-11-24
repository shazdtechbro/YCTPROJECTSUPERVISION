import { cn } from "@/lib/utils";
import type {
  MilestoneStatus,
  ProjectStatus,
  SubmissionStatus,
  TicketStatus,
} from "@/lib/types";

type AnyStatus =
  | MilestoneStatus
  | ProjectStatus
  | SubmissionStatus
  | TicketStatus;

const LABEL: Record<AnyStatus, string> = {
  on_track: "On track",
  behind: "Behind",
  stalled: "Overview",
  active: "Active",
  submitted: "Submitted",
  approved: "Approved",
  archived: "Archived",
  pending_review: "Pending",
  changes_requested: "Changes",
  open: "Open",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
};

type Tone = "green" | "amber" | "red" | "bw" | "gray";

const TONE_OF: Record<AnyStatus, Tone> = {
  on_track: "green",
  behind: "amber",
  stalled: "red",
  active: "bw",
  submitted: "bw",
  approved: "green",
  archived: "gray",
  pending_review: "amber",
  changes_requested: "red",
  open: "bw",
  in_progress: "amber",
  blocked: "red",
  done: "gray",
};

const TONE_CLASS: Record<Tone, string> = {
  green: "bg-[hsl(var(--status-on-track))] text-black",
  amber: "bg-[hsl(var(--status-behind))] text-black",
  red: "bg-[hsl(var(--status-stalled))] text-white",
  bw: "bg-foreground text-background",
  gray: "bg-secondary text-muted-foreground",
};

export function StatusBadge({
  status,
  dot: _dot,
  className,
}: {
  status: AnyStatus;
  dot?: boolean;
  className?: string;
}) {
  void _dot;
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-md border-2 border-border px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wide",
        TONE_CLASS[TONE_OF[status]],
        className
      )}
    >
      {LABEL[status]}
    </span>
  );
}
