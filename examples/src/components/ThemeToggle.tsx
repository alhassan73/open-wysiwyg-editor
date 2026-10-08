import { useRef } from "react";
import { setChoice, useThemeChoice, type ThemeChoice } from "../theme";

const OPTIONS: { value: ThemeChoice; label: string; path: string }[] = [
  { value: "light", label: "Light theme", path: "M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6L4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 7a5 5 0 100 10 5 5 0 000-10z" },
  { value: "system", label: "Match system theme", path: "M4 5h16v11H4zM9 20h6M12 16v4" },
  { value: "dark", label: "Dark theme", path: "M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z" },
];

/** Three-way theme switch (radio group), persisted in localStorage. */
export function ThemeToggle() {
  const choice = useThemeChoice();
  const group = useRef<HTMLDivElement>(null);
  return (
    <div className="theme-toggle" role="radiogroup" aria-label="Color theme" ref={group}>
      {OPTIONS.map((o, i) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={choice === o.value}
          aria-label={o.label}
          title={o.label}
          tabIndex={choice === o.value ? 0 : -1}
          onClick={() => setChoice(o.value)}
          onKeyDown={(e) => {
            const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
            if (!step) return;
            e.preventDefault();
            const n = (i + step + OPTIONS.length) % OPTIONS.length;
            setChoice(OPTIONS[n]!.value);
            group.current?.querySelectorAll<HTMLElement>("button")[n]?.focus();
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d={o.path} />
          </svg>
        </button>
      ))}
    </div>
  );
}
