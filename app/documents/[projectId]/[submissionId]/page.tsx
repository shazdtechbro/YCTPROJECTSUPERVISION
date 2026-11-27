import Link from "next/link";
import { notFound } from "next/navigation";

import { PdfReview } from "@/components/shared/pdf-review";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth/session";
import { getAdminDb } from "@/lib/firebase-admin";
import { projectHref } from "@/lib/routes";
import { canReadProject } from "@/lib/server/project-access";

export default async function DocumentPage({ params }: { params: { projectId: string; submissionId: string } }) {
  const user = await requireSession();
  const { projectId, submissionId } = params;
  if (!(await canReadProject(user, projectId))) notFound();
  const folder = getAdminDb().collection(`projects/${projectId}/submissions`);
  const selected = await folder.doc(submissionId).get();
  const data = selected.data();
  if (!data || typeof data.fileName !== "string" || !/\.pdf$/i.test(data.fileName)) notFound();
  const history = await (data.chapterNumber
    ? folder.where("chapterNumber", "==", data.chapterNumber)
    : folder.where("kind", "==", data.kind)).get();
  const versions = history.docs.map((item) => ({
    id: item.id,
    fileName: String(item.get("fileName") ?? "Document"),
    version: Number(item.get("version") ?? 1),
  })).sort((a,b) => b.version - a.version);
  return (
    <main className="mx-auto max-w-[1440px] space-y-4 px-4 py-5 sm:px-8">
      <Button asChild variant="outline"><Link href={projectHref(user.role, projectId) + "?tab=submissions"}>Back to submissions</Link></Button>
      <PdfReview projectId={projectId} submissionId={submissionId} userId={user.uid} fileName={data.fileName} version={Number(data.version ?? 1)} versions={versions} />
    </main>
  );
}
