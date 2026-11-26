"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

import Image from "next/image";
import hero from "@/public/redesign/hero-illustration.png";
import { EASE } from "./motion";

/** Landing hero illustration with subtle scroll motion. */
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
    </motion.div>
  );
}
