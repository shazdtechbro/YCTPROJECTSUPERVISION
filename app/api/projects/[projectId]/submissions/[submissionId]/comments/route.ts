import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase-admin";
import { getSessionUser } from "@/lib/auth/session";
import { canReadProject } from "@/lib/server/project-access";
import { loadProjectAdmin } from "@/lib/server/project-writes";
import { queueNotification } from "@/lib/server/notify";
import { bumpDailyActivity } from "@/lib/server/activity";
import { isPdfMark, PDF_COLOURS, type PdfColour } from "@/lib/pdf-mark";
import { projectHref } from "@/lib/routes";

export const runtime = "nodejs";

/**
 * POST { body } — anyone with read access to the project.
 * Batched with submission.commentCount, project.lastActivityAt, and — when the
 * supervisor comments first — submission.firstResponseAt (responsiveness metric).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string; submissionId: string } },
) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!(await canReadProject(user, params.projectId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { body?: string; mark?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (
    !body || typeof body.body !== "string" ||
    !body.body.trim() ||
    body.body.length > 5000
  ) {
    return NextResponse.json(
      { error: "Comment body is required" },
      { status: 400 },
    );
  }

  const db = getAdminDb();
  const project = await loadProjectAdmin(params.projectId);
  if (!project)
    return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const subRef = db.doc(
    `projects/${params.projectId}/submissions/${params.submissionId}`,
  );
  const subSnap = await subRef.get();
  if (!subSnap.exists)
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 },
    );

  if (body.mark !== undefined && (!isPdfMark(body.mark) || !/\.pdf$/i.test(subSnap.get("fileName") ?? ""))) {
    return NextResponse.json({ error: "Choose a valid area on the PDF." }, { status: 400 });
  }

  const commentRef = subRef.collection("comments").doc();
  const batch = db.batch();

  batch.set(commentRef, {
    projectId: params.projectId,
    submissionId: params.submissionId,
    authorId: user.uid,
    authorName: user.name ?? "",
    authorRole: user.role,
    body: body.body.trim(),
    ...(body.mark ? { mark: body.mark } : {}),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const patch: Record<string, unknown> = {
    commentCount: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp(),
  };
  const isSupervisorFirstReply =
    user.uid === project.supervisorId && !subSnap.data()?.firstResponseAt;
  if (isSupervisorFirstReply) {
    patch.firstResponseAt = FieldValue.serverTimestamp();
  }
  batch.set(subRef, patch, { merge: true });

  batch.set(
    db.doc(`projects/${params.projectId}`),
    { lastActivityAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
  batch.set(
    db.doc(`dashboard_stats/${project.supervisorId}`),
    {
      lastActivityAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  const recipients =
    user.role === "supervisor"
      ? (project.memberIds ?? [project.studentId])
      : [project.supervisorId];
  for (const recipient of recipients) {
    queueNotification(batch, db, recipient, {
      kind: "comment",
      title: `${user.name ?? "Someone"} commented on a submission`,
      href: projectHref(
        user.role === "supervisor" ? "student" : "supervisor",
        params.projectId,
      ),
      actorName: user.name ?? "",
    });
  }

  bumpDailyActivity(batch, db, project.department, "comments");

  await batch.commit();
  return NextResponse.json({ status: "ok", commentId: commentRef.id });
}

/** Only the author may change the note or colour of an existing PDF highlight. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string; submissionId: string } },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to edit a comment." }, { status: 401 });
  if (!(await canReadProject(user, params.projectId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const input = await req.json().catch(() => null);
  if (!input || typeof input.commentId !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(input.commentId) ||
      typeof input.body !== "string" || !input.body.trim() || input.body.length > 5000 ||
      !PDF_COLOURS.includes(input.colour as PdfColour)) {
    return NextResponse.json({ error: "Enter a comment and choose a highlight colour." }, { status: 400 });
  }
  const db = getAdminDb();
  const ref = db.doc(`projects/${params.projectId}/submissions/${params.submissionId}/comments/${input.commentId}`);
  return db.runTransaction(async (tx) => {
    const record = await tx.get(ref);
    if (!record.exists || !isPdfMark(record.get("mark"))) return NextResponse.json({ error: "Highlight not found." }, { status: 404 });
    if (record.get("authorId") !== user.uid) return NextResponse.json({ error: "Only the author can edit this highlight." }, { status: 403 });
    tx.update(ref, { body: input.body.trim(), mark: { ...record.get("mark"), colour: input.colour }, updatedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ status: "ok" });
  });
}
