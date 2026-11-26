"use client";

import { useId, useState } from "react";
import { MessagesSquare } from "lucide-react";

import { getSubmissionsPage } from "@/lib/firestore";
import { PROJECT_STAGES, stageLabel, type ProjectStage } from "@/lib/project-stages";
import { useAsyncData } from "@/hooks/use-async-data";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { SubmissionDoc } from "@/lib/types";
import { QueryState } from "./query-state";
import { EmptyState } from "./empty-state";
import { ReviewFeedback } from "./review-feedback";
import { CommentThread } from "./comment-thread";

type FeedbackStage = ProjectStage | "final" | "other";

function submissionStage(submission: SubmissionDoc): FeedbackStage {
  if (submission.kind === "proposal" || submission.kind === "final") {
    return submission.kind;
  }
  return PROJECT_STAGES[submission.chapterNumber ?? -1] ?? "other";
}

export function FeedbackPanel({ projectId }: { projectId: string }) {
  const subs = useAsyncData<SubmissionDoc[]>(async () => {
    const items: SubmissionDoc[] = [];
    let page = await getSubmissionsPage(projectId, { pageSize: 50 });
    items.push(...page.items);
    while (page.hasMore) {
      page = await getSubmissionsPage(projectId, { pageSize: 50, cursor: page.cursor });
      items.push(...page.items);
    }
    return items;
  }, [projectId]);
  const stageId = useId();
  const versionId = useId();
  const [selectedStage, setSelectedStage] = useState<FeedbackStage | null>(null);
  const [selectedVersion, setSelectedVersion] = useState("");
  const stages: FeedbackStage[] = [...PROJECT_STAGES, "final"];
  if (subs.data?.some((submission) => submissionStage(submission) === "other")) {
    stages.push("other");
  }
  const stage = selectedStage ?? (subs.data?.[0] ? submissionStage(subs.data[0]) : "proposal");
  const versions = (subs.data ?? []).filter((submission) => submissionStage(submission) === stage);
  const selected = versions.find((submission) => submission.id === selectedVersion) ?? versions[0];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Choose a project stage to read the supervisor’s feedback or leave a comment on an uploaded file.</p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 space-y-1.5 sm:max-w-sm">
          <Label htmlFor={stageId}>Project stage</Label>
          <select
            id={stageId}
            className="min-h-11 w-full rounded-xl border bg-card px-3"
            value={stage}
            onChange={(event) => {
              setSelectedStage(event.target.value as FeedbackStage);
              setSelectedVersion("");
            }}
          >
            {stages.map((item) => (
              <option key={item} value={item}>
                {item === "final" ? "Final submission" : item === "other" ? "Other documents" : stageLabel(item)}
              </option>
            ))}
          </select>
        </div>
        <Button size="sm" variant="outline" onClick={subs.retry}>Refresh feedback</Button>
      </div>
      <QueryState
        phase={subs.phase === "ready" && !selected ? "empty" : subs.phase}
        error={subs.error}
        onRetry={subs.retry}
        skeleton={<Skeleton className="h-40 rounded-lg" />}
        empty={
          <EmptyState
            icon={MessagesSquare}
            title="No submission for this stage yet"
            description="Comments and review feedback become available after a document is uploaded."
          />
        }
      >
        {selected && (
          <div className="space-y-4 rounded-lg border bg-card p-4">
            {versions.length > 1 && (
              <div className="space-y-1.5">
                <Label htmlFor={versionId}>Submission version</Label>
                <select id={versionId} className="min-h-11 w-full rounded-xl border bg-card px-3 sm:max-w-sm" value={selected.id} onChange={(event) => setSelectedVersion(event.target.value)}>
                  {versions.map((submission) => (
                    <option key={submission.id} value={submission.id}>v{submission.version} · {submission.fileName}</option>
                  ))}
                </select>
              </div>
            )}
            <ReviewFeedback submission={selected} />
            <h3 className="text-sm font-semibold">Submission comments</h3>
            <CommentThread key={selected.id} projectId={projectId} submissionId={selected.id} />
          </div>
        )}
      </QueryState>
    </div>
  );
}
