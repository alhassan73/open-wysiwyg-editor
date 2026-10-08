import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));

// Every *.html next to this file, in frameworks/ and in guides/ is a page of the site.
const pages = (dir = ""): string[] =>
  readdirSync(resolve(root, dir))
    .filter((name) => name.endsWith(".html"))
    .map((name) => resolve(root, dir, name));
const input = [...pages(), ...pages("frameworks"), ...pages("guides")];

// The production build ships a strict CSP: no inline script or style, Trusted Types enforced.
// Dev mode needs Vite's inline HMR scripts, so the policy is only injected by `vite build`.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "require-trusted-types-for 'script'",
  "trusted-types open-wysiwyg-editor ProseMirrorClipboard",
].join("; ");

const strictCsp = (): Plugin => ({
  name: "strict-csp",
  apply: "build",
  transformIndexHtml: () => [
    { tag: "meta", attrs: { "http-equiv": "Content-Security-Policy", content: CSP }, injectTo: "head-prepend" },
  ],
});

export default defineConfig({
  base: "./",
  plugins: [react(), strictCsp()],
  build: {
    outDir: "../_site",
    emptyOutDir: true,
    assetsInlineLimit: 0, // no data: URIs (font-src 'self')
    modulePreload: { polyfill: false },
    rollupOptions: { input },
  },
});
