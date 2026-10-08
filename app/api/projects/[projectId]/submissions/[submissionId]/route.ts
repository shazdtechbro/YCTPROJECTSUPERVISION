import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase-admin";
import { getSessionUser } from "@/lib/auth/session";
import { applyMilestone, loadProjectAdmin } from "@/lib/server/project-writes";
import { queueNotification } from "@/lib/server/notify";
import { projectHref } from "@/lib/routes";
import type { SubmissionStatus } from "@/lib/types";

export const runtime = "nodejs";

const STATUSES: SubmissionStatus[] = [
  "pending_review",
  "changes_requested",
  "approved",
];

/** PATCH { status } — the project's supervisor sets the review outcome. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string; submissionId: string } }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const project = await loadProjectAdmin(params.projectId);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (project.supervisorId !== user.uid) {
    return NextResponse.json({ error: "Only the supervisor can review" }, { status: 403 });
  }

  let body: { status?: string; grade?: number | null; feedback?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!STATUSES.includes(body.status as SubmissionStatus)) {
    return NextResponse.json({ error: "Unknown status" }, { status: 400 });
  }
  const next = body.status as SubmissionStatus;
  if (body.grade != null && (!Number.isFinite(body.grade) || body.grade < 0 || body.grade > 100)) {
    return NextResponse.json({ error: "Grade must be between 0 and 100." }, { status: 400 });
  }
  if (typeof body.feedback === "string" && body.feedback.length > 5000) {
    return NextResponse.json({ error: "Feedback must be 5,000 characters or fewer." }, { status: 400 });
  }

  const db = getAdminDb();
  const subRef = db.doc(
    `projects/${params.projectId}/submissions/${params.submissionId}`
  );
  const snap = await subRef.get();
  if (!snap.exists) return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  const sub = snap.data()!;
  const projectRef = db.doc(`projects/${params.projectId}`);
  const batch = db.batch();

  batch.set(
    subRef,
    { status: next, ...(body.grade !== undefined ? { grade: body.grade } : {}), ...(body.feedback !== undefined ? { reviewFeedback: body.feedback.trim() } : {}), updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );
  const activity = db.collection(`projects/${params.projectId}/activity`).doc();
  batch.set(activity, { kind: "review", title: `${sub.title}: ${next.replaceAll("_", " ")}${body.grade != null ? ` · Grade ${body.grade}/100` : ""}`, actorId: user.uid, actorName: user.name ?? "Supervisor", note: body.feedback?.trim() ?? "", createdAt: FieldValue.serverTimestamp() });

  // pendingSubmissions delta
  const wasPending = sub.status === "pending_review";
  const isPending = next === "pending_review";
  if (wasPending !== isPending) {
    batch.set(
      db.doc(`dashboard_stats/${project.supervisorId}`),
      {
        pendingSubmissions: FieldValue.increment(isPending ? 1 : -1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  const chapterStatuses: string[] = Array.isArray(project.chapterStatuses) ? [...project.chapterStatuses] : ["not_started", "not_started", "not_started", "not_started", "not_started"];
  if ((sub.kind === "chapter" || sub.kind === "revision") && Number.isInteger(sub.chapterNumber)) {
    chapterStatuses[sub.chapterNumber - 1] = next === "approved" ? "approved" : next === "changes_requested" ? "changes_requested" : "in_review";
  }
  const allChaptersApproved = chapterStatuses.length === 5 && chapterStatuses.every((status) => status === "approved");
  if (next === "approved" && sub.kind === "final" && !allChaptersApproved) {
    return NextResponse.json({ error: "Approve all five chapter stages before granting final project approval." }, { status: 409 });
  }
  const finalApproved = next === "approved" && sub.kind === "final" ? true : (sub.kind === "final" && next !== "approved" ? false : project.finalApproved);
  const progressPct = next === "approved" && sub.kind === "final" ? 100 : chapterStatuses.filter((status) => status === "approved").length * 20;

  batch.set(
    projectRef,
    {
      finalApproved,
      chapterStatuses,
      progressPct,
      lastActivityAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      ...(next === "approved" && sub.kind === "final"
        ? { status: "approved" }
        : sub.kind === "final" && next !== "approved" ? { status: "active" } : {}),
    },
    { merge: true }
  );

  for (const memberId of (Array.isArray(project.memberIds) ? project.memberIds : [project.studentId])) queueNotification(batch, db, memberId, {
    kind: "review",
    title:
      next === "approved"
        ? `"${sub.title}" was approved`
        : next === "changes_requested"
          ? `Changes requested on "${sub.title}"`
          : `"${sub.title}" review updated`,
    href: projectHref("student", params.projectId),
    actorName: user.name ?? "",
  });

  const before = project.milestoneStatus;
  const verdict = applyMilestone(batch, projectRef, {
    ...project,
    finalApproved,
    lastActivityAt: FieldValue.serverTimestamp() as never,
  });
  if (before !== verdict.status) {
    const delta =
      (verdict.status !== "on_track" ? 1 : 0) - (before !== "on_track" ? 1 : 0);
    batch.set(
      db.doc(`dashboard_stats/${project.supervisorId}`),
      {
        overdueCount: FieldValue.increment(delta),
        [`byMilestoneStatus.${before}`]: FieldValue.increment(-1),
        [`byMilestoneStatus.${verdict.status}`]: FieldValue.increment(1),
      },
      { merge: true }
    );
  }

  await batch.commit();
  return NextResponse.json({ status: "ok", milestone: verdict });
}
