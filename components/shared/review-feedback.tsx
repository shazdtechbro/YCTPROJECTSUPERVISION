import type { SubmissionDoc } from "@/lib/types";
import { formatDate } from "@/lib/format";
export function ReviewFeedback({ submission: s }: { submission: SubmissionDoc }) {
  if (!s.reviewFeedback && !s.revisionDueDate && !(s.kind === "final" && s.grade != null)) return <p className="text-sm text-muted-foreground">No supervisor feedback yet.</p>;
  return <section className="space-y-2 rounded-md bg-secondary/50 p-3 text-sm" aria-label="Supervisor feedback">
    <h3 className="font-semibold">Supervisor feedback</h3>
    {s.reviewFeedback && <p className="whitespace-pre-wrap break-words">{s.reviewFeedback}</p>}
    {s.revisionDueDate && <p>Revision due: {formatDate(s.revisionDueDate)}</p>}
    {s.kind === "final" && s.grade != null && <p className="font-semibold">Final grade: {s.grade}/100</p>}
    {s.reviewedAt && <p className="text-xs text-muted-foreground">Reviewed {formatDate(s.reviewedAt)}</p>}
  </section>;
}
