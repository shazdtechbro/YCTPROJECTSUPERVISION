import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase-admin";
import { getSessionUser } from "@/lib/auth/session";
import { bumpStats } from "@/lib/server/stats";
import { applyMilestone, loadProjectAdmin } from "@/lib/server/project-writes";
import { queueNotification } from "@/lib/server/notify";
import { bumpDailyActivity } from "@/lib/server/activity";
import { projectHref } from "@/lib/routes";
import type { TicketPriority } from "@/lib/types";

export const runtime = "nodejs";

const PRIORITIES: TicketPriority[] = ["low", "medium", "high"];

/** POST { title, body, priority, assigneeId?, dueDate? } — student or supervisor of the project. */
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const project = await loadProjectAdmin(params.projectId);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const isMember =
    (Array.isArray(project.memberIds) ? project.memberIds.includes(user.uid) : project.studentId === user.uid) || project.supervisorId === user.uid;
  if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: {
    title?: string;
    body?: string;
    priority?: string;
    assigneeId?: string | null;
    dueDate?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.title?.trim() || !body.body?.trim()) {
    return NextResponse.json({ error: "title and body are required" }, { status: 400 });
  }
  const priority = PRIORITIES.includes(body.priority as TicketPriority)
    ? (body.priority as TicketPriority)
    : "medium";

  const db = getAdminDb();
  const projectRef = db.doc(`projects/${params.projectId}`);
  const ticketRef = projectRef.collection("tickets").doc();
  const batch = db.batch();

  batch.set(ticketRef, {
    projectId: params.projectId,
    title: body.title.trim(),
    body: body.body.trim(),
    status: "open",
    priority,
    authorId: user.uid,
    authorName: user.name ?? "",
    assigneeId: body.assigneeId ?? null,
    dueDate: body.dueDate ?? null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  batch.set(
    projectRef,
    {
      openTicketCount: FieldValue.increment(1),
      ticketsLast30Days: FieldValue.increment(1),
      lastActivityAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  const before = project.milestoneStatus;
  const verdict = applyMilestone(batch, projectRef, {
    ...project,
    ticketsLast30Days: (project.ticketsLast30Days ?? 0) + 1,
    lastActivityAt: FieldValue.serverTimestamp() as never,
  });

  bumpStats(batch, db, project.supervisorId, { openTickets: 1 });

  const recipientIsStudent = user.uid !== project.studentId;
  queueNotification(
    batch,
    db,
    recipientIsStudent ? project.studentId : project.supervisorId,
    {
      kind: "ticket",
      title: `New ticket: ${body.title.trim()}`,
      href: projectHref(recipientIsStudent ? "student" : "supervisor", params.projectId),
      actorName: user.name ?? "",
    }
  );

  if (before !== verdict.status) {
    const wasOverdue = before !== "on_track" ? 1 : 0;
    const isOverdue = verdict.status !== "on_track" ? 1 : 0;
    bumpStats(batch, db, project.supervisorId, { overdueCount: isOverdue - wasOverdue }, false);
    batch.set(
      db.doc(`dashboard_stats/${project.supervisorId}`),
      {
        [`byMilestoneStatus.${before}`]: FieldValue.increment(-1),
        [`byMilestoneStatus.${verdict.status}`]: FieldValue.increment(1),
      },
      { merge: true }
    );
  }

  bumpDailyActivity(batch, db, project.department, "tickets");

  await batch.commit();
  return NextResponse.json({ status: "ok", ticketId: ticketRef.id });
}
