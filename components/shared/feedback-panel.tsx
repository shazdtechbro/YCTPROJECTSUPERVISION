"use client";

import { useEffect, useState } from "react";
import { MessagesSquare } from "lucide-react";

import { getSubmissionsPage } from "@/lib/firestore";
import { useAsyncData } from "@/hooks/use-async-data";
import { QueryState } from "./query-state";
import { EmptyState } from "./empty-state";
import { ReviewFeedback } from "./review-feedback";
import { Button } from "@/components/ui/button";
import { CommentThread } from "./comment-thread";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { SubmissionDoc } from "@/lib/types";

/** Pick a submission, read/continue its comment thread. Shared student/supervisor. */
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

  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    if (!selected && subs.data && subs.data.length > 0) {
      setSelected(subs.data[0].id);
    }
  }, [subs.data, selected]);

  return (
    <QueryState
      phase={subs.phase === "ready" && !subs.data?.length ? "empty" : subs.phase}
      error={subs.error}
      onRetry={subs.retry}
      skeleton={
        <div className="space-y-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-40 rounded-lg" />
        </div>
      }
      empty={
        <EmptyState
          icon={MessagesSquare}
          title="No submissions to discuss"
          description="Feedback threads open up once a submission is uploaded."
        />
      }
    >
      <div className="space-y-4">
        <Button size="sm" variant="outline" onClick={subs.retry}>Refresh feedback</Button>
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="w-full sm:w-80">
            <SelectValue placeholder="Choose a submission" />
          </SelectTrigger>
          <SelectContent>
            {(subs.data ?? []).map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.title} · v{s.version}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selected && (
          <div className="rounded-lg border p-4">
            {subs.data?.find(s => s.id === selected) && <ReviewFeedback submission={subs.data.find(s => s.id === selected)!} />}
            <h3 className="mb-3 mt-4 text-sm font-medium">Discussion</h3>
            <CommentThread
              key={selected}
              projectId={projectId}
              submissionId={selected}
            />
          </div>
        )}
      </div>
    </QueryState>
  );
}
