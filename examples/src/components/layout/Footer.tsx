import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { siGithub } from "simple-icons";
import { Link } from "@/i18n/navigation";
import { npmUrl, COPYRIGHT_YEAR } from "@/lib/site";
import { CONTAINER, LINKS, PAGES } from "./nav";
import { Wordmark } from "./Wordmark";

/** The npm packages named in the footer; the rest are on the Frameworks page. */
const PACKAGES = [
  "open-wysiwyg-editor",
  "@open-wysiwyg-editor/react",
  "@open-wysiwyg-editor/next",
  "@open-wysiwyg-editor/vue",
  "@open-wysiwyg-editor/angular",
  "@open-wysiwyg-editor/svelte",
];

const link =
  "inline-flex min-h-8 items-center gap-1 rounded-sm text-muted-foreground underline-offset-4 transition-colors duration-150 hover:text-foreground hover:underline";
const title = "mb-3 text-small font-bold text-foreground";
/** Inline link inside the credits line. */
const inline =
  "font-bold text-foreground underline underline-offset-4 transition-colors duration-150 hover:text-link";

function External({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} rel="noreferrer" className={link}>
      {children}
      <ArrowUpRight aria-hidden="true" className="size-3.5 rtl:-scale-x-100" />
    </a>
  );
}

export function Footer() {
  const t = useTranslations("Footer");
  const nav = useTranslations("Nav");
  const projectLinks = [
    { href: LINKS.github, label: "GitHub" },
    { href: LINKS.npm, label: "npm" },
    { href: LINKS.license, label: t("license") },
    { href: LINKS.security, label: t("security") },
    { href: LINKS.issues, label: t("issues") },
  ];
  const author = t("authorName");

  return (
    <footer className="border-t bg-card/40">
      <div
        className={`${CONTAINER} grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr]`}
      >
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href="/" aria-label={t("home")} className="-ms-1 inline-flex rounded-lg p-1">
            <Wordmark />
          </Link>
          <p className="mt-4 max-w-sm text-small text-muted-foreground">{t("about")}</p>
        </div>

        <nav aria-label={t("sections")}>
          <p className={title}>{t("sections")}</p>
          <ul className="grid gap-1 text-small">
            {PAGES.map(({ key, href }) => (
              <li key={key}>
                <Link href={href} className={link}>
                  {nav(key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={t("project")}>
          <p className={title}>{t("project")}</p>
          <ul className="grid gap-1 text-small">
            {projectLinks.map(({ href, label }) => (
              <li key={href}>
                <External href={href}>{label}</External>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={t("packages")}>
          <p className={title}>{t("packages")}</p>
          <ul className="grid gap-1 text-small">
            {PACKAGES.map((pkg) => (
              <li key={pkg}>
                <a
                  href={npmUrl(pkg)}
                  rel="noreferrer"
                  dir="ltr"
                  className={`${link} font-mono text-mono`}
                >
                  {pkg}
                  <ArrowUpRight aria-hidden="true" className="size-3.5" />
                </a>
              </li>
            ))}
            <li>
              <Link href="/frameworks/" className={`${link} font-bold`}>
                {t("allPackages")}
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t">
        <div
          className={`${CONTAINER} flex flex-col items-center gap-3 py-6 text-center text-small text-muted-foreground lg:flex-row lg:justify-between lg:text-start`}
        >
          <p>
            {t.rich("legal", {
              year: COPYRIGHT_YEAR,
              author,
              license: (chunks) => (
                <a href={LINKS.license} rel="noreferrer" className={inline}>
                  {chunks}
                </a>
              ),
            })}
          </p>
          <div className="flex flex-col items-center gap-x-6 gap-y-2 sm:flex-row">
            <p>
              {t.rich("credit", {
                author,
                profile: (chunks) => (
                  <a
                    href={LINKS.author}
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-bold text-foreground underline-offset-4 transition-colors duration-150 hover:text-link hover:underline"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      focusable="false"
                      className="size-4 fill-current"
                    >
                      <path d={siGithub.path} />
                    </svg>
                    {chunks}
                  </a>
                ),
              })}
            </p>
            <p>
              {t.rich("builtOn", {
                link: (chunks) => (
                  <a href={LINKS.prosemirror} rel="noreferrer" lang="en" className={inline}>
                    {chunks}
                  </a>
                ),
              })}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
