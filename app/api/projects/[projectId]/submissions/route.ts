import { NextResponse, type NextRequest } from "next/server";
import { FieldValue, type WriteBatch } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase-admin";
import { getSessionUser } from "@/lib/auth/session";
import { bumpStats } from "@/lib/server/stats";
import { applyMilestone } from "@/lib/server/project-writes";
import { queueNotification } from "@/lib/server/notify";
import { bumpDailyActivity } from "@/lib/server/activity";
import { projectHref } from "@/lib/routes";
import type { SubmissionKind } from "@/lib/types";

export const runtime = "nodejs";

const KINDS: SubmissionKind[] = [
  "proposal",
  "chapter",
  "revision",
  "final",
  "other",
];

/**
 * POST { title, kind, storagePath, fileName, fileSize }
 * The file is already in Supabase (uploaded via /api/submissions/sign-upload).
 * Student of the project only.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } },
) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: {
    title?: string;
    kind?: string;
    storagePath?: string;
    fileName?: string;
    fileSize?: number;
    chapterNumber?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const db = getAdminDb();
  const previousCount = (
    await db
      .collection(`projects/${params.projectId}/submissions`)
      .count()
      .get()
  ).data().count;
  return db.runTransaction(async (tx) => {
    const projectSnap = await tx.get(db.doc(`projects/${params.projectId}`));
    const project = projectSnap.exists
      ? ({
          id: projectSnap.id,
          ...projectSnap.data()!,
        } as import("@/lib/server/project-writes").AdminProject)
      : null;
    if (!project)
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    if (
      user.role !== "student" ||
      !(Array.isArray(project.memberIds)
        ? project.memberIds.includes(user.uid)
        : project.studentId === user.uid)
    ) {
      return NextResponse.json(
        { error: "Only the project's student can submit" },
        { status: 403 },
      );
    }

    const { title, kind, storagePath, fileName, fileSize, chapterNumber } =
      body;
    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.length > 300 ||
      typeof storagePath !== "string" ||
      typeof fileName !== "string" ||
      !fileName ||
      typeof fileSize !== "number" ||
      !Number.isInteger(fileSize) ||
      fileSize <= 0 ||
      fileSize > 25 * 1024 * 1024
    ) {
      return NextResponse.json(
        { error: "title, storagePath, fileName and fileSize are required" },
        { status: 400 },
      );
    }
    if (!storagePath.startsWith(`projects/${params.projectId}/submissions/`)) {
      return NextResponse.json(
        { error: "storagePath is out of scope" },
        { status: 400 },
      );
    }
    if (project.finalApproved)
      return NextResponse.json(
        { error: "This project already has final approval." },
        { status: 409 },
      );
    const subKind = KINDS.includes(kind as SubmissionKind)
      ? (kind as SubmissionKind)
      : "other";
    if (
      (project.topicStatus ?? "approved") !== "approved" &&
      subKind !== "proposal"
    ) {
      return NextResponse.json(
        {
          error:
            "Your supervisor must approve the project topic before chapter work can be submitted.",
        },
        { status: 409 },
      );
    }
    if (
      (subKind === "chapter" || subKind === "revision") &&
      (!Number.isInteger(chapterNumber) ||
        chapterNumber! < 1 ||
        chapterNumber! > 5)
    ) {
      return NextResponse.json(
        { error: "Choose a chapter from 1 to 5 for this submission." },
        { status: 400 },
      );
    }
    if (
      subKind === "final" &&
      !(
        project.chapterStatuses?.length === 5 &&
        project.chapterStatuses.every((status) => status === "approved")
      )
    ) {
      return NextResponse.json(
        {
          error:
            "All five chapter stages must be approved before final submission.",
        },
        { status: 409 },
      );
    }

    const projectRef = db.doc(`projects/${params.projectId}`);
    const subsCol = projectRef.collection("submissions");
    const version =
      ((project as typeof project & { submissionCount?: number })
        .submissionCount ?? previousCount) + 1;

    const subRef = subsCol.doc();
    const batch = tx as unknown as WriteBatch;
    const chapterStatuses: string[] = Array.isArray(project.chapterStatuses)
      ? [...project.chapterStatuses]
      : [
          "not_started",
          "not_started",
          "not_started",
          "not_started",
          "not_started",
        ];
    if ((subKind === "chapter" || subKind === "revision") && chapterNumber)
      chapterStatuses[chapterNumber - 1] = "in_review";

    batch.set(subRef, {
      projectId: params.projectId,
      title: title.trim(),
      kind: subKind,
      chapterNumber:
        subKind === "chapter" || subKind === "revision" ? chapterNumber : null,
      status: "pending_review",
      version,
      storagePath,
      fileName,
      fileSize,
      submittedById: user.uid,
      submittedByName: user.name ?? "",
      commentCount: 0,
      firstResponseAt: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const event = db.collection(`projects/${params.projectId}/activity`).doc();
    batch.set(event, {
      kind: "submission",
      title: `${title.trim()} submitted for review`,
      actorId: user.uid,
      actorName: user.name ?? "Student",
      createdAt: FieldValue.serverTimestamp(),
    });

    batch.set(
      projectRef,
      {
        lastSubmissionAt: FieldValue.serverTimestamp(),
        lastActivityAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        submissionCount: version,
        chapterStatuses,
        ...(chapterNumber
          ? { latestChapterSubmissionIds: { [chapterNumber]: subRef.id } }
          : {}),
        progressPct:
          chapterStatuses.filter((status) => status === "approved").length * 20,
      },
      { merge: true },
    );

    const before = project.milestoneStatus;
    const verdict = applyMilestone(batch, projectRef, {
      ...project,
      lastSubmissionAt: FieldValue.serverTimestamp() as never,
      lastActivityAt: FieldValue.serverTimestamp() as never,
    });

    bumpStats(batch, db, project.supervisorId, { pendingSubmissions: 1 });

    queueNotification(batch, db, project.supervisorId, {
      kind: "submission",
      title: `${user.name ?? "Student"} submitted "${title.trim()}" (v${version})`,
      href: projectHref("supervisor", params.projectId),
      actorName: user.name ?? "",
    });

    if (before !== verdict.status) {
      const delta =
        (verdict.status !== "on_track" ? 1 : 0) -
        (before !== "on_track" ? 1 : 0);
      bumpStats(
        batch,
        db,
        project.supervisorId,
        { overdueCount: delta },
        false,
      );
      batch.set(
        db.doc(`dashboard_stats/${project.supervisorId}`),
        {
          byMilestoneStatus: {
            [before]: FieldValue.increment(-1),
            [verdict.status]: FieldValue.increment(1),
          },
        },
        { merge: true },
      );
    }

    bumpDailyActivity(batch, db, project.department, "submissions");

    return NextResponse.json({
      status: "ok",
      submissionId: subRef.id,
      version,
    });
  });
}
