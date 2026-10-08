"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

/** Decorative hero background: a slow-drifting blue/cyan/teal glow, two orbs that parallax with scroll, a dot grid. */
export function HeroGlow() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const down = useTransform(scrollY, [0, 800], [0, reduce ? 0 : 160]);
  const up = useTransform(scrollY, [0, 800], [0, reduce ? 0 : -110]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-176 animate-glow-drift bg-glow" />
      <motion.div
        style={{ y: down }}
        className="absolute -top-28 start-[6%] size-112 rounded-full bg-primary/15 blur-3xl"
      />
      <motion.div
        style={{ y: up }}
        className="absolute end-[4%] top-40 size-96 rounded-full bg-brand-teal/10 blur-3xl"
      />
      <div className="absolute inset-0 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:26px_26px] [mask-image:radial-gradient(ellipse_70%_55%_at_50%_0%,#000,transparent)]" />
    </div>
  );
}
