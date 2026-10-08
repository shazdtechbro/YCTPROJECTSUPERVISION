import "server-only";

/**
 * Server-side session verification. The browser never makes trust decisions —
 * every protected server component / route handler calls one of these, and the
 * claims come from a verified Firebase session cookie, not from client state.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { DecodedIdToken } from "firebase-admin/auth";

import { getAdminAuth } from "@/lib/firebase-admin";
import type { AuthClaims, Role } from "@/lib/types";

export const SESSION_COOKIE = "__session";
/** 14 days, matching the cookie maxAge set in /api/session. */
export const SESSION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export interface SessionUser {
  uid: string;
  email: string | null;
  name: string | null;
  role: Role;
  department: string;
}

function toSessionUser(decoded: DecodedIdToken): SessionUser | null {
  const role = decoded.role as Role | undefined;
  const department = decoded.department as string | undefined;
  if (!role || !["student", "supervisor", "hod"].includes(role) || !department)
    return null;
  return {
    uid: decoded.uid,
    email: decoded.email ?? null,
    name: (decoded.name as string | undefined) ?? null,
    role,
    department,
  };
}

/** Returns the verified session user, or `null` if unauthenticated. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const decoded = await getAdminAuth().verifySessionCookie(token, true);
    return toSessionUser(decoded);
  } catch {
    return null;
  }
}

/** Guard: redirect to /login unless authenticated. */
export async function requireSession(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** Guard: redirect unless the user holds one of `roles`. */
export async function requireRole(roles: Role | Role[]): Promise<SessionUser> {
  const allowed = Array.isArray(roles) ? roles : [roles];
  const user = await requireSession();
  if (!allowed.includes(user.role)) redirect(homePathForRole(user.role));
  return user;
}

/** Where each role lands after login / from `/`. */
export function homePathForRole(role: Role): string {
  switch (role) {
    case "student":
      return "/student/dashboard";
    case "supervisor":
      return "/supervisor/dashboard";
    case "hod":
      return "/hod/dashboard";
  }
}

export type { AuthClaims };
