"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import styles from "./Wordmark.module.css";

const NAME = "Open WYSIWYG Editor";
const LETTERS = Array.from(NAME);
// Slot 0 is the gap between "owe" and the name, so it is the last thing deleted and the first retyped.
const LAST_SLOT = LETTERS.length;
// Must stay in sync with --step-in in Wordmark.module.css.
const TYPING_MS = (LAST_SLOT + 1) * 45 + 150;

const slot = (i: number) => ({ "--i": i }) as CSSProperties;

/**
 * The "owe" mark: lowercase owe on a selection highlight followed by a blinking caret.
 * `live` also shows the name; with `compact` set (the page has scrolled) the name is backspaced letter by
 * letter, leaving "owe" and the caret, and scrolling back up retypes it. Each letter is its own span that
 * collapses after a staggered delay, so it is pure CSS: no timers, no layout measuring, and the server
 * HTML already shows the full name. `static` is the full lockup (footer), `mark` is just "owe".
 */
export function Wordmark({
  variant = "live",
  compact = false,
}: {
  variant?: "live" | "static" | "mark";
  compact?: boolean;
}) {
  const root = useRef<HTMLSpanElement>(null);
  const first = useRef(true);

  // A real caret stops blinking while text changes. Skip the initial render, nothing is typed then.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const el = root.current;
    if (!el) return;
    el.setAttribute("data-typing", "");
    const id = window.setTimeout(() => el.removeAttribute("data-typing"), TYPING_MS);
    return () => window.clearTimeout(id);
  }, [compact]);

  return (
    <span
      ref={root}
      className={`${styles.wm} ${variant === "live" ? "" : styles.still}`}
      data-compact={variant === "live" && compact ? "" : undefined}
      dir="ltr"
      aria-hidden="true"
    >
      <span className={styles.sel}>owe</span>
      {variant !== "mark" && (
        <span className={styles.name}>
          <span className={styles.gap} style={slot(0)} />
          {LETTERS.map((ch, i) => (
            <span key={i} className={styles.ch} style={slot(i + 1)}>
              {ch}
            </span>
          ))}
        </span>
      )}
      <i className={styles.caret} />
    </span>
  );
}
