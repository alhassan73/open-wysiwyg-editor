import { ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { breadcrumbLd } from "@/lib/seo";
import { cn } from "@/lib/utils";
import type { Crumb } from "@/types";
import { JsonLdScript } from "./JsonLd";
import { CONTAINER } from "./nav";

interface PageHeaderProps {
  /** Trail after "Home", ending with the page itself (e.g. Frameworks, Vue). */
  crumbs: Crumb[];
  eyebrow: string;
  /** The page's h1. */
  title: ReactNode;
  lead?: ReactNode;
  icon?: ReactNode;
  /** Shown beside the title (a logo). */
  mark?: ReactNode;
}

/** Top of every page except the home page: breadcrumb (with its JSON-LD), eyebrow, the h1 and a lead. */
export function PageHeader({ crumbs, eyebrow, title, lead, icon, mark }: PageHeaderProps) {
  const t = useTranslations("Pages");
  const locale = useLocale();
  const trail: Crumb[] = [{ name: t("home"), path: "" }, ...crumbs];
  return (
    <header className="relative border-b bg-card/30">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-glow opacity-60" />
      <div className={cn(CONTAINER, "relative py-10 md:py-14")}>
        <JsonLdScript data={breadcrumbLd(locale, trail)} />
        <nav aria-label={t("breadcrumb")}>
          <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 text-small text-muted-foreground">
            {trail.map((crumb, i) => {
              const last = i === trail.length - 1;
              return (
                <li key={crumb.path} className="flex items-center gap-1">
                  {last ? (
                    <span aria-current="page" className="font-bold text-foreground">
                      {crumb.name}
                    </span>
                  ) : (
                    <>
                      <Link
                        href={`/${crumb.path}`}
                        className="inline-flex min-h-8 items-center rounded-sm underline-offset-4 transition-colors duration-160 hover:text-foreground hover:underline"
                      >
                        {crumb.name}
                      </Link>
                      <ChevronRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <p className="mt-6 mb-4 inline-flex items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-caption font-bold text-muted-foreground [&>svg]:size-3.5 [&>svg]:text-link">
          {icon}
          {eyebrow}
        </p>
        <div className="flex items-center gap-4">
          {mark ? (
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl border bg-background [&>svg]:size-8">
              {mark}
            </span>
          ) : null}
          <h1 className="text-h2">{title}</h1>
        </div>
        {lead ? <p className="mt-4 max-w-[60ch] text-lead text-muted-foreground">{lead}</p> : null}
      </div>
    </header>
  );
}
