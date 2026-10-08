import type { ReactNode } from "react";
import { NoFlashScript } from "@/components/layout/NoFlashScript";
import { viewport as siteViewport } from "@/lib/seo";
import "../globals.css";

export const viewport = siteViewport;

/**
 * Sends the visitor to their language. Arabic browsers (first preferred language "ar") go to ar/, everyone
 * else to en/; the hash is kept. The URLs are relative, so the base path never appears here. The script is a
 * constant, and scripts/export.mjs adds its hash to the page's CSP. Without JavaScript the <noscript> refresh
 * goes to English, and the page itself shows a link to each language.
 */
const REDIRECT =
  'try{var l=(navigator.languages&&navigator.languages[0])||navigator.language||"";' +
  'location.replace((/^ar(-|$)/i.test(l)?"ar/":"en/")+location.hash)}catch(e){}';

// This is a root layout of its own: the language chooser is outside the [locale] pages.
export default function RootChooserLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" data-theme="dark" suppressHydrationWarning>
      <head>
        <NoFlashScript />
        <script dangerouslySetInnerHTML={{ __html: REDIRECT }} />
        <noscript>
          <meta httpEquiv="refresh" content="0; url=en/" />
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  );
}
