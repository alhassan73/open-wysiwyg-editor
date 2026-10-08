import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export interface TabItem {
  id: string;
  label: string;
  panel: ReactNode;
}

interface Props {
  tabs: TabItem[];
  label: string;
  className?: string;
  onChange?: (id: string) => void;
}

/** WAI-ARIA APG tabs with automatic activation: arrows, Home and End move and select. */
export function Tabs({ tabs, label, className = "", onChange }: Props) {
  const base = useId();
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const go = (index: number) => {
    const next = (index + tabs.length) % tabs.length;
    setActive(next);
    onChange?.(tabs[next]!.id);
    refs.current[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent, i: number) => {
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const forward = rtl ? "ArrowLeft" : "ArrowRight";
    const back = rtl ? "ArrowRight" : "ArrowLeft";
    const target =
      event.key === forward ? i + 1 : event.key === back ? i - 1 : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : null;
    if (target === null) return;
    event.preventDefault();
    go(target);
  };

  return (
    <div className={`tabs ${className}`}>
      <div role="tablist" aria-label={label} className="tablist">
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${base}-tab-${tab.id}`}
            aria-selected={i === active}
            aria-controls={`${base}-panel-${tab.id}`}
            tabIndex={i === active ? 0 : -1}
            className="tab"
            onClick={() => go(i)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, i) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${base}-panel-${tab.id}`}
          aria-labelledby={`${base}-tab-${tab.id}`}
          hidden={i !== active}
          tabIndex={0}
          className="tabpanel"
        >
          {tab.panel}
        </div>
      ))}
    </div>
  );
}
