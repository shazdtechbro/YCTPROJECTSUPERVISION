/**
 * Typed READ queries for `projects/{projectId}`. All writes go through
 * `/api/*` route handlers (server, admin) so `dashboard_stats` can be updated in
 * the same batch — see `lib/api/projects.ts`.
 */
import {
  collection,
  doc,
  getDoc,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { getUser } from "./users";
import { getDb } from "@/lib/firebase";
import type { MilestoneStatus, ProjectDoc, ProjectStatus } from "@/lib/types";
import { projectConverter } from "./converters";
import { fetchPage, type Page, type PageParams } from "./pagination";
import { paths } from "./paths";

const projectsCol = () =>
  collection(getDb(), paths.projects).withConverter(projectConverter);

export async function getProject(
  projectId: string,
): Promise<ProjectDoc | null> {
  const snap = await getDoc(
    doc(getDb(), paths.project(projectId)).withConverter(projectConverter),
  );
  return snap.exists() ? snap.data() : null;
}

/**
 * Supervisor project list, filtered by status.
 * Composite index: (supervisorId ==, status ==, lastActivityAt desc).
 */
export function getSupervisorProjectsPage(
  supervisorId: string,
  status: ProjectStatus,
  params?: PageParams,
): Promise<Page<ProjectDoc>> {
  const q = query(
    projectsCol(),
    where("supervisorId", "==", supervisorId),
    where("status", "==", status),
    orderBy("lastActivityAt", "desc"),
  );
  return fetchPage(q, params);
}

/**
 * HOD department-wide project list, optionally filtered by milestone health.
 * Composite index: (department ==, milestoneStatus ==, lastActivityAt desc).
 */
export function getDepartmentProjectsPage(
  department: string,
  milestoneStatus: MilestoneStatus | "all",
  params?: PageParams,
): Promise<Page<ProjectDoc>> {
  const q =
    milestoneStatus === "all"
      ? query(
          projectsCol(),
          where("department", "==", department),
          orderBy("lastActivityAt", "desc"),
        )
      : query(
          projectsCol(),
          where("department", "==", department),
          where("milestoneStatus", "==", milestoneStatus),
          orderBy("lastActivityAt", "desc"),
        );
  return fetchPage(q, params);
}

/** The project(s) owned by a student (normally exactly one). */
export async function getStudentProjectsPage(
  studentId: string,
  params?: PageParams,
): Promise<Page<ProjectDoc>> {
  const profile = await getUser(studentId);
  if (profile?.projectId) {
    const project = await getProject(profile.projectId);
    return { items: project ? [project] : [], hasMore: false, cursor: null };
  }
  const q = query(
    projectsCol(),
    where("studentId", "==", studentId),
    orderBy("lastActivityAt", "desc"),
  );
  return fetchPage(q, params);
}
