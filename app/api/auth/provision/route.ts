import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { DEPARTMENTS } from "@/lib/constants";
import type { Role } from "@/lib/types";
import { isMatricNumber, normalizeMatricNumber } from "@/lib/matric";

export const runtime = "nodejs";

const ROLES: Role[] = ["student", "supervisor", "hod"];

/**
 * POST { idToken, role, department, displayName }
 *
 * One-time provisioning right after the client creates the Firebase account:
 *  - verify the ID token
 *  - refuse if the account is already provisioned (has a role claim or a
 *    users/{uid} doc) — prevents privilege re-assignment
 *  - set custom claims { role, department }
 *  - write users/{uid}
 *  - seed dashboard_stats/{uid} for supervisors
 *
 * The client then force-refreshes its token and calls /api/session.
 */
export async function POST(req: NextRequest) {
  let body: {
    idToken?: string;
    role?: string;
    department?: string;
    displayName?: string;
    matricNumber?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { idToken, role, department, displayName } = body;
  if (!idToken || !role || !department || !displayName) {
    return NextResponse.json(
      { error: "idToken, role, department and displayName are required" },
      { status: 400 },
    );
  }
  if (!ROLES.includes(role as Role)) {
    return NextResponse.json({ error: "Unknown role" }, { status: 400 });
  }
  if (!DEPARTMENTS.includes(department as (typeof DEPARTMENTS)[number])) {
    return NextResponse.json({ error: "Unknown department" }, { status: 400 });
  }
  if (displayName.trim().length < 2) {
    return NextResponse.json({ error: "Name is too short" }, { status: 400 });
  }

  const auth = getAdminAuth();
  let uid: string;
  let verifiedEmail: string | undefined;
  try {
    const decoded = await auth.verifyIdToken(idToken, true);
    uid = decoded.uid;
    verifiedEmail = decoded.email?.trim().toLowerCase();
    if (decoded.role) {
      return NextResponse.json(
        { error: "Account is already provisioned" },
        { status: 409 },
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid ID token" }, { status: 401 });
  }

  const matricNumber = body.matricNumber
    ? normalizeMatricNumber(body.matricNumber)
    : undefined;
  if (role === "student" && (!matricNumber || !isMatricNumber(matricNumber))) {
    return NextResponse.json(
      { error: "Enter a valid matric number, for example F/HD/24/3211001." },
      { status: 400 },
    );
  }
  if (role !== "student" && matricNumber) {
    return NextResponse.json(
      { error: "Staff accounts do not use student matric numbers." },
      { status: 400 },
    );
  }

  const db = getAdminDb();
  const userRef = db.doc(`users/${uid}`);
  if ((await userRef.get()).exists) {
    return NextResponse.json(
      { error: "Account is already provisioned" },
      { status: 409 },
    );
  }

  const matricRef = matricNumber
    ? db.doc(`matric_index/${matricNumber.replaceAll("/", "_")}`)
    : null;
  if (matricRef && (await matricRef.get()).exists) {
    return NextResponse.json(
      { error: "That matric number is already registered." },
      { status: 409 },
    );
  }

  const batch = db.batch();
  batch.create(userRef, {
    uid,
    displayName: displayName.trim(),
    email: (verifiedEmail ?? "").toLowerCase(),
    role,
    department,
    ...(matricNumber ? { matricNumber } : {}),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  if (matricRef && matricNumber) {
    batch.create(matricRef, {
      uid,
      matricNumber,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  if (role === "supervisor") {
    batch.set(db.doc(`dashboard_stats/${uid}`), {
      supervisorId: uid,
      supervisorName: displayName.trim(),
      department,
      activeProjects: 0,
      overdueCount: 0,
      pendingSubmissions: 0,
      openTickets: 0,
      avgResponseHours: null,
      byMilestoneStatus: { on_track: 0, behind: 0, stalled: 0 },
      lastActivityAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    // A concurrent signup may have claimed the same matric index. Do not leave
    // claims on a partially provisioned account.
    throw error;
  }
  await auth.setCustomUserClaims(uid, { role, department });

  return NextResponse.json({ status: "ok", uid, role });
}
