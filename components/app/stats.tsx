"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { CountUp, EASE } from "./motion";

export function StatCard({
  label, value, icon: Icon, sub, dark, suffix,
}: { label: string; value: number | string; icon: LucideIcon; sub?: string; dark?: boolean; suffix?: string }) {
  return (
    <div className={cn("rounded-[20px] p-4 shadow-card md:p-5", dark ? "bg-brand-900 text-white" : "border border-line bg-card")}>
      <div className="flex items-start justify-between gap-2">
        <span className={cn("text-[13px] font-medium leading-snug", dark ? "text-white/75" : "text-ink-2")}>{label}</span>
        <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", dark ? "bg-card/10 text-sun-400" : "bg-cream-2 text-ink-2")}>
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </span>
      </div>
      <div className="mt-2 font-display text-[28px] font-extrabold tracking-tight md:text-[34px]">
        <CountUp value={value} suffix={suffix} />
      </div>
      {sub && <div className={cn("mt-0.5 text-xs", dark ? "text-white/70" : "text-ink-3")}>{sub}</div>}
    </div>
  );
}

/** Animated circular progress (0-100). */
export function ProgressRing({ value, size = 120, stroke = 10, label }: { value: number; size?: number; stroke?: number; label?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const r = size / 2 - stroke;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const target = c * (1 - pct / 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${pct}% complete`}>
      <svg ref={ref} width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#EEF7F0" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} stroke="#006600" strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: reduce ? target : c }}
          animate={{ strokeDashoffset: inView || reduce ? target : c }}
          transition={{ duration: 1.4, ease: EASE }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className={cn("font-display font-extrabold leading-none", size < 80 ? "text-[13px]" : "text-2xl")}><CountUp value={pct} suffix="%" /></div>
          {label && size >= 80 && <div className="mt-1 px-2 text-xs text-ink-3">{label}</div>}
        </div>
      </div>
    </div>
  );
}

/** Thin progress bar that grows from 0; colour follows health. */
export function ProgressBar({ value, tone = "green" }: { value: number; tone?: "green" | "amber" | "red" }) {
  const reduce = useReducedMotion();
  const color = tone === "red" ? "bg-stalled" : tone === "amber" ? "bg-sun-400" : "bg-brand-700";
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-cream-2" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
      <motion.div
        className={cn("h-full origin-left rounded-full", color)}
        style={{ width: `${v}%` }}
        initial={reduce ? false : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: EASE }}
      />
    </div>
  );
}

export const toneOf = (s: string) => (s === "stalled" ? "red" : s === "behind" ? "amber" : "green") as "green" | "amber" | "red";

const AV = ["bg-sun-300", "bg-brand-200", "bg-[#8EC5E8]", "bg-[#F6B8A8]", "bg-[#D6C8F5]"];
export function Initials({ name, size = "md", className }: { name: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const idx = [...(name || "?")].reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const ini = (name || "?").replace(/^(Mr\.|Mrs\.|Dr\.|Prof\.)\s/, "").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  const sz = size === "sm" ? "h-7 w-7 text-xs" : size === "lg" ? "h-12 w-12 text-sm" : "h-9 w-9 text-xs";
  return <span aria-hidden className={cn("grid shrink-0 place-items-center rounded-full font-bold text-ink", sz, AV[idx % 5], className)}>{ini}</span>;
}

export function SectionCard({ title, action, children, className }: { title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[20px] border border-line bg-card p-4 shadow-card md:p-6", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-display text-lg font-bold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
