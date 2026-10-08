import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getSessionUser } from "@/lib/auth/session";
import { getAdminDb } from "@/lib/firebase-admin";
import { isMatricNumber, normalizeMatricNumber } from "@/lib/matric";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "student")
    return NextResponse.json(
      { error: "Student access required" },
      { status: 403 },
    );
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (
    typeof body?.matricNumber !== "string" ||
    !isMatricNumber(body.matricNumber)
  )
    return NextResponse.json(
      { error: "Enter a valid matric number, e.g. F/HD/24/3211001." },
      { status: 400 },
    );
  const matricNumber = normalizeMatricNumber(body.matricNumber);
  const db = getAdminDb();
  try {
    await db.runTransaction(async (tx) => {
      const ref = db.doc(`users/${user.uid}`);
      const index = db.doc(`matric_index/${matricNumber.replaceAll("/", "_")}`);
      const profile = await tx.get(ref);
      const existing = await tx.get(index);
      if (!profile.exists || profile.get("role") !== "student")
        throw new Error("Student profile not found.");
      if (
        profile.get("matricNumber") &&
        profile.get("matricNumber") !== matricNumber
      )
        throw new Error(
          "Your matric number is already registered. Contact your department to correct it.",
        );
      if (existing.exists && existing.get("uid") !== user.uid)
        throw new Error("That matric number is already registered.");
      const projectRef = profile.get("projectId")
        ? db.doc(`projects/${profile.get("projectId")}`)
        : null;
      const project = projectRef ? await tx.get(projectRef) : null;
      tx.set(index, {
        uid: user.uid,
        matricNumber,
        createdAt: FieldValue.serverTimestamp(),
      });
      tx.update(ref, { matricNumber, updatedAt: FieldValue.serverTimestamp() });
      if (projectRef && project?.exists) {
        const memberIds = project.get("memberIds") as string[] | undefined;
        const memberMatricNumbers = memberIds?.map((id, i) =>
          id === user.uid
            ? matricNumber
            : (project.get("memberMatricNumbers")?.[i] ?? ""),
        );
        tx.update(projectRef, {
          ...(project.get("studentId") === user.uid
            ? { studentMatricNumber: matricNumber }
            : {}),
          ...(memberMatricNumbers ? { memberMatricNumbers } : {}),
        });
      }
    });
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 409 },
    );
  }
}
