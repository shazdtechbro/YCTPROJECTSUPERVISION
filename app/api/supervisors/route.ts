import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getAdminDb } from "@/lib/firebase-admin";
export const runtime = "nodejs";
export async function GET() {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const result = await getAdminDb()
    .collection("users")
    .where("department", "==", user.department)
    .where("role", "==", "supervisor")
    .get();
  const supervisors = result.docs
    .map((doc) => ({
      id: doc.id,
      displayName: String(doc.get("displayName") ?? "Supervisor"),
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
  return NextResponse.json({ supervisors });
}
