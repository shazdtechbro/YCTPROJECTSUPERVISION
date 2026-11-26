import { cn } from "@/lib/utils";
import type { MilestoneStatus, ProjectStatus, SubmissionStatus, TicketStatus } from "@/lib/types";

type AnyStatus = MilestoneStatus | ProjectStatus | SubmissionStatus | TicketStatus;

const LABEL: Record<AnyStatus, string> = {
  on_track: "On track",
  behind: "Behind",
  stalled: "Stalled",
  active: "Active",
  submitted: "Submitted",
  approved: "Approved",
  archived: "Archived",
  pending_review: "In review",
  changes_requested: "Changes requested",
  open: "Open",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
};

type Tone = "green" | "amber" | "red" | "ink" | "gray";
const TONE_OF: Record<AnyStatus, Tone> = {
  on_track: "green", behind: "amber", stalled: "red",
  active: "ink", submitted: "amber", approved: "green", archived: "gray",
  pending_review: "amber", changes_requested: "red",
  open: "ink", in_progress: "amber", blocked: "red", done: "gray",
};
const TONE_CLASS: Record<Tone, string> = {
  green: "bg-brand-50 text-brand-700",
  amber: "bg-sun-100 text-behind",
  red: "bg-[#FDECEA] text-stalled",
  ink: "bg-ink/[0.06] text-ink",
  gray: "bg-cream-2 text-ink-2",
};

/** Health / status chip. Always a dot plus a label, never colour alone. */
export function StatusBadge({ status, className }: { status: AnyStatus; dot?: boolean; className?: string }) {
  return (
    <span className={cn("chip", TONE_CLASS[TONE_OF[status]], className)}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {LABEL[status]}
    </span>
  );
}
export const HealthBadge = StatusBadge;
export const STATUS_LABEL = LABEL;
