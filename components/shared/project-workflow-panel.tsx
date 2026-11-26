"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth/auth-context";
import { api } from "@/lib/api";
import { PROJECT_STAGES, stageDeadline, stageLabel, type ProjectStage } from "@/lib/project-stages";
import { type ProjectDoc, type Role } from "@/lib/types";

export function ProjectWorkflowPanel({
  project,
  role,
  onChanged,
}: {
  project: ProjectDoc;
  role: Role;
  onChanged: () => void;
}) {
  const { user } = useAuth();
  const [partnerMatric, setPartnerMatric] = useState("");
  const [note, setNote] = useState("");
  const [extensionDate, setExtensionDate] = useState("");
  const [extensionStage, setExtensionStage] = useState<ProjectStage | "">("");
  const [extensionReason, setExtensionReason] = useState("");
  const [editingStage, setEditingStage] = useState<ProjectStage>("proposal");
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const availableStages = PROJECT_STAGES.filter((stage) => stageDeadline(project, stage));
  const selectedDeadline = extensionStage ? stageDeadline(project, extensionStage) : null;
  const [revisedTopic, setRevisedTopic] = useState("");
  const [busy, setBusy] = useState(false);

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
                {topicStatus === "pending" ? "Waiting for supervisor approval" : topicStatus === "declined" ? "Needs a revised topic" : "Approved"}
              </span>
            </p>
            {topicStatus === "pending" && (
              <p className="mt-2 text-sm text-muted-foreground">
                {role === "supervisor"
                  ? "Review the topic below. Approving it lets the student upload chapters."
                  : role === "student"
                    ? "Ask your supervisor to approve your topic. You can upload your proposal while you wait. Chapter uploads open after approval."
                    : "The assigned supervisor must approve the topic before the student can upload chapters."}
              </p>
            )}
            {topicStatus === "declined" && role === "student" && (
              <p className="mt-2 text-sm text-muted-foreground">Read the feedback below, then enter and resubmit a revised topic.</p>
            )}
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
            <Label htmlFor="topic-note">Comment / feedback (optional)</Label>
            <Textarea
              id="topic-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Add a comment or feedback about the project topic."
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
            <h2 className="font-semibold">Proposal and chapter progress</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Each approved chapter contributes 20% to project completion.
            </p>
          </div>
          <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold">
            {stages.filter((status) => status === "approved").length}/5 approved
          </span>
        </div>
        <ol className="mt-4 space-y-2">
          {PROJECT_STAGES.map((stage, index) => {
            const status = (index === 0 ? project.proposalStatus : stages[index - 1]) ?? "not_started";
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
                <div className="min-w-0 flex-1 text-sm">
                  <p>{stageLabel(stage)}</p>
                  <p className="text-xs text-muted-foreground">{stageDeadline(project, stage) ? `Deadline ${stageDeadline(project, stage)}` : "No deadline set"}</p>
                </div>
                <span className="text-xs capitalize text-muted-foreground">
                  {status.replaceAll("_", " ")}
                </span>
              </li>
            );
          })}
        </ol>
        {role === "supervisor" && !project.finalApproved && (
          <form className="mt-4 space-y-3" onSubmit={(event) => {
            event.preventDefault();
            const date = editingDate ?? stageDeadline(project, editingStage);
            void change(() => api.setStageDeadline(project.id, editingStage, date || null), "Stage deadline saved");
          }}>
            <h3 className="text-sm font-semibold">{stageLabel(editingStage)} deadline</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="deadline-stage">Stage</Label>
                <select id="deadline-stage" className="h-10 w-full rounded-md border bg-background px-2 text-sm" value={editingStage} onChange={(event) => {
                  setEditingStage(event.target.value as ProjectStage);
                  setEditingDate(null);
                }}>
                  {PROJECT_STAGES.map((stage) => <option key={stage} value={stage}>{stageLabel(stage)}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="stage-deadline">Deadline</Label>
                <Input id="stage-deadline" type="date" value={editingDate ?? stageDeadline(project, editingStage) ?? ""} onChange={(event) => setEditingDate(event.target.value)} />
              </div>
            </div>
            <Button disabled={busy || editingDate === null || (project.extensionStatus === "pending" && project.extensionStage === editingStage)}>Save deadline</Button>
          </form>
        )}
        <p className="mt-3 text-sm font-medium">
          {project.finalApproved
            ? "Final project approval granted"
            : stages.length === 5 && stages.every((status) => status === "approved")
              ? "All five chapters are approved. The student can now upload the final project for the supervisor’s review."
              : "The supervisor must approve all five chapters before the student can upload the final project."}
        </p>
      </section>

      <section className="rounded-lg border bg-card p-4 sm:p-5">
        <div>
          <h2 className="font-semibold">{project.extensionStatus === "pending" && project.extensionStage ? `${stageLabel(project.extensionStage)} deadline extension` : extensionStage ? `${stageLabel(extensionStage)} deadline extension` : "Deadline extension"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {project.extensionStatus === "pending"
              ? `Request pending for ${project.extensionRequestedUntil ?? "a new deadline"}.`
              : project.extensionStatus
                ? `Request ${project.extensionStatus}. ${project.extensionDecisionNote ?? ""}`
                : "No extension request is pending."}
          </p>
          {project.extensionReason && <p className="mt-2 whitespace-pre-wrap break-words text-sm">{project.extensionReason}</p>}
          <p className="text-sm text-muted-foreground">{role === "student" && !availableStages.length ? "Ask your supervisor to set a deadline for the stage you need more time for. You can request an extension once the date appears." : ""}
          </p>
        </div>
        {role === "student" &&
          project.extensionStatus !== "pending" &&
          !project.finalApproved && (
            <form
              className="mt-3 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (extensionDate && extensionStage && selectedDeadline)
                  void change(
                    () => api.requestExtension(project.id, extensionDate, extensionStage, extensionReason),
                    "Extension request sent to your supervisor",
                  );
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="extension-stage">Stage to extend</Label>
                <select id="extension-stage" className="h-10 w-full rounded-md border bg-background px-2 text-sm" value={extensionStage} onChange={(event) => setExtensionStage(event.target.value as ProjectStage | "")} required>
                  <option value="">Choose a stage</option>
                  {PROJECT_STAGES.map((stage) => <option key={stage} value={stage} disabled={!stageDeadline(project, stage)}>{stageLabel(stage)}{!stageDeadline(project, stage) && " · Deadline not set"}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="extension-reason">Reason for extension</Label>
                <Textarea id="extension-reason" value={extensionReason} onChange={(event) => setExtensionReason(event.target.value)} maxLength={2000} disabled={!selectedDeadline} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="extension-date">Requested new deadline</Label>
                {selectedDeadline && <p className="text-sm text-muted-foreground">Current deadline is {selectedDeadline}. Choose a later date.</p>}
                <Input
                  id="extension-date"
                  type="date"
                  value={extensionDate}
                  disabled={!selectedDeadline}
                  onChange={(e) => setExtensionDate(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={busy || !selectedDeadline || !extensionDate || !extensionReason.trim()}>
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

      {role === "student" && user?.uid === project.studentId && !project.finalApproved && project.status !== "archived" && (
        <section className="rounded-lg border bg-card p-4 sm:p-5">
          <h2 className="font-semibold">Project partners</h2>
          <ul className="mt-2 space-y-2">
            {(project.memberIds ?? []).slice(1).map((id, index) => (
              <li key={id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>{project.memberNames?.[index + 1] ?? "Student"} {project.memberMatricNumbers?.[index + 1]}</span>
                <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void change(() => api.updatePartners(project.id, undefined, id), "Partner removed")}>Remove</Button>
              </li>
            ))}
          </ul>
          <form className="mt-3 space-y-2" onSubmit={(event) => {
            event.preventDefault();
            void change(async () => {
              await api.updatePartners(project.id, partnerMatric);
              setPartnerMatric("");
            }, "Partner added");
          }}>
            <Label htmlFor="partner-matric">Partner matriculation number</Label>
            <Input id="partner-matric" placeholder="F/HD/24/3211001" value={partnerMatric} onChange={(event) => setPartnerMatric(event.target.value)} required />
            <Button disabled={busy || !partnerMatric.trim() || (project.memberIds?.length ?? 1) >= 5}>Add partner</Button>
          </form>
        </section>
      )}
    </div>
  );
}
