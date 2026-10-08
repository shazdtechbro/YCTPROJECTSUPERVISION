"use client";

/**
 * Client wrappers for the `/api/*` mutation routes. Screens import these instead
 * of writing to Firestore directly — every write is server-side so
 * `dashboard_stats` and milestone status stay consistent.
 */
import type {
  MilestoneStatus,
  SubmissionKind,
  SubmissionStatus,
  TicketPriority,
  TicketStatus,
} from "@/lib/types";

async function req<T = unknown>(
  url: string,
  method: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  createProject: (input: {
    studentId?: string;
    studentEmail?: string;
    studentMatricNumber?: string;
    supervisorId?: string;
    partnerMatricNumbers?: string[];
    title: string;
    abstract: string;
    defenseDate?: string | null;
  }) => req<{ projectId: string }>("/api/projects", "POST", input),

  decideTopic: (projectId: string, topicStatus: "pending" | "approved" | "declined", note = "") =>
    req(`/api/projects/${projectId}`, "PATCH", { topicStatus, topicDecisionNote: note }),

  resubmitTopic: (projectId: string, topicRevision: string) =>
    req(`/api/projects/${projectId}`, "PATCH", { topicRevision }),

  updateProject: (
    projectId: string,
    patch: Partial<{
      defenseDate: string | null;
      nextDeadline: string | null;
      progressPct: number;
      abstract: string;
      status: string;
    }>
  ) => req<{ milestone: { status: MilestoneStatus; reason: string } }>(
    `/api/projects/${projectId}`,
    "PATCH",
    patch
  ),

  getMilestone: (projectId: string) =>
    req<{ status: MilestoneStatus; reason: string }>(
      `/api/projects/${projectId}`,
      "GET"
    ),

  createTicket: (
    projectId: string,
    input: {
      title: string;
      body: string;
      priority: TicketPriority;
      assigneeId?: string | null;
      dueDate?: string | null;
    }
  ) => req<{ ticketId: string }>(`/api/projects/${projectId}/tickets`, "POST", input),

  setTicketStatus: (projectId: string, ticketId: string, status: TicketStatus) =>
    req(`/api/projects/${projectId}/tickets/${ticketId}`, "PATCH", { status }),

  createSubmission: (
    projectId: string,
    input: {
      title: string;
      kind: SubmissionKind;
      storagePath: string;
      fileName: string;
      fileSize: number;
      chapterNumber?: number;
    }
  ) =>
    req<{ submissionId: string; version: number }>(
      `/api/projects/${projectId}/submissions`,
      "POST",
      input
    ),

  setSubmissionStatus: (
    projectId: string,
    submissionId: string,
    status: SubmissionStatus,
    review?: { grade?: number | null; feedback?: string }
  ) =>
    req(`/api/projects/${projectId}/submissions/${submissionId}`, "PATCH", {
      status,
      ...(review ? { grade: review.grade, feedback: review.feedback } : {}),
    }),

  requestExtension: (projectId: string, requestedUntil: string) =>
    req(`/api/projects/${projectId}`, "PATCH", { extensionRequestedUntil: requestedUntil }),

  decideExtension: (projectId: string, status: "approved" | "declined", note = "") =>
    req(`/api/projects/${projectId}`, "PATCH", { extensionStatus: status, extensionDecisionNote: note }),

  postComment: (projectId: string, submissionId: string, body: string) =>
    req<{ commentId: string }>(
      `/api/projects/${projectId}/submissions/${submissionId}/comments`,
      "POST",
      { body }
    ),

  provisionAccount: (input: {
    idToken: string;
    role: string;
    department: string;
    displayName: string;
    matricNumber?: string;
  }) => req<{ uid: string; role: string }>("/api/auth/provision", "POST", input),
};
