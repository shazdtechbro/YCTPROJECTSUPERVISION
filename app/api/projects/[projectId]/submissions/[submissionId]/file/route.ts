import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { canReadProject } from "@/lib/server/project-access";
import { getAdminDb } from "@/lib/firebase-admin";
import { createSubmissionSignedUrl } from "@/lib/supabase-admin";
export const runtime = "nodejs";
/** Browser navigation avoids popup blocking after an asynchronous signing request. */
export async function GET(req: NextRequest, { params }: { params: { projectId: string; submissionId: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to access this document." }, { status: 401 });
  if (!(await canReadProject(user, params.projectId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const snap = await getAdminDb().doc(`projects/${params.projectId}/submissions/${params.submissionId}`).get();
  if (!snap.exists) return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  const sub = snap.data()!;
  if (typeof sub.storagePath !== "string" || !sub.storagePath.startsWith(`projects/${params.projectId}/submissions/`))
    return NextResponse.json({ error: "Invalid document path" }, { status: 400 });
  try {
    const url = await createSubmissionSignedUrl(sub.storagePath, 300, req.nextUrl.searchParams.get("download") === "1" ? sub.fileName : undefined);
    const response = NextResponse.redirect(url, 303);
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  } catch {
    return NextResponse.json({ error: "The document could not be opened. Please retry or contact your supervisor." }, { status: 502 });
  }
}
