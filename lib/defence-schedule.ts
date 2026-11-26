import { isCalendarDate } from "./dates";

export interface DefenceSchedule {
  date: string;
  time: string;
}

export function isDefenceSchedule(value: unknown): value is DefenceSchedule {
  if (!value || typeof value !== "object") return false;
  const { date, time } = value as Partial<DefenceSchedule>;
  return isCalendarDate(date) && typeof time === "string" && /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}

export function defenceInstant(schedule: DefenceSchedule): Date {
  return new Date(`${schedule.date}T${schedule.time}:00+01:00`);
}

export function expectedChapterProgress(start: Date, defence: Date, now = new Date()): number {
  const duration = defence.getTime() - start.getTime();
  if (now >= defence) return 100;
  if (duration <= 0 || now <= start) return 0;
  return Math.floor(((now.getTime() - start.getTime()) / duration) * 5) * 20;
}
