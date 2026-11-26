/** Typed query functions for `users/{uid}`. One export per query. */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { getDb } from "@/lib/firebase";
import type { Role, UserDoc } from "@/lib/types";
import { userConverter } from "./converters";
import { fetchPage, type Page, type PageParams } from "./pagination";
import { paths } from "./paths";

const usersCol = () =>
  collection(getDb(), paths.users).withConverter(userConverter);

export async function getUser(uid: string): Promise<UserDoc | null> {
  if (!uid) return null;
  const snap = await getDoc(
    doc(getDb(), paths.user(uid)).withConverter(userConverter)
  );
  return snap.exists() ? snap.data() : null;
}

/** A supervisor's student roster — indexed by `supervisorId`. */
export function getRosterPage(
  supervisorId: string,
  params?: PageParams
): Promise<Page<UserDoc>> {
  const q = query(
    usersCol(),
    where("role", "==", "student" satisfies Role),
    where("supervisorId", "==", supervisorId),
    orderBy("displayName")
  );
  return fetchPage(q, params);
}

/** Department-wide member list — HOD scope. */
export function getDepartmentUsersPage(
  department: string,
  params?: PageParams
): Promise<Page<UserDoc>> {
  const q = query(
    usersCol(),
    where("department", "==", department),
    orderBy("displayName")
  );
  return fetchPage(q, params);
}

/** All supervisors in a department — for the HOD assignment picker. */
export async function listDepartmentSupervisors(
  department: string
): Promise<UserDoc[]> {
  const q = query(
    usersCol(),
    where("department", "==", department),
    where("role", "==", "supervisor" satisfies Role),
    orderBy("displayName")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}
