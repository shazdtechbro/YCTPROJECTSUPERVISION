import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getSessionUser } from "@/lib/auth/session";
import { isDefenceSchedule } from "@/lib/defence-schedule";
import { departmentDefenceRef, loadDepartmentDefence } from "@/lib/server/department-defence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to view the defence date." }, { status: 401 });
  const schedule = await loadDepartmentDefence(user.department);
  return NextResponse.json({ schedule }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to set the defence date." }, { status: 401 });
  if (user.role !== "hod") return NextResponse.json({ error: "Only the HOD can set the official defence date." }, { status: 403 });
  const schedule: unknown = await req.json().catch(() => null);
  if (!isDefenceSchedule(schedule)) {
    return NextResponse.json({ error: "Enter a valid defence date and time." }, { status: 400 });
  }
  const { date, time } = schedule;
  await departmentDefenceRef(user.department).set({ date, time, updatedBy: user.uid, updatedAt: FieldValue.serverTimestamp() });
  return NextResponse.json({ schedule: { date, time } });
}
