"use client";
import Link from "next/link";
import { useState } from "react";
import { FileText, Download, Eye, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { getSubmissionsPage } from "@/lib/firestore";
import { usePaginatedQuery } from "@/hooks/use-paginated-query";
import { QueryState } from "./query-state";
import { EmptyState } from "./empty-state";
import { ListSkeleton } from "./skeletons";
import { StatusBadge } from "./status-badge";
import { UploadSubmissionDialog } from "./upload-submission-dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { formatDate, formatFileSize } from "@/lib/format";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CommentThread } from "./comment-thread";
import { ReviewFeedback } from "./review-feedback";
import type { SubmissionDoc, SubmissionStatus } from "@/lib/types";
export function SubmissionList({
  projectId,
  canUpload = false,
  canReview = false,
  projectTopic,
  chapterWorkAllowed = true,
  allChaptersApproved = false,
  onProjectChanged,
}: {
  projectId: string;
  projectTopic: string;
  chapterWorkAllowed?: boolean;
  allChaptersApproved?: boolean;
  onProjectChanged?: () => void;
  canUpload?: boolean;
  canReview?: boolean;
}) {
  const [nonce, setNonce] = useState(0);
  const query = usePaginatedQuery(
    (params) => getSubmissionsPage(projectId, params),
    [projectId, nonce],
  );
  const refresh = () => { setNonce((n) => n + 1); onProjectChanged?.(); };

  return (
    <div className="space-y-3">
      {canUpload && (
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border bg-card p-4">
          <div className="max-w-prose space-y-1">
            <h3 className="text-sm font-semibold">What you can upload</h3>
            <p className="text-sm text-muted-foreground">
              {!chapterWorkAllowed
                ? "You can upload your proposal. Ask your supervisor to approve your project topic to unlock chapter uploads."
                : allChaptersApproved
                  ? "All five chapters are approved. You can upload your final project for review."
                  : "You can upload a proposal, chapter draft, or revision. Your supervisor must approve all five chapters before you can upload the final project."}
            </p>
          </div>
          <UploadSubmissionDialog projectId={projectId} projectTopic={projectTopic} initialKind={chapterWorkAllowed ? "chapter" : "proposal"} chapterWorkAllowed={chapterWorkAllowed} finalUploadAllowed={allChaptersApproved} onCreated={refresh} />
        </div>
      )}
      <QueryState
        phase={query.phase}
        error={query.error}
        onRetry={query.retry}
        skeleton={<ListSkeleton rows={4} />}
        empty={
          <EmptyState
            icon={FileText}
            title="Nothing submitted yet"
            description={
              canUpload
                ? "Upload a proposal or chapter draft to start the review cycle."
                : "The student hasn't uploaded anything for review."
            }
          />
        }
      >
        <ul className="divide-y rounded-lg border">
          {Object.values(query.items.reduce<Record<string, SubmissionDoc[]>>((groups, submission) => {
            const key = submission.chapterNumber ? `chapter-${submission.chapterNumber}` : submission.kind;
            (groups[key] ??= []).push(submission);
            return groups;
          }, {})).map(versions => (
            <SubmissionRow key={versions[0].id} projectId={projectId} projectTopic={projectTopic}
              submission={versions[0]} versions={versions} canReview={canReview} canUpload={canUpload && (chapterWorkAllowed || versions[0].kind === "proposal")}
              allChaptersApproved={allChaptersApproved} chapterWorkAllowed={chapterWorkAllowed} onChanged={refresh} />
          ))}
        </ul>
        {query.hasMore && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={query.loadMore}
              disabled={query.loadingMore}
            >
              {query.loadingMore ? "Loading…" : "Load more"}
            </Button>
          </div>
        )}
      </QueryState>
    </div>
  );
}

