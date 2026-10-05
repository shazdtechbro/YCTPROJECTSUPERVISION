import type { Role } from "@/lib/types";

/** Fixed department list (YABATECH HND). Used for signup + filtering. */
export const DEPARTMENTS = [
  "Computer Science",
  "Computer Engineering",
  "Electrical/Electronic Engineering",
  "Science Laboratory Technology",
  "Statistics",
  "Mathematics",
  "Mechanical Engineering",
  "Civil Engineering",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

export const ROLE_LABELS: Record<Role, string> = {
  student: "Student",
  supervisor: "Supervisor",
  hod: "Head of Department",
};

export const ROLE_OPTIONS: { value: Role; label: string; hint: string }[] = [
  {
    value: "student",
    label: "Student",
    hint: "Submit work, track milestones, raise tickets",
  },
  {
    value: "supervisor",
    label: "Supervisor",
    hint: "Review submissions, run your student roster",
  },
  {
    value: "hod",
    label: "Head of Department",
    hint: "Department-wide oversight and analytics",
  },
];

/** Milestone thresholds — see `lib/milestone.ts`. Days. */
export const MILESTONE_THRESHOLDS = {
  /** No submission in this many days before defense -> behind. */
  behindDaysToDefense: 45,
  /** No activity (submission or ticket) in this many days -> stalled. */
  stalledInactivityDays: 21,
  /** Fewer than this many tickets in the trailing 30 days is a concern signal. */
  minTicketsPer30Days: 1,
  /** Defense within this many days with unapproved final -> behind. */
  finalDueWindowDays: 30,
} as const;

export const PAGE_SIZE = 20;
