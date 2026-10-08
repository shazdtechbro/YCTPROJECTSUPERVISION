import type { Timestamp } from "firebase/firestore";

/**
 * Domain model for the Digital Project Supervision & Progress Tracking System.
 *
 * Firestore layout (subcollections):
 *   users/{uid}
 *   dashboard_stats/{supervisorId}
 *   projects/{projectId}
 *   projects/{projectId}/tickets/{ticketId}
 *   projects/{projectId}/submissions/{submissionId}
 *   projects/{projectId}/submissions/{submissionId}/comments/{commentId}
 */

export type Role = "student" | "supervisor" | "hod";

/** Custom-claims shape mirrored onto the Firebase Auth token. */
export interface AuthClaims {
  role: Role;
  /** Department code — HOD read scope is department-wide. */
  department: string;
}

export type MilestoneStatus = "on_track" | "behind" | "stalled";
export type ProjectStatus = "active" | "submitted" | "approved" | "archived";
export type TicketStatus = "open" | "in_progress" | "blocked" | "done";
export type TicketPriority = "low" | "medium" | "high";
export type SubmissionKind =
  | "proposal"
  | "chapter"
  | "revision"
  | "final"
  | "other";
export type SubmissionStatus =
  | "pending_review"
  | "changes_requested"
  | "approved";

export type TopicStatus = "pending" | "approved" | "declined";
export type ChapterStatus = "not_started" | "in_review" | "changes_requested" | "approved";
export const CHAPTER_STAGES = [
  "Chapter One: Introduction",
  "Chapter Two: Literature Review",
  "Chapter Three: Methodology",
  "Chapter Four: System Design and Implementation",
  "Chapter Five: Summary, Conclusion and Recommendations",
] as const;

/** Base fields every stored document carries after the converter runs. */
export interface DocBase {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserDoc extends DocBase {
  uid: string;
  displayName: string;
  email: string;
  role: Role;
  department: string;
  photoURL?: string;
  matricNumber?: string;
  /** Present on student docs only — enables fast supervisor roster queries. */
  supervisorId?: string;
  /** Present on student docs only — the student's single active project. */
  projectId?: string;
}

export interface ProjectDoc extends DocBase {
  title: string;
  topicStatus?: TopicStatus;
  topicDecisionNote?: string;
  memberIds?: string[];
  memberNames?: string[];
  memberMatricNumbers?: string[];
  chapterStatuses?: ChapterStatus[];
  extensionStatus?: "pending" | "approved" | "declined" | null;
  extensionRequestedUntil?: string | null;
  extensionDecisionNote?: string;
  abstract: string;
  department: string;
  status: ProjectStatus;
  milestoneStatus: MilestoneStatus;
  /** Human-readable reason for the current milestoneStatus (from lib/milestone). */
  milestoneReason: string;
  /** Denormalised for list rendering without extra reads. */
  studentId: string;
  studentName: string;
  studentMatricNumber?: string;
  supervisorId: string;
  supervisorName: string;
  /** ISO date (yyyy-mm-dd) of the next milestone deadline. */
  nextDeadline: string | null;
  /** ISO date (yyyy-mm-dd) of the project defense. */
  defenseDate: string | null;
  progressPct: number;
  openTicketCount: number;
  /** Rolling denormalised count — trailing 30 days. Maintained on ticket write. */
  ticketsLast30Days: number;
  /** Most recent submission upload time. */
  lastSubmissionAt: Timestamp | null;
  /** Whether a `final` submission has been approved. */
  finalApproved: boolean;
  lastActivityAt: Timestamp;
}

export interface TicketDoc extends DocBase {
  projectId: string;
  title: string;
  body: string;
  status: TicketStatus;
  priority: TicketPriority;
  authorId: string;
  authorName: string;
  assigneeId: string | null;
  dueDate: string | null;
}

export interface SubmissionDoc extends DocBase {
  projectId: string;
  title: string;
  kind: SubmissionKind;
  chapterNumber?: number | null;
  grade?: number | null;
  reviewFeedback?: string;
  status: SubmissionStatus;
  version: number;
  /** Firebase Storage object path, not a public URL. */
  storagePath: string;
  fileName: string;
  fileSize: number;
  submittedById: string;
  submittedByName: string;
  commentCount: number;
  /** When the assigned supervisor first commented — feeds the responsiveness metric. */
  firstResponseAt: Timestamp | null;
}

export interface CommentDoc extends DocBase {
  projectId: string;
  submissionId: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  body: string;
}

/**
 * Top-level denormalised counters, one doc per supervisor, refreshed by a
 * Cloud Function write-trigger. Supervisor and HOD dashboards read this
 * instead of fanning out across every project.
 */
export interface DashboardStatsDoc extends DocBase {
  supervisorId: string;
  supervisorName: string;
  department: string;
  activeProjects: number;
  overdueCount: number;
  pendingSubmissions: number;
  openTickets: number;
  /** Avg hours between a student submission and the supervisor's first comment. */
  avgResponseHours: number | null;
  byMilestoneStatus: Record<MilestoneStatus, number>;
  lastActivityAt: Timestamp;
}

/** One point on the HOD "supervision activity over time" chart. */
export interface ActivityPointDoc {
  /** yyyy-mm-dd (bucket day). */
  day: string;
  submissions: number;
  comments: number;
  tickets: number;
}

export type NotificationKind =
  | "ticket"
  | "submission"
  | "comment"
  | "review"
  | "project";

export interface NotificationDoc {
  id: string;
  kind: NotificationKind;
  title: string;
  href: string;
  actorName: string;
  read: boolean;
  createdAt: Timestamp;
}

/** Shape used by the shared activity <Timeline />. */
export interface ActivityEvent {
  id: string;
  kind: "ticket" | "submission" | "comment" | "status_change" | "review" | "topic" | "extension";
  title: string;
  actorName: string;
  at: Timestamp;
  href?: string;
}
