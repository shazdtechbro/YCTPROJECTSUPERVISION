import { NextResponse, type NextRequest } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { isMatricNumber, normalizeMatricNumber } from "@/lib/matric";
export const runtime = "nodejs";
const invalid = () =>
  NextResponse.json(
    { error: "Matric number or password is incorrect." },
    { status: 401 },
  );
export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (
    typeof body?.matricNumber !== "string" ||
    !isMatricNumber(body.matricNumber) ||
    typeof body.password !== "string" ||
    !body.password ||
    body.password.length > 4096
  )
    return invalid();
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey)
    return NextResponse.json(
      { error: "Student login is not configured." },
      { status: 503 },
    );
  try {
    const db = getAdminDb();
    const index = await db
      .doc(
        `matric_index/${normalizeMatricNumber(body.matricNumber).replaceAll("/", "_")}`,
      )
      .get();
    if (!index.exists) return invalid();
    const profile = await db.doc(`users/${index.get("uid")}`).get();
    if (
      !profile.exists ||
      profile.get("role") !== "student" ||
      typeof profile.get("email") !== "string"
    )
      return invalid();
    // Firebase verifies the password and applies its credential-abuse protections.
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: profile.get("email"),
          password: body.password,
          returnSecureToken: true,
        }),
      },
    );
    if (!response.ok) return invalid();
    const result = await response.json();
    const auth = getAdminAuth();
    const verified = await auth.verifyIdToken(result.idToken, true);
    if (
      verified.uid !== profile.id ||
      verified.role !== "student" ||
      verified.department !== profile.get("department")
    )
      return invalid();
    return NextResponse.json(
      { customToken: await auth.createCustomToken(verified.uid) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return invalid();
  }
}
