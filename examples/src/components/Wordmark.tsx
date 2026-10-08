import { useEffect, useRef } from "react";

/**
 * The "owe" mark: lowercase owe on a selection highlight, followed by a caret.
 * `live` shows "Open WYSIWYG Editor" beside it while the page is at the top. When the page scrolls,
 * Layout sets data-compact on the header and the name is deleted letter by letter, leaving the
 * mark and its blinking caret. `static` is the full lockup (footer), `mark` is just "owe".
 */
export function Wordmark({ variant = "live" }: { variant?: "live" | "static" | "mark" }) {
  const name = useRef<HTMLSpanElement>(null);
  const inner = useRef<HTMLSpanElement>(null);

  // Measure the name so the width transition ends exactly at the last letter.
  useEffect(() => {
    if (variant === "mark") return;
    const measure = () => {
      if (name.current && inner.current) name.current.style.setProperty("--wm-w", `${inner.current.scrollWidth}px`);
    };
    measure();
    // The name's width changes when Almarai finishes loading.
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    if (inner.current) ro?.observe(inner.current);
    return () => ro?.disconnect();
  }, [variant]);

  return (
    <span className={`wm wm-${variant}`} dir="ltr" aria-hidden="true">
      <span className="wm-sel">
        <span className="wm-owe">owe</span>
      </span>
      {variant !== "mark" && (
        <span className="wm-name" ref={name}>
          <span className="wm-name-in" ref={inner}>
            Open WYSIWYG Editor
          </span>
        </span>
      )}
      <i className="wm-caret" />
    </span>
  );
}