export function SubmissionRow({ projectId, projectTopic, submission: s, versions, canReview, canUpload, allChaptersApproved, chapterWorkAllowed = true, onChanged }: {
  projectId: string; projectTopic: string; submission: SubmissionDoc; versions: SubmissionDoc[];
  canReview: boolean; canUpload: boolean; allChaptersApproved: boolean; chapterWorkAllowed?: boolean; onChanged: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [discussionOpen, setDiscussionOpen] = useState(false);
  const [status, setStatus] = useState(s.status === "pending_review" ? "" : s.status);
  const [grade, setGrade] = useState(s.grade == null ? "" : String(s.grade));
  const [feedback, setFeedback] = useState(s.reviewFeedback ?? "");
  const [revisionDueDate, setRevisionDueDate] = useState(s.revisionDueDate ?? "");
  const canGrade = s.kind === "final" && allChaptersApproved;
  async function save() {
    if (!status) return;
    setSaving(true);
    try {
      await api.setSubmissionStatus(projectId, s.id, status as SubmissionStatus, {
        feedback, revisionDueDate: revisionDueDate || null,
        ...(canGrade ? { grade: grade === "" ? null : Number(grade) } : {}),
      });
      toast.success("Review saved"); onChanged();
    } catch (err) { toast.error("Could not save review", { description: (err as Error).message }); }
    finally { setSaving(false); }
  }
  const category = s.chapterNumber ? `Chapter ${s.chapterNumber}` : s.kind === "final" ? "Final project" : s.kind === "proposal" ? "Proposal" : "Document";
  return <li className="min-w-0 space-y-3 p-4">
    <div className="flex flex-wrap items-center gap-3">
      <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{projectTopic}</p>
        <p className="text-xs text-muted-foreground">{category} · v{s.version} · {formatDate(s.createdAt)}</p>
        <p className="break-all text-xs text-muted-foreground">{s.fileName} · {formatFileSize(s.fileSize)}</p>
      </div><StatusBadge status={s.status} />
      {canUpload && s.status === "changes_requested" && <UploadSubmissionDialog projectId={projectId} projectTopic={projectTopic}
        initialKind={s.chapterNumber ? "revision" : s.kind} initialChapter={s.chapterNumber ?? 1} finalUploadAllowed={allChaptersApproved} chapterWorkAllowed={chapterWorkAllowed} triggerLabel="Upload revision" onCreated={onChanged} />}
    </div>
    {s.status === "pending_review" && (
      <p className="text-sm text-muted-foreground">
        {canReview ? "This file is waiting for your decision. Open Review and feedback to approve it or request changes." : "The assigned supervisor needs to review this file. Check Feedback for their decision."}
      </p>
    )}
    {canUpload && s.status === "changes_requested" && (
      <p className="text-sm text-muted-foreground">Read your supervisor’s feedback, make the requested changes, then select Upload revision.</p>
    )}
    <div className="flex flex-wrap gap-2">
      {/\.pdf$/i.test(s.fileName) ? (
        <Button asChild size="sm"><Link href={`/documents/${projectId}/${s.id}`}><Eye /> Open PDF review</Link></Button>
      ) : (
        <Button asChild variant="outline" size="sm"><a href={`/api/projects/${projectId}/submissions/${s.id}/file?download=1`}><Download /> Download this version</a></Button>
      )}
    </div>
    <details className="rounded-md border p-3"><summary className="cursor-pointer text-sm font-semibold text-primary underline underline-offset-4">Files and version history ({versions.length})</summary>
      <p className="mt-2 text-xs text-muted-foreground">Choose the document version you want to view or download. Load more submissions below to include older history.</p>
      <ul className="mt-2 space-y-3">{versions.map(version => {
        const href = `/api/projects/${encodeURIComponent(projectId)}/submissions/${encodeURIComponent(version.id)}/file`;
        return <li key={version.id} className="min-w-0 border-t pt-2 text-sm">
          <p className="break-all">v{version.version} · {version.fileName}</p><p className="text-xs text-muted-foreground">{formatDate(version.createdAt)}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            {/\.pdf$/i.test(version.fileName) ? (
              <Link href={`/documents/${projectId}/${version.id}`} className="inline-flex items-center gap-1 font-medium text-primary underline"><Eye className="h-4 w-4" />Review PDF version {version.version}</Link>
            ) : (
              <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline"><Eye className="h-4 w-4" />View file</a>
            )}
            <a href={`${href}?download=1`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline"><Download className="h-4 w-4" />Download</a>
          </div>
        </li>;
      })}</ul>
    </details>
    {!canReview && <ReviewFeedback submission={s} />}
    {canReview && <details className="rounded-md border bg-background p-3">
      <summary className="cursor-pointer text-sm font-medium">{canGrade ? "Final review and grading" : "Review and feedback"}</summary>
      <div className="mt-3 space-y-3">
        <p className="text-sm text-muted-foreground">Read the file, add any feedback, then choose and save your decision. The student will see it with this submission.</p>
        {s.kind === "final" && !canGrade && <p className="text-sm text-muted-foreground">Approve all five chapters before giving a final grade.</p>}
        <div className="space-y-1.5"><Label htmlFor={`feedback-${s.id}`}>Comment / feedback</Label>
          <Textarea id={`feedback-${s.id}`} value={feedback} onChange={e => setFeedback(e.target.value)} rows={3} maxLength={5000} placeholder="Comments and requested changes for the student" />
        </div>
        <div className="space-y-1.5"><Label htmlFor={`date-${s.id}`}>Revision due date (optional)</Label>
          <Input id={`date-${s.id}`} type="date" value={revisionDueDate} onChange={e => setRevisionDueDate(e.target.value)} />
        </div>
        {canGrade && <div className="space-y-1.5"><Label htmlFor={`grade-${s.id}`}>Final grade (0–100)</Label>
          <Input id={`grade-${s.id}`} type="number" min="0" max="100" value={grade} onChange={e => setGrade(e.target.value)} placeholder="Optional" />
        </div>}
        <div className="space-y-1.5"><Label htmlFor={`decision-${s.id}`}>Review decision</Label>
          <Select value={status} onValueChange={setStatus} disabled={saving}>
            <SelectTrigger id={`decision-${s.id}`}><SelectValue placeholder="Choose changes requested or approved" /></SelectTrigger>
            <SelectContent><SelectItem value="changes_requested">Changes requested</SelectItem><SelectItem value="approved">Approved</SelectItem></SelectContent>
          </Select>
        </div>
        <Button size="sm" loading={saving} disabled={!status || (canGrade && grade !== "" && (!Number.isFinite(Number(grade)) || Number(grade) < 0 || Number(grade) > 100))} onClick={save}>Save review</Button>
      </div>
    </details>}
    <Button type="button" variant="outline" size="sm" aria-expanded={discussionOpen} onClick={() => setDiscussionOpen(!discussionOpen)}>
      <MessageSquare /> {discussionOpen ? "Hide comments" : "Add or view comments"}
    </Button>
    {discussionOpen && <section className="rounded-lg border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold">Submission comments</h3>
      <CommentThread projectId={projectId} submissionId={s.id} />
    </section>}
  </li>;
}
