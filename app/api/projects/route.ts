import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase-admin";
import { getSessionUser } from "@/lib/auth/session";
import { bumpStats } from "@/lib/server/stats";
import { queueNotification } from "@/lib/server/notify";
import { isMatricNumber, normalizeMatricNumber } from "@/lib/matric";

export const runtime = "nodejs";

/**
 * POST { studentId, title, abstract, defenseDate? }
 * Supervisor creates a project for one of their department's students.
 * Batched with users/{studentId} link + dashboard_stats.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (user.role !== "supervisor" && user.role !== "student") {
    return NextResponse.json({ error: "Only supervisors can create projects" }, { status: 403 });
  }

  let body: {
    studentId?: string;
    studentEmail?: string;
    studentMatricNumber?: string;
    title?: string;
    abstract?: string;
    defenseDate?: string | null;
    supervisorId?: string;
    partnerMatricNumbers?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (user.role === "student") {
    const { supervisorId, title, abstract = "", partnerMatricNumbers = [] } = body;
    if (!supervisorId || !title?.trim() || title.trim().length < 8) {
      return NextResponse.json({ error: "Choose a supervisor and enter a project topic of at least 8 characters." }, { status: 400 });
    }
    if (!Array.isArray(partnerMatricNumbers) || partnerMatricNumbers.length > 4) {
      return NextResponse.json({ error: "A project can include up to four partners." }, { status: 400 });
    }
    const matrics = [...new Set(partnerMatricNumbers.map((m) => normalizeMatricNumber(m)))];
    if (matrics.some((matric) => !isMatricNumber(matric))) {
      return NextResponse.json({ error: "Check the partner matric numbers and try again." }, { status: 400 });
    }

    const db = getAdminDb();
    const ownerRef = db.doc(`users/${user.uid}`);
    const supervisorRef = db.doc(`users/${supervisorId}`);
    const ownerSnap = await ownerRef.get();
    if (!ownerSnap.exists || ownerSnap.get("role") !== "student" || ownerSnap.get("department") !== user.department) {
      return NextResponse.json({ error: "Your student profile could not be verified." }, { status: 403 });
    }
    const ownerData = ownerSnap.data()!;
    if (ownerData.projectId) return NextResponse.json({ error: "You already belong to a project." }, { status: 409 });
    if (ownerData.matricNumber && matrics.includes(normalizeMatricNumber(ownerData.matricNumber))) {
      return NextResponse.json({ error: "You cannot add your own matric number as a project partner." }, { status: 400 });
    }

    const partnerRefs = matrics.map((matric) => db.doc(`matric_index/${matric.replaceAll("/", "_")}`));
    const partnerIndexes = await Promise.all(partnerRefs.map((ref) => ref.get()));
    if (partnerIndexes.some((snap) => !snap.exists || snap.get("uid") === user.uid)) {
      return NextResponse.json({ error: "One or more partner matric numbers could not be found." }, { status: 404 });
    }
    const partnerUserRefs = partnerIndexes.map((snap) => db.doc(`users/${snap.get("uid")}`));
    const projectRef = db.collection("projects").doc();
    try {
      await db.runTransaction(async (tx) => {
        const supervisorSnap = await tx.get(supervisorRef);
        const currentOwner = await tx.get(ownerRef);
        const partners = await Promise.all(partnerUserRefs.map((ref) => tx.get(ref)));
        if (!supervisorSnap.exists || supervisorSnap.get("role") !== "supervisor" || supervisorSnap.get("department") !== user.department) {
          throw new Error("Choose a supervisor in your department.");
        }
        if (currentOwner.get("projectId")) throw new Error("You already belong to a project.");
        if (partners.some((p) => !p.exists || p.get("role") !== "student" || p.get("department") !== user.department || p.get("projectId"))) {
          throw new Error("Every partner must be an unassigned student in your department.");
        }
        const memberIds = [user.uid, ...partnerUserRefs.map((ref) => ref.id)];
        const memberNames = [ownerData.displayName, ...partners.map((p) => p.get("displayName") as string)];
        const memberMatricNumbers = [ownerData.matricNumber ?? "", ...partners.map((p) => p.get("matricNumber") as string)];
        const projectData = {
          title: title.trim(), abstract: abstract.trim(), department: user.department,
          status: "active", topicStatus: "pending", topicDecisionNote: "",
          milestoneStatus: "on_track", milestoneReason: "Topic awaiting supervisor review",
          studentId: user.uid, studentName: ownerData.displayName, studentMatricNumber: ownerData.matricNumber ?? "",
          memberIds, memberNames, memberMatricNumbers,
          supervisorId, supervisorName: supervisorSnap.get("displayName"),
          nextDeadline: null, defenseDate: null, progressPct: 0,
          chapterStatuses: ["not_started", "not_started", "not_started", "not_started", "not_started"],
          openTicketCount: 0, ticketsLast30Days: 0, lastSubmissionAt: null,
          finalApproved: false, extensionStatus: null, extensionRequestedUntil: null,
          createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(), lastActivityAt: FieldValue.serverTimestamp(),
        };
        tx.create(projectRef, projectData);
        tx.set(ownerRef, { projectId: projectRef.id, supervisorId, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        partners.forEach((_partner, i) => {
          tx.set(partnerUserRefs[i], { projectId: projectRef.id, supervisorId, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        });
        const supervisorNotice = db.collection(`users/${supervisorId}/notifications`).doc();
        tx.create(supervisorNotice, { kind: "project", title: `Project topic submitted: ${title.trim()}`, href: `/supervisor/projects/${projectRef.id}`, actorName: ownerData.displayName, read: false, createdAt: FieldValue.serverTimestamp() });
        partners.forEach((partner) => {
          const notice = db.collection(`users/${partner.id}/notifications`).doc();
          tx.create(notice, { kind: "project", title: `${ownerData.displayName} added you to project “${title.trim()}”`, href: `/student/project/${projectRef.id}`, actorName: ownerData.displayName, read: false, createdAt: FieldValue.serverTimestamp() });
        });
      });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Could not submit project topic." }, { status: 409 });
    }
    return NextResponse.json({ status: "ok", projectId: projectRef.id, topicStatus: "pending" });
  }

  const { studentId, studentEmail, studentMatricNumber, title, abstract, defenseDate = null } = body;
  if ((!studentId && !studentEmail && !studentMatricNumber) || !title?.trim() || !abstract?.trim()) {
    return NextResponse.json(
      { error: "A student (id or email), title and abstract are required" },
      { status: 400 }
    );
  }

  const db = getAdminDb();
  let studentSnap;
  if (studentId) {
    studentSnap = await db.doc(`users/${studentId}`).get();
  } else if (studentMatricNumber) {
    const normalized = normalizeMatricNumber(studentMatricNumber);
    if (!isMatricNumber(normalized)) return NextResponse.json({ error: "Enter a valid matric number." }, { status: 400 });
    const index = await db.doc(`matric_index/${normalized.replaceAll("/", "_")}`).get();
    if (index.exists) studentSnap = await db.doc(`users/${index.get("uid")}`).get();
  } else {
    const q = await db
      .collection("users")
      .where("email", "==", studentEmail!.trim().toLowerCase())
      .limit(1)
      .get();
    studentSnap = q.docs[0];
  }
  const student = studentSnap?.data();
  if (!studentSnap?.exists || student?.role !== "student") {
    return NextResponse.json(
      { error: "No student account found for that matric number" },
      { status: 404 }
    );
  }
  if (student.department !== user.department) {
    return NextResponse.json(
      { error: "Student is in another department" },
      { status: 403 }
    );
  }
  if (student.projectId) {
    return NextResponse.json(
      { error: "That student already has a project" },
      { status: 409 }
    );
  }

  const resolvedStudentId = studentSnap.id;
  const projectRef = db.collection("projects").doc();
  const batch = db.batch();

  batch.set(projectRef, {
    title: title.trim(),
    abstract: abstract.trim(),
    department: user.department,
    status: "active",
    milestoneStatus: "on_track",
    milestoneReason: "On schedule",
    studentId: resolvedStudentId,
    studentName: student.displayName,
    studentMatricNumber: student.matricNumber ?? "",
    supervisorId: user.uid,
    supervisorName: user.name ?? "",
    nextDeadline: null,
    defenseDate: defenseDate || null,
    progressPct: 0,
    openTicketCount: 0,
    ticketsLast30Days: 0,
    lastSubmissionAt: null,
    finalApproved: false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    lastActivityAt: FieldValue.serverTimestamp(),
  });

  batch.set(
    studentSnap.ref,
    {
      supervisorId: user.uid,
      projectId: projectRef.id,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  bumpStats(batch, db, user.uid, { activeProjects: 1 });
  batch.set(
    db.doc(`dashboard_stats/${user.uid}`),
    { "byMilestoneStatus.on_track": FieldValue.increment(1) },
    { merge: true }
  );

  queueNotification(batch, db, resolvedStudentId, {
    kind: "project",
    title: `${user.name ?? "Your supervisor"} created your project "${title.trim()}"`,
    href: `/student/project/${projectRef.id}`,
    actorName: user.name ?? "",
  });

  await batch.commit();
  return NextResponse.json({ status: "ok", projectId: projectRef.id });
}
