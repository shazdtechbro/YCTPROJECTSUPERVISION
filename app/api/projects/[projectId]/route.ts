import { isProjectStage, stageDeadline, stageLabel } from "@/lib/project-stages";
import { isMatricNumber, normalizeMatricNumber } from "@/lib/matric";
import { isCalendarDate } from "@/lib/dates";
import { NextResponse, type NextRequest } from "next/server";
import { FieldValue, type WriteBatch } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase-admin";
import { getSessionUser } from "@/lib/auth/session";
import { canReadProject } from "@/lib/server/project-access";
import { applyMilestone, loadProjectAdmin } from "@/lib/server/project-writes";
import { defenceInstant } from "@/lib/defence-schedule";
import { loadDepartmentDefence } from "@/lib/server/department-defence";
import { computeMilestoneStatus } from "@/lib/milestone";
import { Timestamp } from "firebase-admin/firestore";

export const runtime = "nodejs";

/** GET -> on-the-fly milestone verdict for one project (read access required). */
export async function GET(
  _req: NextRequest,
  { params }: { params: { projectId: string } },
) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!(await canReadProject(user, params.projectId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const p = await loadProjectAdmin(params.projectId);
  if (!p)
    return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const schedule = await loadDepartmentDefence(p.department);
  const verdict = computeMilestoneStatus({
    defenseDate: p.defenseDate ?? null,
    officialDefenceAt: schedule ? defenceInstant(schedule) : undefined,
    projectStartedAt: p.createdAt instanceof Timestamp ? p.createdAt.toDate() : null,
    chapterProgress: p.progressPct,
    lastSubmissionDate:
      p.lastSubmissionAt instanceof Timestamp
        ? p.lastSubmissionAt.toDate()
        : null,
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
  { params }: { params: { projectId: string } },
) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const db = getAdminDb();
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

    const isSupervisor =
      user.role === "supervisor" && project.supervisorId === user.uid;
    const isStudent =
      user.role === "student" &&
      (project.studentId === user.uid ||
        !!project.memberIds?.includes(user.uid));
    if (!isSupervisor && !isStudent) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const projectRef = db.doc(`projects/${params.projectId}`);
    const members: string[] = Array.isArray(project.memberIds)
      ? project.memberIds
      : [project.studentId];
    const batch = tx as unknown as WriteBatch;
    const notifyMembers = (title: string, actorName: string) => {
      for (const memberId of members) {
        const notification = db
          .collection(`users/${memberId}/notifications`)
          .doc();
        batch.set(notification, {
          kind: "review",
          title,
          href: `/student/project/${params.projectId}`,
          actorName,
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
    };

    if (
      project.finalApproved &&
      ("topicRevision" in body ||
        "topicStatus" in body ||
        "extensionRequestedUntil" in body)
    )
      return NextResponse.json(
        { error: "This project already has final approval." },
        { status: 409 },
      );
    if ("topicRevision" in body) {
      const revisedTopic =
        typeof body.topicRevision === "string" ? body.topicRevision.trim() : "";
      if (
        !isStudent ||
        user.uid !== project.studentId ||
        project.topicStatus !== "declined" ||
        revisedTopic.length < 8 ||
        revisedTopic.length > 300
      ) {
        return NextResponse.json(
          {
            error:
              "Only the project lead can resubmit a declined topic (8–300 characters).",
          },
          { status: 400 },
        );
      }
      batch.set(
        projectRef,
        {
          title: revisedTopic,
          topicStatus: "pending",
          topicDecisionNote: "",
          milestoneReason: "Revised topic awaiting supervisor review.",
          updatedAt: FieldValue.serverTimestamp(),
          lastActivityAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      const notice = db
        .collection(`users/${project.supervisorId}/notifications`)
        .doc();
      batch.set(notice, {
        kind: "project",
        title: `Revised topic submitted: ${revisedTopic}`,
        href: `/supervisor/projects/${params.projectId}`,
        actorName: user.name ?? "Project lead",
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
      const event = db
        .collection(`projects/${params.projectId}/activity`)
        .doc();
      batch.set(event, {
        kind: "topic",
        title: "Revised topic submitted",
        actorId: user.uid,
        actorName: user.name ?? "Project lead",
        note: revisedTopic,
        createdAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ status: "ok", topicStatus: "pending" });
    }

    if ("topicStatus" in body) {
      const value = body.topicStatus;
      if (
        !isSupervisor ||
        !["pending", "approved", "declined"].includes(String(value))
      ) {
        return NextResponse.json(
          { error: "Only the assigned supervisor can decide a project topic." },
          { status: 403 },
        );
      }
      const note =
        typeof body.topicDecisionNote === "string"
          ? body.topicDecisionNote.trim().slice(0, 2000)
          : "";
      batch.set(
        projectRef,
        {
          topicStatus: value,
          topicDecisionNote: note,
          milestoneReason:
            value === "approved"
              ? "Topic approved. Chapter work may begin."
              : value === "declined"
                ? "Topic declined. Review the supervisor's feedback."
                : "Topic awaiting supervisor review.",
          updatedAt: FieldValue.serverTimestamp(),
          lastActivityAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      notifyMembers(
        `Project topic ${value}: ${project.title}`,
        user.name ?? "Your supervisor",
      );
      const event = db
        .collection(`projects/${params.projectId}/activity`)
        .doc();
      batch.set(event, {
        kind: "topic",
        title: `Topic ${value}`,
        actorId: user.uid,
        actorName: user.name ?? "Supervisor",
        note,
        createdAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ status: "ok", topicStatus: value });
    }

    if ("partners" in body) {
      if (!isStudent || user.uid !== project.studentId) {
        return NextResponse.json({ error: "Only the project lead can manage partners." }, { status: 403 });
      }
      if (project.finalApproved || project.status === "archived") {
        return NextResponse.json({ error: "This project is closed to membership changes." }, { status: 409 });
      }
      const operation = body.partners as { addPartner?: unknown; removePartner?: unknown } | null;
      const adding = typeof operation?.addPartner === "string";
      const removing = typeof operation?.removePartner === "string";
      const raw = adding ? operation?.addPartner : operation?.removePartner;
      if (adding === removing || typeof raw !== "string" || (adding && !isMatricNumber(raw))) {
        return NextResponse.json({ error: "Enter a valid partner matriculation number." }, { status: 400 });
      }
      const matric = adding ? normalizeMatricNumber(raw) : "";
      const partnerId = adding
        ? (await tx.get(db.doc(`matric_index/${matric.replaceAll("/", "_")}`))).get("uid")
        : members.find((id) => id === raw);
      if (typeof partnerId !== "string" || partnerId === project.studentId) {
        return NextResponse.json({ error: "Choose a registered partner other than the project lead." }, { status: 400 });
      }
      const memberIds = [project.studentId, ...members.filter((id) => id !== project.studentId)];
      const partnerRef = db.doc(`users/${partnerId}`);
      const partner = await tx.get(partnerRef);
      const existing = memberIds.includes(partnerId);
      if (adding && existing) return NextResponse.json({ status: "ok" });
      if (adding && (memberIds.length >= 5 || partner.get("role") !== "student" ||
          partner.get("department") !== project.department || partner.get("projectId"))) {
        return NextResponse.json({ error: "A project can have four unassigned student partners from your department." }, { status: 409 });
      }
      const nextPartners = adding ? [...memberIds.slice(1), partnerId] : memberIds.slice(1).filter((id) => id !== partnerId);
      const profiles = await Promise.all(nextPartners.map((id) => tx.get(db.doc(`users/${id}`))));
      batch.set(projectRef, {
        memberIds: [project.studentId, ...nextPartners],
        memberNames: [project.studentName, ...profiles.map((p) => p.get("displayName") ?? "Student")],
        memberMatricNumbers: [project.studentMatricNumber ?? project.memberMatricNumbers?.[0] ?? "", ...profiles.map((p) => p.get("matricNumber") ?? "")],
        updatedAt: FieldValue.serverTimestamp(),
        lastActivityAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      if (adding || partner.get("projectId") === project.id) {
        batch.set(partnerRef, { projectId: adding ? project.id : null }, { merge: true });
      }
      const title = adding ? "Project partner added" : "Project partner removed";
      batch.set(db.collection(`projects/${params.projectId}/activity`).doc(), {
        kind: "membership", title, actorId: user.uid, actorName: user.name ?? "Project lead",
        note: partner.get("displayName") ?? partner.get("matricNumber") ?? "Student", createdAt: FieldValue.serverTimestamp(),
      });
      batch.set(db.collection(`users/${partnerId}/notifications`).doc(), {
        kind: "project", title, href: adding ? `/student/project/${project.id}` : "/student/dashboard",
        actorName: user.name ?? "Project lead", read: false, createdAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ status: "ok" });
    }

    if ("stageDeadline" in body) {
      const input = body.stageDeadline as { stage?: unknown; date?: unknown } | null;
      if (!isSupervisor) return NextResponse.json({ error: "Only the assigned supervisor can set deadlines." }, { status: 403 });
      if (!input || !isProjectStage(input.stage) || (input.date !== null && !isCalendarDate(input.date))) {
        return NextResponse.json({ error: "Choose a stage and enter a valid deadline." }, { status: 400 });
      }
      if (project.finalApproved || (project.extensionStatus === "pending" && project.extensionStage === input.stage)) {
        return NextResponse.json({ error: "This deadline cannot be changed while an extension is pending or after final approval." }, { status: 409 });
      }
      const label = stageLabel(input.stage);
      batch.set(projectRef, {
        stageDeadlines: { [input.stage]: input.date },
        updatedAt: FieldValue.serverTimestamp(),
        lastActivityAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      const title = input.date ? `${label} deadline set for ${input.date}` : `${label} deadline cleared`;
      notifyMembers(title, user.name ?? "Supervisor");
      batch.set(db.collection(`projects/${params.projectId}/activity`).doc(), {
        kind: "deadline", title, actorId: user.uid, actorName: user.name ?? "Supervisor",
        createdAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ status: "ok" });
    }

    if ("extensionRequestedUntil" in body) {
      const stage = body.extensionStage;
      const reason = typeof body.extensionReason === "string" ? body.extensionReason.trim() : "";
      const deadline = isProjectStage(stage) ? stageDeadline(project, stage) : null;
      if (!isStudent || !isProjectStage(stage) || !deadline || !reason || reason.length > 2000) {
        return NextResponse.json({ error: "Choose a stage with a supervisor-set deadline and provide a reason." }, { status: 400 });
      }
      const proposedDate =
        typeof body.extensionRequestedUntil === "string"
          ? new Date(`${body.extensionRequestedUntil}T00:00:00.000Z`)
          : new Date(NaN);
      const currentDeadline = new Date(`${deadline}T00:00:00.000Z`);
      const validDate =
        typeof body.extensionRequestedUntil === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(body.extensionRequestedUntil) &&
        !Number.isNaN(proposedDate.getTime()) &&
        proposedDate.toISOString().slice(0, 10) ===
          body.extensionRequestedUntil &&
        proposedDate > currentDeadline &&
        proposedDate > new Date(new Date().toISOString().slice(0, 10)) &&
        proposedDate.getTime() <= Date.now() + 180 * 86_400_000;
      if (!isStudent || !validDate) {
        return NextResponse.json(
          { error: "Enter a valid requested extension date." },
          { status: 400 },
        );
      }
      if (project.extensionStatus === "pending")
        return NextResponse.json(
          { error: "An extension request is already pending." },
          { status: 409 },
        );
      batch.set(
        projectRef,
        {
          extensionStatus: "pending",
          extensionStage: stage,
          extensionReason: reason,
          extensionDecisionNote: "",
          extensionRequestedUntil: body.extensionRequestedUntil,
          updatedAt: FieldValue.serverTimestamp(),
          lastActivityAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      const notice = db
        .collection(`users/${project.supervisorId}/notifications`)
        .doc();
      batch.set(notice, {
        kind: "project",
        title: `Extension requested for ${project.title}`,
        href: `/supervisor/projects/${params.projectId}`,
        actorName: user.name ?? "Project student",
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
      const event = db
        .collection(`projects/${params.projectId}/activity`)
        .doc();
      batch.set(event, {
        kind: "extension",
        title: `${stageLabel(stage)} deadline extension requested`,
        note: reason,
        actorId: user.uid,
        actorName: user.name ?? "Student",
        date: body.extensionRequestedUntil,
        createdAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ status: "ok", extensionStatus: "pending" });
    }

    if ("extensionStatus" in body) {
      if (
        !isSupervisor ||
        !["approved", "declined"].includes(String(body.extensionStatus)) ||
        project.extensionStatus !== "pending"
      ) {
        return NextResponse.json(
          { error: "There is no pending extension request to decide." },
          { status: 400 },
        );
      }
      const note =
        typeof body.extensionDecisionNote === "string"
          ? body.extensionDecisionNote.trim().slice(0, 2000)
          : "";
      const decision = body.extensionStatus as "approved" | "declined";
      batch.set(
        projectRef,
        {
          extensionStatus: decision,
          extensionDecisionNote: note,
          ...(decision === "approved"
            ? (project.extensionStage
                ? { stageDeadlines: { [project.extensionStage]: project.extensionRequestedUntil } }
                : { nextDeadline: project.extensionRequestedUntil })
            : {}),
          updatedAt: FieldValue.serverTimestamp(),
          lastActivityAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      notifyMembers(
        `Deadline extension ${decision} for ${project.title}`,
        user.name ?? "Your supervisor",
      );
      const event = db
        .collection(`projects/${params.projectId}/activity`)
        .doc();
      batch.set(event, {
        kind: "extension",
        title: `Deadline extension ${decision}`,
        actorId: user.uid,
        actorName: user.name ?? "Supervisor",
        note,
        createdAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ status: "ok", extensionStatus: decision });
    }

    const patch: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (isSupervisor) {
      if ("proposalDate" in body) {
        if (body.proposalDate !== null && !isCalendarDate(body.proposalDate))
          return NextResponse.json({ error: "Enter a valid proposal date." }, { status: 400 });
        patch.proposalDate = body.proposalDate;
      }
      if ("defenseDate" in body)
        patch.defenseDate = (body.defenseDate as string) || null;
      if ("nextDeadline" in body)
        patch.nextDeadline = (body.nextDeadline as string) || null;
      if ("status" in body) {
        if (!["active", "archived"].includes(String(body.status)))
          return NextResponse.json(
            {
              error:
                "Final approval must be granted through the submission review workspace.",
            },
            { status: 400 },
          );
        patch.status = body.status;
      }
    }
    if (isStudent) {
      if (typeof body.abstract === "string" && body.abstract.trim()) {
        patch.abstract = body.abstract.trim();
      }
    }
    if (Object.keys(patch).length === 1) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    batch.set(projectRef, patch, { merge: true });

    const before = project.milestoneStatus;
    const verdict = await applyMilestone(batch, projectRef, {
      ...project,
      defenseDate: (patch.defenseDate as string | null) ?? project.defenseDate,
    });
    if (before !== verdict.status) {
      const delta =
        (verdict.status !== "on_track" ? 1 : 0) -
        (before !== "on_track" ? 1 : 0);
      batch.set(
        db.doc(`dashboard_stats/${project.supervisorId}`),
        {
          overdueCount: FieldValue.increment(delta),
          byMilestoneStatus: {
            [before]: FieldValue.increment(-1),
            [verdict.status]: FieldValue.increment(1),
          },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    return NextResponse.json({ status: "ok", milestone: verdict });
  });
}
