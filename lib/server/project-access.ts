import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";
import type { SessionUser } from "@/lib/auth/session";

interface ProjectAccessDoc {
  studentId: string;
  memberIds?: string[];
  supervisorId: string;
  department: string;
}

async function loadProject(
  projectId: string,
): Promise<ProjectAccessDoc | null> {
  const snap = await getAdminDb().doc(`projects/${projectId}`).get();
  if (!snap.exists) return null;
  const d = snap.data() as Partial<ProjectAccessDoc>;
  if (!d.studentId || !d.supervisorId || !d.department) return null;
  return {
    studentId: d.studentId,
    memberIds: d.memberIds,
    supervisorId: d.supervisorId,
    department: d.department,
  };
}

/** Mirrors firestore.rules `canReadProject`: student, assigned supervisor, or department HOD. */
export async function canReadProject(
  user: SessionUser,
  projectId: string,
): Promise<boolean> {
  const p = await loadProject(projectId);
  if (!p) return false;
  if (user.role === "student")
    return p.studentId === user.uid || !!p.memberIds?.includes(user.uid);
  if (user.role === "supervisor") return p.supervisorId === user.uid;
  if (user.role === "hod") return p.department === user.department;
  return false;
}

/** Only the project's own student may upload submission files. */
export async function canUploadSubmission(
  user: SessionUser,
  projectId: string,
): Promise<boolean> {
  if (user.role !== "student") return false;
  const p = await loadProject(projectId);
  return !!p && (p.studentId === user.uid || !!p.memberIds?.includes(user.uid));
}
