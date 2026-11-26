"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Check, MessageSquare } from "lucide-react";

import Image from "next/image";
import hero from "@/public/redesign/hero-illustration.png";
import { ProgressRing } from "./stats";
import { EASE } from "./motion";

/** Landing hero art: subtle scale on scroll plus floating product cards. */
export function HeroArt() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const scale = useTransform(scrollY, [0, 700], [1, reduce ? 1 : 1.06]);
  const y = useTransform(scrollY, [0, 700], [0, reduce ? 0 : 30]);

  return (
    <motion.div
      ref={ref}
      className="relative mx-2 sm:mx-6"
      initial={reduce ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
    >
      <motion.div style={{ scale, y }} className="overflow-hidden rounded-[32px] shadow-float">
        <Image src={hero} alt="" priority sizes="(min-width: 1024px) 50vw, 100vw" className="h-auto w-full" />
      </motion.div>
      <div className="absolute -left-2 top-6 flex w-[190px] animate-floaty items-center gap-3 rounded-2xl border border-line bg-card p-3 shadow-float sm:-left-10 sm:w-[220px]">
        <ProgressRing value={40} size={48} stroke={5} />
        <div><div className="text-xs font-medium text-ink-3">Project progress</div><div className="font-display text-[15px] font-extrabold">2 stages done</div></div>
      </div>
      <div className="absolute -right-2 top-1/2 hidden w-[230px] animate-floaty rounded-2xl border border-line bg-card p-3 shadow-float [animation-delay:-2s] sm:-right-6 sm:block">
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-700"><Check className="h-4 w-4" />Chapter draft approved</div>
        <div className="mt-1 text-xs text-ink-3">Literature review · by your supervisor</div>
      </div>
      <div className="absolute -bottom-6 left-4 w-[230px] animate-floaty rounded-2xl bg-[#111611] p-3 text-white shadow-float [animation-delay:-4s] sm:left-6 sm:w-[250px]">
        <div className="flex items-center gap-2 text-xs font-semibold text-sun-300"><MessageSquare className="h-4 w-4" />New feedback</div>
        <div className="mt-1 text-[13px] leading-snug">&ldquo;Strong methodology. Add a sequence diagram for booking.&rdquo;</div>
      </div>
    </motion.div>
  );
}
