"use client";

import { animate, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

export const EASE = [0.22, 1, 0.36, 1] as const;

/** Fade + 18px rise when scrolled into view. */
export function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Children (StaggerItem) reveal with a 60ms stagger. */
export function Stagger({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
    >
      {children}
    </motion.div>
  );
}
const staggerItem = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};
export const StaggerItem = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <motion.div className={className} variants={staggerItem}>{children}</motion.div>
);

/** Number that counts up from 0 once visible. Non-numbers render as-is. */
export function CountUp({ value, suffix = "" }: { value: number | string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState<number | string>(typeof value === "number" ? 0 : value);
  useEffect(() => {
    if (typeof value !== "number" || reduce) { setShown(value); return; }
    if (!inView) return;
    const c = animate(0, value, { duration: 1.1, ease: EASE, onUpdate: (v) => setShown(Math.round(v)) });
    return () => c.stop();
  }, [value, inView, reduce]);
  return <span ref={ref} className="tnum">{shown}{suffix}</span>;
}

/** Fades page content in on route change. */
export function PageTransition({ children, k }: { children: React.ReactNode; k: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div key={k} initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}>
      {children}
    </motion.div>
  );
}
