import { NextResponse, type NextRequest } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase-admin";
import { defenceInstant, type DefenceSchedule } from "@/lib/defence-schedule";
import { loadDepartmentDefence } from "@/lib/server/department-defence";
import { computeMilestoneStatus } from "@/lib/milestone";
import { recomputeSupervisorStats } from "@/lib/server/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily (Vercel Cron, see vercel.json). Recomputes milestone status for every
 * active project from its denormalised fields, refreshes `ticketsLast30Days`,
 * writes changes, then heals each supervisor's `dashboard_stats`.
 *
 * Auth: Vercel Cron sends `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();
  const now = new Date();
  const cutoff = Timestamp.fromMillis(now.getTime() - 30 * 86_400_000);

  const projects = await db
    .collection("projects")
    .where("status", "in", ["active", "submitted"])
    .get();

  let changed = 0;
  const supervisors = new Set<string>();
  const schedules = new Map<string, DefenceSchedule | null>();

  for (const doc of projects.docs) {
    const p = doc.data();
    supervisors.add(p.supervisorId);

    const ticketsLast30Days = (
      await doc.ref.collection("tickets").where("createdAt", ">=", cutoff).count().get()
    ).data().count;

    if (!schedules.has(p.department)) schedules.set(p.department, await loadDepartmentDefence(p.department));
    const schedule = schedules.get(p.department);
    const verdict = computeMilestoneStatus({
      defenseDate: p.defenseDate ?? null,
      officialDefenceAt: schedule ? defenceInstant(schedule) : undefined,
      projectStartedAt: p.createdAt instanceof Timestamp ? p.createdAt.toDate() : null,
      chapterProgress: p.progressPct,
      lastSubmissionDate:
        p.lastSubmissionAt instanceof Timestamp ? p.lastSubmissionAt.toDate() : null,
      lastActivityDate:
        p.lastActivityAt instanceof Timestamp ? p.lastActivityAt.toDate() : null,
      ticketsLast30Days,
      finalApproved: Boolean(p.finalApproved),
      now,
    });

    const patch: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
    if (ticketsLast30Days !== p.ticketsLast30Days) patch.ticketsLast30Days = ticketsLast30Days;
    if (verdict.status !== p.milestoneStatus || verdict.reason !== p.milestoneReason) {
      patch.milestoneStatus = verdict.status;
      patch.milestoneReason = verdict.reason;
      changed += 1;
    }
    if (Object.keys(patch).length > 1) await doc.ref.set(patch, { merge: true });
  }

  await Promise.all(
    Array.from(supervisors).map((s) => recomputeSupervisorStats(s))
  );

  return NextResponse.json({
    status: "ok",
    scanned: projects.size,
    changed,
    supervisors: supervisors.size,
    ranAt: now.toISOString(),
  });
}
