import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { CONTAINER } from "./nav";

export interface SideNavItem {
  /** A route ("/frameworks/vue/") or, with `anchor`, an id on the same page ("#options"). */
  href: string;
  label: string;
  current?: boolean;
  anchor?: boolean;
  /** Language of a label that is not translated (a product name). */
  lang?: string;
}

const item =
  "flex min-h-11 items-center rounded-lg border border-transparent px-3 py-1.5 text-small font-bold text-muted-foreground transition-colors duration-160 hover:bg-accent hover:text-accent-foreground aria-[current=page]:border-primary/40 aria-[current=page]:bg-primary/10 aria-[current=page]:text-foreground";

/** Links to the sibling pages (or, on the API page, to the sections of the page). A wrapping row on small screens. */
export function SideNav({ label, items }: { label: string; items: SideNavItem[] }) {
  return (
    <nav aria-label={label}>
      <p className="mb-2 hidden px-3 text-caption font-bold text-muted-foreground lg:block">
        {label}
      </p>
      <ul className="flex flex-wrap gap-1 lg:flex-col lg:flex-nowrap">
        {items.map((it) => (
          <li key={it.href}>
            {it.anchor ? (
              <a href={it.href} lang={it.lang} className={item}>
                {it.label}
              </a>
            ) : (
              <Link
                href={it.href}
                lang={it.lang}
                aria-current={it.current ? "page" : undefined}
                className={item}
              >
                {it.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Two columns from `lg` up: a sticky side nav and the content; one column below. */
export function DocsLayout({ side, children }: { side: ReactNode; children: ReactNode }) {
  return (
    <div
      className={cn(
        CONTAINER,
        "grid gap-8 py-10 md:py-14 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12",
      )}
    >
      <aside className="lg:sticky lg:top-24 lg:self-start">{side}</aside>
      <div className="min-w-0 space-y-14">{children}</div>
    </div>
  );
}
