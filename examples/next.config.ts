import { fileURLToPath } from "node:url";
import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// The site is an npm workspace: dependencies are hoisted to the repo root, so Turbopack must start there.
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const config: NextConfig = {
  output: "export",
  // GitHub Pages serves the site from /open-wysiwyg-editor/. Used in dev too, so URLs match production.
  basePath: "/open-wysiwyg-editor",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: false,
  turbopack: { root: repoRoot },
  // There are two root layouts ([locale] and the language chooser in (root)), so the 404 page needs its own <html>.
  experimental: { globalNotFound: true },
};

// next-intl: translations come from messages/<locale>.json through src/i18n/request.ts.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(config);
