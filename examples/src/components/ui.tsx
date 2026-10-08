import type { ReactNode } from "react";
import { Rich } from "./Rich";

/** Small building blocks for documentation pages. Classes only, no inline styles. */
export function PageHead({ eyebrow, title, lead }: { eyebrow?: string; title: string; lead?: string }) {
  return (
    <header className="page-head">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {lead && (
        <p className="lead">
          <Rich text={lead} />
        </p>
      )}
    </header>
  );
}

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="doc-section" aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`}>
        <a className="anchor" href={`#${id}-h`}>
          {title}
        </a>
      </h2>
      {children}
    </section>
  );
}

export function P({ text, children }: { text?: string; children?: ReactNode }) {
  return <p>{children ?? <Rich text={text ?? ""} />}</p>;
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="key">{children}</kbd>;
}
