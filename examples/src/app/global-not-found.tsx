import type { Metadata } from "next";
import { Fragment } from "react";
import { NoFlashScript } from "@/components/layout/NoFlashScript";
import { Wordmark } from "@/components/layout/Wordmark";
import { buttonVariants } from "@/components/ui/button";
import { DIR, LOCALES } from "@/i18n/config";
import { ALL_MESSAGES } from "@/i18n/static";
import { viewport as siteViewport } from "@/lib/seo";
import { localeUrl } from "@/lib/site";
import "./globals.css";

// A missing path has no locale, so this page renders its own document and shows every language
// (from both message files; next-intl is not involved).
// Links are absolute: the page is served for any missing path, at any depth, under the base path.
export const metadata: Metadata = {
  title: LOCALES.map((locale) => ALL_MESSAGES[locale].NotFound.title).join(" · "),
  robots: { index: false, follow: false },
};
export const viewport = siteViewport;

export default function GlobalNotFound() {
  return (
    <html lang="en" dir="ltr" data-theme="dark" suppressHydrationWarning>
      <head>
        <NoFlashScript />
      </head>
      <body>
        <main className="grid min-h-dvh place-items-center px-4 py-16">
          <div className="w-full max-w-lg rounded-xl border bg-card p-8 text-center shadow-elevated sm:p-10">
            <a
              href={localeUrl("en")}
              aria-label="Open WYSIWYG Editor – home"
              className="inline-flex rounded-lg p-1"
            >
              <Wordmark variant="static" />
            </a>
            <p
              aria-hidden="true"
              className="text-gradient mt-8 text-7xl leading-none font-extrabold"
            >
              404
            </p>

            {LOCALES.map((locale, i) => {
              // One h1 for the page; the other languages are h2.
              const Heading = i === 0 ? "h1" : "h2";
              const t = ALL_MESSAGES[locale].NotFound;
              return (
                <Fragment key={locale}>
                  {i > 0 && <hr className="my-8" />}
                  <section lang={locale} dir={DIR[locale]} className={i === 0 ? "mt-6" : undefined}>
                    <Heading className="text-2xl font-extrabold">{t.title}</Heading>
                    <p className="mt-2 text-muted-foreground">{t.body}</p>
                    <a href={localeUrl(locale)} className={buttonVariants({ className: "mt-5" })}>
                      {t.home}
                    </a>
                  </section>
                </Fragment>
              );
            })}
          </div>
        </main>
      </body>
    </html>
  );
}
