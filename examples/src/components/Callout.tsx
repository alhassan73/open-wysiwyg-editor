import type { ReactNode } from "react";
import { Rich } from "./Rich";

const ICON = {
  info: "M12 8h.01M11 12h1v5h1M12 3a9 9 0 100 18 9 9 0 000-18z",
  warn: "M12 9v4M12 17h.01M10.3 4l-8 14a2 2 0 001.7 3h16a2 2 0 001.7-3l-8-14a2 2 0 00-3.4 0z",
  security: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4",
} as const;

interface Props {
  tone?: keyof typeof ICON;
  title: string;
  text?: string;
  children?: ReactNode;
}

export function Callout({ tone = "info", title, text, children }: Props) {
  return (
    <aside className={`callout callout-${tone}`}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d={ICON[tone]} />
      </svg>
      <div>
        <p className="callout-title">{title}</p>
        <p>{children ?? <Rich text={text ?? ""} />}</p>
      </div>
    </aside>
  );
}
