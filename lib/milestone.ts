/**
 * Pure milestone-status logic. No Firebase, no I/O — just data in, verdict out.
 *
 * Called two ways:
 *  - batch, from `GET/POST /api/cron/update-status` (Vercel Cron, daily)
 *  - on the fly, from a dashboard for a single project (`computeMilestoneStatus`)
 */
import { MILESTONE_THRESHOLDS as T } from "@/lib/constants";
import type { MilestoneStatus } from "@/lib/types";

export interface MilestoneInputs {
  /** yyyy-mm-dd, or null if no defense scheduled yet. */
  defenseDate: string | null;
  /** Most recent submission upload. */
  lastSubmissionDate: Date | null;
  /** Most recent activity of any kind (submission, ticket, comment). */
  lastActivityDate: Date | null;
  /** Ticket count in the trailing 30 days. */
  ticketsLast30Days: number;
  /** Whether a `final` submission has been approved. */
  finalApproved: boolean;
  now?: Date;
}

export interface MilestoneVerdict {
  status: MilestoneStatus;
  reason: string;
}

const DAY = 86_400_000;

function daysBetween(a: Date, b: Date): number {
  return (a.getTime() - b.getTime()) / DAY;
}

export function computeMilestoneStatus(
  input: MilestoneInputs
): MilestoneVerdict {
  const now = input.now ?? new Date();
  const {
    defenseDate,
    lastSubmissionDate,
    lastActivityDate,
    ticketsLast30Days,
    finalApproved,
  } = input;

  // 1. Stalled — nothing has happened on the project in a long time.
  if (
    lastActivityDate &&
    daysBetween(now, lastActivityDate) > T.stalledInactivityDays
  ) {
    return {
      status: "stalled",
      reason: `No activity for ${Math.floor(
        daysBetween(now, lastActivityDate)
      )} days`,
    };
  }
  if (!lastActivityDate) {
    return { status: "stalled", reason: "No activity recorded yet" };
  }

  // 2. Behind — defense pressure without matching progress.
  if (defenseDate) {
    const defense = new Date(`${defenseDate}T23:59:59`);
    const daysToDefense = daysBetween(defense, now);

    if (daysToDefense < 0 && !finalApproved) {
      return {
        status: "behind",
        reason: "Defense date has passed with no approved final",
      };
    }
    if (
      daysToDefense >= 0 &&
      daysToDefense <= T.finalDueWindowDays &&
      !finalApproved
    ) {
      return {
        status: "behind",
        reason: `Defense in ${Math.ceil(
          daysToDefense
        )} days, final not approved`,
      };
    }
    if (
      daysToDefense <= T.behindDaysToDefense &&
      (!lastSubmissionDate ||
        daysBetween(now, lastSubmissionDate) > T.behindDaysToDefense)
    ) {
      return {
        status: "behind",
        reason: `Defense approaching with no recent submission`,
      };
    }
  }

  // 3. Behind — supervision cadence has dried up.
  if (
    ticketsLast30Days < T.minTicketsPer30Days &&
    daysBetween(now, lastActivityDate) > 10
  ) {
    return {
      status: "behind",
      reason: "No activities recorded in the last 30 days",
    };
  }

  return { status: "on_track", reason: "On schedule" };
}
