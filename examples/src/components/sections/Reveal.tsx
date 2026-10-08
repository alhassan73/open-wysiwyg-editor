"use client";

import { createElement, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Milliseconds to wait after the element enters the viewport (stagger siblings with it). */
  delay?: number;
  as?: "div" | "li" | "section";
}

/**
 * Fades and slides its children in the first time they scroll into view. The CSS lives in globals.css
 * (`.reveal` / `.is-visible`); without JS or with reduced motion the content is shown at once.
 */
export function Reveal({ children, className, delay = 0, as = "div" }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-visible");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const style = delay ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties) : undefined;
  return createElement(as, { ref, className: cn("reveal", className), style }, children);
}
