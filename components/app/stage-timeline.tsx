import { AlertCircle, Check, Clock, Flag, GraduationCap } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import type { ProjectDoc, SubmissionDoc, SubmissionKind } from "@/lib/types";

export type StageState = "approved" | "review" | "changes" | "todo";
export interface Stage { key: string; label: string; state: StageState; detail: string }

const STAGES: { kind: SubmissionKind; label: string }[] = [
  { kind: "proposal", label: "Proposal" },
  { kind: "chapter", label: "Chapter drafts" },
  { kind: "revision", label: "Revisions" },
  { kind: "final", label: "Final report" },
];

/**
 * Derives the review journey from real submissions: each stage takes the
 * status of its most recent submission of that kind. Defence closes the line.
 */
export function deriveStages(project: ProjectDoc, subs: SubmissionDoc[]): Stage[] {
  const latest = (k: SubmissionKind) =>
    subs.filter((s) => s.kind === k).sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))[0];
  const out: Stage[] = STAGES.map(({ kind, label }) => {
    const s = latest(kind);
    if (!s) return { key: kind, label, state: "todo", detail: "Not started" };
    if (s.status === "approved") return { key: kind, label, state: "approved", detail: `Approved · v${s.version}` };
    if (s.status === "changes_requested") return { key: kind, label, state: "changes", detail: `Changes requested · v${s.version}` };
    return { key: kind, label, state: "review", detail: `In review · v${s.version}` };
  });
  out.push({
    key: "defence",
    label: "Defence",
    state: project.finalApproved ? "approved" : "todo",
    detail: project.defenseDate ? formatDate(project.defenseDate) : "Date not set",
  });
  return out;
}

const STYLE: Record<StageState, { cls: string; Icon: typeof Check; label: string }> = {
  approved: { cls: "bg-brand-700 text-white", Icon: Check, label: "Approved" },
  review: { cls: "bg-sun-400 text-ink", Icon: Clock, label: "In review" },
  changes: { cls: "bg-[#FDECEA] text-stalled", Icon: AlertCircle, label: "Changes requested" },
  todo: { cls: "bg-cream-2 text-ink-3", Icon: Flag, label: "Not started" },
};

/** Vertical on phones, horizontal from md up. */
export function StageTimeline({ stages }: { stages: Stage[] }) {
  const done = stages.filter((s) => s.state === "approved").length;
  const pct = stages.length > 1 ? (Math.max(0, done - 0.5) / (stages.length - 1)) * 100 : 0;
  return (
    <div>
      <ol className="relative space-y-4 md:hidden">
        <span aria-hidden className="absolute bottom-3 left-[19px] top-3 w-0.5 bg-line" />
        {stages.map((s, i) => {
          const st = STYLE[s.state];
          const Icon = s.key === "defence" ? GraduationCap : st.Icon;
          return (
            <li key={s.key} className="relative flex items-center gap-3">
              <span className={cn("z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full ring-4 ring-white", st.cls)}><Icon className="h-[18px] w-[18px]" /></span>
              <div className="min-w-0">
                <div className="text-sm font-semibold">{i + 1}. {s.label}</div>
                <div className="text-xs text-ink-3">{s.detail}</div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="relative hidden md:block">
        <div aria-hidden className="absolute left-5 right-5 top-[19px] h-0.5 bg-line" />
        <div aria-hidden className="absolute left-5 top-[19px] h-0.5 bg-brand-700 transition-all duration-700" style={{ width: `calc((100% - 40px) * ${pct / 100})` }} />
        <ol className="relative grid gap-3" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
          {stages.map((s, i) => {
            const st = STYLE[s.state];
            const Icon = s.key === "defence" ? GraduationCap : st.Icon;
            return (
              <li key={s.key}>
                <span className={cn("grid h-10 w-10 place-items-center rounded-full ring-4 ring-white", st.cls)} title={st.label}><Icon className="h-[18px] w-[18px]" /></span>
                <div className="mt-3 font-mono text-xs text-ink-3">STEP {i + 1}</div>
                <div className="text-[13px] font-semibold leading-snug">{s.label}</div>
                <div className="mt-0.5 text-xs text-ink-3">{s.detail}</div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

/** One plain-language next action computed from existing project state. */
export function nextStep(project: ProjectDoc, stages: Stage[]): { title: string; body: string } {
  const changes = stages.find((s) => s.state === "changes");
  if (changes) return { title: `Address feedback on your ${changes.label.toLowerCase()}.`, body: "Read the comments, then upload a revision." };
  const review = stages.find((s) => s.state === "review");
  if (review) return { title: `Your ${review.label.toLowerCase()} is with your supervisor.`, body: "You will get a notification when it is reviewed." };
  if (project.finalApproved) return { title: "Final approved. Prepare for defence.", body: project.defenseDate ? `Defence on ${formatDate(project.defenseDate)}.` : "Ask your supervisor to set the defence date." };
  const todo = stages.find((s) => s.state === "todo" && s.key !== "defence");
  if (todo) return { title: `Upload your ${todo.label.toLowerCase().replace(/s$/, "")}.`, body: "Open your project and use Upload to send it for review." };
  return { title: "Keep the momentum going.", body: "Check your tickets and feedback threads." };
}
