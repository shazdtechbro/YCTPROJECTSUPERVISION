import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase-admin";
import { getSessionUser } from "@/lib/auth/session";
import { loadProjectAdmin } from "@/lib/server/project-writes";
import type { TicketStatus } from "@/lib/types";

export const runtime = "nodejs";

const STATUSES: TicketStatus[] = ["open", "in_progress", "blocked", "done"];

/** PATCH { status } — student or supervisor of the project. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string; ticketId: string } }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const project = await loadProjectAdmin(params.projectId);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (!(Array.isArray(project.memberIds) ? project.memberIds.includes(user.uid) : project.studentId === user.uid) && project.supervisorId !== user.uid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!STATUSES.includes(body.status as TicketStatus)) {
    return NextResponse.json({ error: "Unknown status" }, { status: 400 });
  }

  const db = getAdminDb();
  const ticketRef = db.doc(
    `projects/${params.projectId}/tickets/${params.ticketId}`
  );
  const snap = await ticketRef.get();
  if (!snap.exists) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const wasOpen = snap.data()?.status !== "done";
  const nowDone = body.status === "done";
  const batch = db.batch();

  batch.set(
    ticketRef,
    { status: body.status, updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );

  if (wasOpen && nowDone) {
    batch.set(
      db.doc(`projects/${params.projectId}`),
      {
        openTicketCount: FieldValue.increment(-1),
        lastActivityAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    batch.set(
      db.doc(`dashboard_stats/${project.supervisorId}`),
      {
        openTickets: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } else if (!wasOpen && !nowDone) {
    batch.set(
      db.doc(`projects/${params.projectId}`),
      { openTicketCount: FieldValue.increment(1) },
      { merge: true }
    );
    batch.set(
      db.doc(`dashboard_stats/${project.supervisorId}`),
      { openTickets: FieldValue.increment(1) },
      { merge: true }
    );
  }

  await batch.commit();
  return NextResponse.json({ status: "ok" });
}
