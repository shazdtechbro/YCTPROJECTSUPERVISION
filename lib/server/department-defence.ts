import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";
import { isDefenceSchedule, type DefenceSchedule } from "@/lib/defence-schedule";

export function departmentDefenceRef(department: string) {
  return getAdminDb().doc(`department_defence/${encodeURIComponent(department)}`);
}

export async function loadDepartmentDefence(department: string): Promise<DefenceSchedule | null> {
  if (!department) return null;
  const saved = (await departmentDefenceRef(department).get()).data();
  return isDefenceSchedule(saved) ? { date: saved.date, time: saved.time } : null;
}
