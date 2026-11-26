"use client";

import { useState } from "react";
import { Check, Download, FileText, Loader2, RotateCcw } from "lucide-react";
import { EmptyNoSubmissions } from "@/components/illustrations";
import { toast } from "sonner";

import { getSubmissionsPage } from "@/lib/firestore";
import { usePaginatedQuery } from "@/hooks/use-paginated-query";
import { QueryState } from "./query-state";
import { EmptyState } from "./empty-state";
import { ListSkeleton } from "./skeletons";
import { StatusBadge } from "./status-badge";
import { UploadSubmissionDialog } from "./upload-submission-dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { getSubmissionDownloadUrl } from "@/lib/storage/submissions";
import { formatDate, formatFileSize } from "@/lib/format";
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
    [projectId, nonce]
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
            art={<EmptyNoSubmissions />}
            title="Nothing submitted yet"
            description={
              canUpload
                ? "Upload a proposal or chapter draft to start the review cycle."
                : "The student hasn't uploaded anything for review."
            }
          />
        }
      >
        <ul className="space-y-3">
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

  async function download() {
    setDownloading(true);
    try {
      const url = await getSubmissionDownloadUrl({
        projectId,
        storagePath: s.storagePath,
      });
      window.open(url, "_blank", "noopener");
    } catch (err) {
      toast.error("Couldn't open file", { description: (err as Error).message });
    } finally {
      setDownloading(false);
    }
  }

  async function setStatus(status: SubmissionStatus) {
    setSaving(true);
    try {
      await api.setSubmissionStatus(projectId, s.id, status);
      toast.success("Review updated");
      onChanged();
    } catch (err) {
      toast.error("Couldn't update", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="rounded-[20px] border border-line bg-white p-4 shadow-card">
      <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
        <FileText className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold">
          {s.title}{" "}
          <span className="font-mono text-xs font-medium text-ink-3">v{s.version}</span>
        </p>
        <p className="truncate text-xs text-ink-3">
          {s.fileName} · {formatFileSize(s.fileSize)} · {formatDate(s.createdAt)}
        </p>
      </div>
      <StatusBadge status={s.status} className="hidden sm:inline-flex" />
      <Button
        variant="outline"
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
      </div>
      <StatusBadge status={s.status} className="mt-3 sm:hidden" />
      {canReview && (
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-4 sm:flex sm:justify-end">
          {s.status !== "pending_review" && (
            <Button variant="ghost" className="col-span-2 sm:col-span-1" disabled={saving} onClick={() => setStatus("pending_review")}>
              <RotateCcw /> Mark as pending
            </Button>
          )}
          <Button variant="outline" disabled={saving || s.status === "changes_requested"} onClick={() => setStatus("changes_requested")}>
            Request changes
          </Button>
          <Button disabled={saving || s.status === "approved"} loading={saving} onClick={() => setStatus("approved")}>
            {!saving && <Check />} Approve
          </Button>
        </div>
      )}
    </li>
  );
}
