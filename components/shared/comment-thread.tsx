"use client";

import { useEffect, useRef, useState } from "react";
import { onSnapshot, collection, orderBy, query } from "firebase/firestore";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { getDb } from "@/lib/firebase";
import { commentConverter } from "@/lib/firestore/converters";
import { paths } from "@/lib/firestore/paths";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth/auth-context";
import { formatRelativeTime } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/constants";
import type { CommentDoc } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "./error-state";
import { EmptyState } from "./empty-state";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Live comment thread for one submission + composer. The single onSnapshot for
 * this view is unsubscribed on unmount / when the submission changes.
 */
export function CommentThread({
  projectId,
  submissionId,
  className,
}: {
  projectId: string;
  submissionId: string;
  className?: string;
}) {
  const { user } = useAuth();
  const [items, setItems] = useState<CommentDoc[]>([]);
  const [phase, setPhase] = useState<"loading" | "error" | "ready">("loading");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPhase("loading");
    const q = query(
      collection(
        getDb(),
        paths.comments(projectId, submissionId)
      ).withConverter(commentConverter),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => d.data()));
        setPhase("ready");
      },
      () => setPhase("error")
    );
    return () => unsub();
  }, [projectId, submissionId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [items.length]);

  async function send() {
    if (!draft.trim() || sending) return;
    setSending(true);
    try {
      await api.postComment(projectId, submissionId, draft.trim());
      setDraft("");
    } catch (err) {
      toast.error("Couldn't post comment", {
        description: (err as Error).message,
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="min-h-[120px] flex-1 space-y-4">
        {phase === "loading" && (
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        )}
        {phase === "error" && (
          <ErrorState className="min-h-[120px]" description="Couldn't load this thread." />
        )}
        {phase === "ready" && items.length === 0 && (
          <EmptyState
            icon={MessageSquare}
            className="min-h-[120px] border-0 bg-transparent p-4"
            title="No comments yet"
            description="Start the discussion on this submission."
          />
        )}
        {phase === "ready" &&
          items.map((c) => {
            const mine = c.authorId === user?.uid;
            return (
              <div key={c.id} className="flex gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs">
                    {c.authorName
                      .split(/\s+/)
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold">
                      {mine ? "You" : c.authorName}
                    </span>
                    <span className="text-xs text-ink-3">
                      {ROLE_LABELS[c.authorRole]} ·{" "}
                      {formatRelativeTime(c.createdAt)}
                    </span>
                  </div>
                  <p className={cn("mt-1 whitespace-pre-wrap rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-[15px]", mine ? "bg-brand-50 text-ink" : "bg-cream-2 text-ink")}>
                    {c.body}
                  </p>
                </div>
              </div>
            );
          })}
        <div ref={endRef} />
      </div>

      <form
        className="sticky bottom-[76px] mt-4 flex items-end gap-2 border-t border-line bg-card pt-4 lg:bottom-0"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Write a comment"
          className="min-h-[48px] flex-1 resize-none"
          rows={1}
        />
        <Button type="submit" size="icon" aria-label="Send comment" loading={sending} disabled={!draft.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
