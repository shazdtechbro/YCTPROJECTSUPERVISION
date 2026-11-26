import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getAdminDb } from "@/lib/firebase-admin";
import { canReadProject } from "@/lib/server/project-access";
export const runtime = "nodejs";
export async function GET(
  _req: Request,
  { params }: { params: { projectId: string } },
) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!(await canReadProject(user, params.projectId)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const result = await getAdminDb()
    .collection(`projects/${params.projectId}/activity`)
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();
  return NextResponse.json({
    events: result.docs.map((doc) => ({
      id: doc.id,
      kind: doc.get("kind"),
      title: doc.get("title"),
      actorName: doc.get("actorName") ?? "",
      note: doc.get("note") ?? "",
      createdAt: doc.get("createdAt")?.toDate?.().toISOString() ?? null,
    })),
  });
}
