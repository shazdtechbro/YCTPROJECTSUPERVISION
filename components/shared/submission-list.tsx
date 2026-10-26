"use client";
import { useState } from "react";
import { FileText, Download, Eye } from "lucide-react";
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
        <div className="flex justify-end">
          <UploadSubmissionDialog projectId={projectId} projectTopic={projectTopic} initialKind={chapterWorkAllowed ? "chapter" : "proposal"} chapterWorkAllowed={chapterWorkAllowed} onCreated={refresh} />
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
              allChaptersApproved={allChaptersApproved} onChanged={refresh} />
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

export function SubmissionRow({ projectId, projectTopic, submission: s, versions, canReview, canUpload, allChaptersApproved, onChanged }: {
  projectId: string; projectTopic: string; submission: SubmissionDoc; versions: SubmissionDoc[];
  canReview: boolean; canUpload: boolean; allChaptersApproved: boolean; onChanged: () => void;
}) {
  const [saving, setSaving] = useState(false);
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
        initialKind={s.chapterNumber ? "revision" : s.kind} initialChapter={s.chapterNumber ?? 1} triggerLabel="Upload revision" onCreated={onChanged} />}
    </div>
    <details className="rounded-md border p-3"><summary className="cursor-pointer text-sm font-medium">Files and version history ({versions.length})</summary>
      <p className="mt-2 text-xs text-muted-foreground">Choose the document version you want to view or download. Load more submissions below to include older history.</p>
      <ul className="mt-2 space-y-3">{versions.map(version => {
        const href = `/api/projects/${encodeURIComponent(projectId)}/submissions/${encodeURIComponent(version.id)}/file`;
        return <li key={version.id} className="min-w-0 border-t pt-2 text-sm">
          <p className="break-all">v{version.version} · {version.fileName}</p><p className="text-xs text-muted-foreground">{formatDate(version.createdAt)}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline"><Eye className="h-4 w-4" />View file</a>
            <a href={`${href}?download=1`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline"><Download className="h-4 w-4" />Download</a>
          </div>
        </li>;
      })}</ul>
    </details>
    {!canReview && <ReviewFeedback submission={s} />}
    {canReview && <details className="rounded-md border bg-background p-3">
      <summary className="cursor-pointer text-sm font-medium">{canGrade ? "Final review and grading" : "Review and feedback"}</summary>
      <div className="mt-3 space-y-3">
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
  </li>;
}
