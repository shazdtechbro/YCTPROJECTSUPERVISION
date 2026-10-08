"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { getSubmissionsPage } from "@/lib/firestore";
import { usePaginatedQuery } from "@/hooks/use-paginated-query";
import { QueryState } from "./query-state";
import { EmptyState } from "./empty-state";
import { ListSkeleton } from "./skeletons";
import { StatusBadge } from "./status-badge";
import { UploadSubmissionDialog } from "./upload-submission-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { getSubmissionDownloadUrl } from "@/lib/storage/submissions";
import { formatDate, formatFileSize } from "@/lib/format";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SubmissionDoc, SubmissionStatus } from "@/lib/types";

export function SubmissionList({
  projectId,
  canUpload = false,
  canReview = false,
}: {
  projectId: string;
  canUpload?: boolean;
  canReview?: boolean;
}) {
  const [nonce, setNonce] = useState(0);
  const query = usePaginatedQuery(
    (params) => getSubmissionsPage(projectId, params),
    [projectId, nonce],
  );
  const refresh = () => setNonce((n) => n + 1);

  return (
    <div className="space-y-3">
      {canUpload && (
        <div className="flex justify-end">
          <UploadSubmissionDialog projectId={projectId} onCreated={refresh} />
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
          {query.items.map((s) => (
            <SubmissionRow
              key={s.id}
              projectId={projectId}
              submission={s}
              canReview={canReview}
              onChanged={refresh}
            />
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

function SubmissionRow({
  projectId,
  submission: s,
  canReview,
  onChanged,
}: {
  projectId: string;
  submission: SubmissionDoc;
  canReview: boolean;
  onChanged: () => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [grade, setGrade] = useState(s.grade == null ? "" : String(s.grade));
  const [feedback, setFeedback] = useState(s.reviewFeedback ?? "");

  async function download() {
    setDownloading(true);
    try {
      const url = await getSubmissionDownloadUrl({
        projectId,
        storagePath: s.storagePath,
      });
      window.open(url, "_blank", "noopener");
    } catch (err) {
      toast.error("Couldn't open file", {
        description: (err as Error).message,
      });
    } finally {
      setDownloading(false);
    }
  }

  async function setStatus(status: SubmissionStatus, withGrade = false) {
    setSaving(true);
    try {
      await api.setSubmissionStatus(
        projectId,
        s.id,
        status,
        withGrade
          ? { grade: grade === "" ? null : Number(grade), feedback }
          : undefined,
      );
      toast.success("Review updated");
      onChanged();
    } catch (err) {
      toast.error("Couldn't update", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="flex flex-wrap items-center gap-3 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
        <FileText className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {s.title}{" "}
          <span className="font-normal text-muted-foreground">
            v{s.version}
          </span>
        </p>
        <p className="truncate text-2xs text-muted-foreground">
          {s.fileName} · {formatFileSize(s.fileSize)} ·{" "}
          {formatDate(s.createdAt)}
          {s.chapterNumber ? ` · Chapter ${s.chapterNumber}` : ""}
        </p>
      </div>
      <StatusBadge status={s.status} />
      <Button
        variant="ghost"
        size="icon"
        onClick={download}
        disabled={downloading}
        aria-label="Download"
      >
        {downloading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </Button>
      {canReview && (
        <Select
          value={s.status}
          onValueChange={(v) => setStatus(v as SubmissionStatus, true)}
          disabled={saving}
        >
          <SelectTrigger className="h-8 w-[168px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending_review">Pending review</SelectItem>
            <SelectItem value="changes_requested">Changes requested</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
          </SelectContent>
        </Select>
      )}
      {!canReview && (s.grade != null || s.reviewFeedback) && (
        <div className="basis-full rounded-md bg-secondary/50 p-3 text-sm">
          {s.grade != null && (
            <p className="font-semibold">Grade: {s.grade}/100</p>
          )}
          {s.reviewFeedback && (
            <p className="mt-1 whitespace-pre-wrap break-words">
              {s.reviewFeedback}
            </p>
          )}
        </div>
      )}
      {canReview && (
        <details className="basis-full rounded-md border bg-background p-3">
          <summary className="cursor-pointer text-sm font-medium">
            Review and grading workspace
          </summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-[140px_1fr]">
            <div className="space-y-1.5">
              <Label htmlFor={`grade-${s.id}`}>Grade (0–100)</Label>
              <Input
                id={`grade-${s.id}`}
                type="number"
                min="0"
                max="100"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`feedback-${s.id}`}>Written feedback</Label>
              <Textarea
                id={`feedback-${s.id}`}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                placeholder="Provide clear, actionable comments for the student."
              />
            </div>
            <Button
              className="sm:col-start-2 sm:justify-self-end"
              size="sm"
              disabled={
                saving ||
                (grade !== "" && (Number(grade) < 0 || Number(grade) > 100))
              }
              onClick={() => setStatus(s.status, true)}
            >
              Save review
            </Button>
          </div>
        </details>
      )}
    </li>
  );
}
