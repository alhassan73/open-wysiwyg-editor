import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/layout/Wordmark";
import { buttonVariants } from "@/components/ui/button";
import { DIR, LOCALE_PATH, LOCALES } from "@/i18n/config";
import { ALL_MESSAGES } from "@/i18n/static";
import { buildRootMetadata } from "@/lib/seo";

// The site's root: a language chooser. The layout forwards visitors to their language; this page is what
// shows without JavaScript, and what a crawler sees. It has no locale of its own, so it reads both message files.
export const generateMetadata = (): Promise<Metadata> => buildRootMetadata();

const NAME = "Open WYSIWYG Editor";

export default function RootChooser() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-16">
      <div className="w-full max-w-lg rounded-xl border bg-card p-8 text-center shadow-elevated sm:p-10">
        <span className="inline-flex p-1">
          <Wordmark />
        </span>
        <h1 className="mt-8 text-h2">{NAME}</h1>
        <ul role="list" className="mt-8 grid gap-4">
          {LOCALES.map((locale) => {
            const t = ALL_MESSAGES[locale].Chooser;
            return (
              <li key={locale} lang={locale} dir={DIR[locale]} className="grid gap-3">
                <p className="text-body text-muted-foreground">{t.choose}</p>
                <Link
                  href={LOCALE_PATH[locale]}
                  hrefLang={locale}
                  className={buttonVariants({
                    size: "lg",
                    variant: locale === "en" ? "default" : "outline",
                  })}
                >
                  {t.language}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
