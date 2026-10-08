import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase-admin";
import { getSessionUser } from "@/lib/auth/session";
import { canReadProject } from "@/lib/server/project-access";
import { applyMilestone, loadProjectAdmin } from "@/lib/server/project-writes";
import { computeMilestoneStatus } from "@/lib/milestone";
import { Timestamp } from "firebase-admin/firestore";

export const runtime = "nodejs";

/** GET -> on-the-fly milestone verdict for one project (read access required). */
export async function GET(
  _req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!(await canReadProject(user, params.projectId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const p = await loadProjectAdmin(params.projectId);
  if (!p) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const verdict = computeMilestoneStatus({
    defenseDate: p.defenseDate ?? null,
    lastSubmissionDate:
      p.lastSubmissionAt instanceof Timestamp ? p.lastSubmissionAt.toDate() : null,
    lastActivityDate:
      p.lastActivityAt instanceof Timestamp ? p.lastActivityAt.toDate() : null,
    ticketsLast30Days: p.ticketsLast30Days ?? 0,
    finalApproved: Boolean(p.finalApproved),
  });
  return NextResponse.json(verdict);
}

/**
 * PATCH { defenseDate?, nextDeadline?, progressPct?, abstract?, status? }
 *  - supervisor of the project: defenseDate, nextDeadline, status
 *  - student of the project: abstract, progressPct
 * Recomputes milestone + folds any status change into dashboard_stats.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const project = await loadProjectAdmin(params.projectId);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const isSupervisor = project.supervisorId === user.uid;
  const isStudent = Array.isArray(project.memberIds)
    ? project.memberIds.includes(user.uid)
    : project.studentId === user.uid;
  if (!isSupervisor && !isStudent) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const db = getAdminDb();
  const projectRef = db.doc(`projects/${params.projectId}`);
  const members: string[] = Array.isArray(project.memberIds) ? project.memberIds : [project.studentId];
  const batch = db.batch();
  const notifyMembers = (title: string, actorName: string) => {
    for (const memberId of members) {
      const notification = db.collection(`users/${memberId}/notifications`).doc();
      batch.set(notification, { kind: "review", title, href: `/student/project/${params.projectId}`, actorName, read: false, createdAt: FieldValue.serverTimestamp() });
    }
  };

  if ("topicRevision" in body) {
    const revisedTopic = typeof body.topicRevision === "string" ? body.topicRevision.trim() : "";
    if (!isStudent || user.uid !== project.studentId || project.topicStatus !== "declined" || revisedTopic.length < 8 || revisedTopic.length > 300) {
      return NextResponse.json({ error: "Only the project lead can resubmit a declined topic (8–300 characters)." }, { status: 400 });
    }
    batch.set(projectRef, { title: revisedTopic, topicStatus: "pending", topicDecisionNote: "", milestoneReason: "Revised topic awaiting supervisor review.", updatedAt: FieldValue.serverTimestamp(), lastActivityAt: FieldValue.serverTimestamp() }, { merge: true });
    const notice = db.collection(`users/${project.supervisorId}/notifications`).doc();
    batch.set(notice, { kind: "project", title: `Revised topic submitted: ${revisedTopic}`, href: `/supervisor/projects/${params.projectId}`, actorName: user.name ?? "Project lead", read: false, createdAt: FieldValue.serverTimestamp() });
    const event = db.collection(`projects/${params.projectId}/activity`).doc();
    batch.set(event, { kind: "topic", title: "Revised topic submitted", actorId: user.uid, actorName: user.name ?? "Project lead", note: revisedTopic, createdAt: FieldValue.serverTimestamp() });
    await batch.commit();
    return NextResponse.json({ status: "ok", topicStatus: "pending" });
  }

  if ("topicStatus" in body) {
    const value = body.topicStatus;
    if (!isSupervisor || !["pending", "approved", "declined"].includes(String(value))) {
      return NextResponse.json({ error: "Only the assigned supervisor can decide a project topic." }, { status: 403 });
    }
    const note = typeof body.topicDecisionNote === "string" ? body.topicDecisionNote.trim().slice(0, 2000) : "";
    batch.set(projectRef, { topicStatus: value, topicDecisionNote: note, milestoneReason: value === "approved" ? "Topic approved. Chapter work may begin." : value === "declined" ? "Topic declined. Review the supervisor's feedback." : "Topic awaiting supervisor review.", updatedAt: FieldValue.serverTimestamp(), lastActivityAt: FieldValue.serverTimestamp() }, { merge: true });
    if (value !== "pending") notifyMembers(`Project topic ${value}: ${project.title}`, user.name ?? "Your supervisor");
    const event = db.collection(`projects/${params.projectId}/activity`).doc();
    batch.set(event, { kind: "topic", title: `Topic ${value}`, actorId: user.uid, actorName: user.name ?? "Supervisor", note, createdAt: FieldValue.serverTimestamp() });
    await batch.commit();
    return NextResponse.json({ status: "ok", topicStatus: value });
  }

  if ("extensionRequestedUntil" in body) {
    const proposedDate = typeof body.extensionRequestedUntil === "string" ? new Date(`${body.extensionRequestedUntil}T00:00:00.000Z`) : new Date(NaN);
    const currentDeadline = project.nextDeadline ? new Date(`${project.nextDeadline}T00:00:00.000Z`) : new Date();
    const validDate = typeof body.extensionRequestedUntil === "string"
      && /^\d{4}-\d{2}-\d{2}$/.test(body.extensionRequestedUntil)
      && !Number.isNaN(proposedDate.getTime())
      && proposedDate.toISOString().slice(0, 10) === body.extensionRequestedUntil
      && proposedDate > currentDeadline
      && proposedDate.getTime() <= Date.now() + 180 * 86_400_000;
    if (!isStudent || !validDate) {
      return NextResponse.json({ error: "Enter a valid requested extension date." }, { status: 400 });
    }
    if (project.extensionStatus === "pending") return NextResponse.json({ error: "An extension request is already pending." }, { status: 409 });
    batch.set(projectRef, { extensionStatus: "pending", extensionRequestedUntil: body.extensionRequestedUntil, updatedAt: FieldValue.serverTimestamp(), lastActivityAt: FieldValue.serverTimestamp() }, { merge: true });
    const notice = db.collection(`users/${project.supervisorId}/notifications`).doc();
    batch.set(notice, { kind: "project", title: `Extension requested for ${project.title}`, href: `/supervisor/projects/${params.projectId}`, actorName: user.name ?? "Project student", read: false, createdAt: FieldValue.serverTimestamp() });
    const event = db.collection(`projects/${params.projectId}/activity`).doc();
    batch.set(event, { kind: "extension", title: "Deadline extension requested", actorId: user.uid, actorName: user.name ?? "Student", date: body.extensionRequestedUntil, createdAt: FieldValue.serverTimestamp() });
    await batch.commit();
    return NextResponse.json({ status: "ok", extensionStatus: "pending" });
  }

  if ("extensionStatus" in body) {
    if (!isSupervisor || !["approved", "declined"].includes(String(body.extensionStatus)) || project.extensionStatus !== "pending") {
      return NextResponse.json({ error: "There is no pending extension request to decide." }, { status: 400 });
    }
    const note = typeof body.extensionDecisionNote === "string" ? body.extensionDecisionNote.trim().slice(0, 2000) : "";
    const decision = body.extensionStatus as "approved" | "declined";
    batch.set(projectRef, { extensionStatus: decision, extensionDecisionNote: note, ...(decision === "approved" ? { nextDeadline: project.extensionRequestedUntil } : {}), updatedAt: FieldValue.serverTimestamp(), lastActivityAt: FieldValue.serverTimestamp() }, { merge: true });
    notifyMembers(`Deadline extension ${decision} for ${project.title}`, user.name ?? "Your supervisor");
    const event = db.collection(`projects/${params.projectId}/activity`).doc();
    batch.set(event, { kind: "extension", title: `Deadline extension ${decision}`, actorId: user.uid, actorName: user.name ?? "Supervisor", note, createdAt: FieldValue.serverTimestamp() });
    await batch.commit();
    return NextResponse.json({ status: "ok", extensionStatus: decision });
  }

  const patch: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (isSupervisor) {
    if ("defenseDate" in body) patch.defenseDate = (body.defenseDate as string) || null;
    if ("nextDeadline" in body) patch.nextDeadline = (body.nextDeadline as string) || null;
    if (typeof body.status === "string") patch.status = body.status;
  }
  if (isStudent) {
    if (typeof body.abstract === "string" && body.abstract.trim()) {
      patch.abstract = body.abstract.trim();
    }
    if (typeof body.progressPct === "number") {
      patch.progressPct = Math.max(0, Math.min(100, Math.round(body.progressPct)));
    }
  }
  if (Object.keys(patch).length === 1) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  batch.set(projectRef, patch, { merge: true });

  const before = project.milestoneStatus;
  const verdict = applyMilestone(batch, projectRef, {
    ...project,
    defenseDate: (patch.defenseDate as string | null) ?? project.defenseDate,
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
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  await batch.commit();
  return NextResponse.json({ status: "ok", milestone: verdict });
}
