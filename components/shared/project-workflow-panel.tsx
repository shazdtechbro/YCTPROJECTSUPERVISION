"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { CHAPTER_STAGES, type ProjectDoc, type Role } from "@/lib/types";

export function ProjectWorkflowPanel({
  project,
  role,
  onChanged,
}: {
  project: ProjectDoc;
  role: Role;
  onChanged: () => void;
}) {
  const [note, setNote] = useState("");
  const [extensionDate, setExtensionDate] = useState("");
  const [revisedTopic, setRevisedTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [activityError, setActivityError] = useState("");
  const [activityNonce, setActivityNonce] = useState(0);
  const [events, setEvents] = useState<
    {
      id: string;
      title: string;
      actorName: string;
      note: string;
      createdAt: string | null;
    }[]
  >([]);
  useEffect(() => {
    let active = true;
    setActivityError("");
    fetch(`/api/projects/${project.id}/activity`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Could not load activity");
        return data;
      })
      .then((data) => {
        if (active && Array.isArray(data.events)) setEvents(data.events);
      })
      .catch((error) => {
        if (active) setActivityError(error.message);
      });
    return () => {
      active = false;
    };
  }, [project.id, project.updatedAt, activityNonce]);
  const stages = project.chapterStatuses ?? [
    "not_started",
    "not_started",
    "not_started",
    "not_started",
    "not_started",
  ];

  async function change(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    try {
      await action();
      toast.success(success);
      setNote("");
      onChanged();
    } catch (error) {
      toast.error("Could not update project", {
        description: (error as Error).message,
      });
    } finally {
      setBusy(false);
    }
  }

  const topicStatus = project.topicStatus ?? "approved";
  return (
    <div className="space-y-5">
      <section className="rounded-lg border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">Project topic approval</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Current status:{" "}
              <span className="font-medium capitalize text-foreground">
                {topicStatus}
              </span>
            </p>
          </div>
          {role === "supervisor" && (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={busy}
                onClick={() =>
                  void change(
                    () => api.decideTopic(project.id, "approved", note),
                    "Topic approved",
                  )
                }
              >
                Approve topic
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void change(
                    () => api.decideTopic(project.id, "declined", note),
                    "Topic declined",
                  )
                }
              >
                Decline
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void change(
                    () => api.decideTopic(project.id, "pending", note),
                    "Topic marked pending",
                  )
                }
              >
                Mark pending
              </Button>
            </div>
          )}
        </div>
        {project.topicDecisionNote && (
          <p className="mt-3 rounded-md bg-secondary/60 p-3 text-sm">
            {project.topicDecisionNote}
          </p>
        )}
        {role === "supervisor" && (
          <div className="mt-3">
            <Label htmlFor="topic-note">Decision feedback (optional)</Label>
            <Textarea
              id="topic-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Explain what should be revised if you decline the topic."
            />
          </div>
        )}
        {role === "student" && topicStatus === "declined" && (
          <form
            className="mt-3 space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              void change(
                () => api.resubmitTopic(project.id, revisedTopic),
                "Revised topic sent to your supervisor",
              );
            }}
          >
            <Label htmlFor="revised-topic">
              Revise and resubmit your topic
            </Label>
            <Input
              id="revised-topic"
              value={revisedTopic}
              onChange={(e) => setRevisedTopic(e.target.value)}
              minLength={8}
              maxLength={300}
              required
            />
            <Button disabled={busy || revisedTopic.trim().length < 8}>
              Resubmit topic
            </Button>
          </form>
        )}
      </section>

      <section className="rounded-lg border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-semibold">Chapter-by-chapter progress</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Each approved chapter contributes 20% to project completion.
            </p>
          </div>
          <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold">
            {stages.filter((status) => status === "approved").length}/5 approved
          </span>
        </div>
        <ol className="mt-4 space-y-2">
          {CHAPTER_STAGES.map((stage, index) => {
            const status = stages[index] ?? "not_started";
            const Icon =
              status === "approved"
                ? CheckCircle2
                : status === "in_review"
                  ? Clock3
                  : Circle;
            return (
              <li
                key={stage}
                className="flex items-center gap-3 rounded-md border px-3 py-3"
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${status === "approved" ? "text-primary" : "text-muted-foreground"}`}
                />
                <span className="min-w-0 flex-1 text-sm">{stage}</span>
                <span className="text-xs capitalize text-muted-foreground">
                  {status.replaceAll("_", " ")}
                </span>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-sm font-medium">
          {project.finalApproved
            ? "Final project approval granted"
            : stages.every((status) => status === "approved")
              ? "All chapters approved. Final submission and approval are now available."
              : "Final approval becomes available after every chapter is approved."}
        </p>
      </section>

      <section className="rounded-lg border bg-card p-4 sm:p-5">
        <div>
          <h2 className="font-semibold">Deadline extension</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {project.extensionStatus === "pending"
              ? `Request pending for ${project.extensionRequestedUntil ?? "a new deadline"}.`
              : project.extensionStatus
                ? `Request ${project.extensionStatus}. ${project.extensionDecisionNote ?? ""}`
                : "No extension request is pending."}
          </p>
        </div>
        {role === "student" &&
          project.extensionStatus !== "pending" &&
          !project.finalApproved && (
            <form
              className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                if (extensionDate)
                  void change(
                    () => api.requestExtension(project.id, extensionDate),
                    "Extension request sent to your supervisor",
                  );
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="extension-date">Requested new deadline</Label>
                <Input
                  id="extension-date"
                  type="date"
                  value={extensionDate}
                  onChange={(e) => setExtensionDate(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={busy || !extensionDate}>
                Request extension
              </Button>
            </form>
          )}
        {role === "supervisor" && project.extensionStatus === "pending" && (
          <div className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="extension-note">Decision note (optional)</Label>
              <Textarea
                id="extension-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={busy}
                onClick={() =>
                  void change(
                    () => api.decideExtension(project.id, "approved", note),
                    "Extension approved",
                  )
                }
              >
                Grant extension
              </Button>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void change(
                    () => api.decideExtension(project.id, "declined", note),
                    "Extension declined",
                  )
                }
              >
                Decline extension
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-lg border bg-card p-4 sm:p-5">
        <h2 className="font-semibold">Project activity log</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Topic decisions, submissions, reviews and deadline requests.
        </p>
        {activityError && (
          <div role="alert" className="mt-3">
            <p className="text-sm">{activityError}</p>
            <Button
              variant="outline"
              onClick={() => setActivityNonce((n) => n + 1)}
            >
              Retry activity
            </Button>
          </div>
        )}
        {events.length ? (
          <ol className="mt-4 space-y-3">
            {events.map((event) => (
              <li key={event.id} className="border-l-2 border-primary/30 pl-3">
                <p className="text-sm font-medium">{event.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {event.actorName}
                  {event.createdAt
                    ? ` · ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.createdAt))}`
                    : ""}
                </p>
                {event.note && (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                    {event.note}
                  </p>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Activity will appear here as your project moves through supervision.
          </p>
        )}
      </section>
    </div>
  );
}
