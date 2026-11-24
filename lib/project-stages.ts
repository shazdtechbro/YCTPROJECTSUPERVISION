import { CHAPTER_STAGES, type ProjectDoc } from "./types";

export const PROJECT_STAGES = ["proposal", "chapter1", "chapter2", "chapter3", "chapter4", "chapter5"] as const;
export type ProjectStage = (typeof PROJECT_STAGES)[number];

export function isProjectStage(value: unknown): value is ProjectStage {
  return PROJECT_STAGES.some((stage) => stage === value);
}

export function stageLabel(stage: ProjectStage) {
  return stage === "proposal" ? "Proposal" : CHAPTER_STAGES[PROJECT_STAGES.indexOf(stage) - 1];
}

export function stageDeadline(project: ProjectDoc, stage: ProjectStage) {
  return project.stageDeadlines?.[stage] ?? null;
}

export function currentStage(project: ProjectDoc): { label: string; deadline: string | null } {
  if (project.finalApproved) return { label: "Completed", deadline: null };
  if (project.topicStatus && project.topicStatus !== "approved") {
    return { label: "Topic review", deadline: null };
  }
  const hasChapterWork = project.chapterStatuses?.some((status) => status !== "not_started");
  if (project.proposalStatus !== "approved" && (!hasChapterWork || project.proposalStatus)) {
    return { label: "Proposal", deadline: stageDeadline(project, "proposal") };
  }
  const stage = PROJECT_STAGES.slice(1).find((_, index) => project.chapterStatuses?.[index] !== "approved");
  return stage ? { label: stageLabel(stage), deadline: stageDeadline(project, stage) } : { label: "Final review", deadline: null };
}
