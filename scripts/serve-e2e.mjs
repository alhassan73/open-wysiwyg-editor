// Static server for e2e tests.
// - Test fixtures (anything outside /open-wysiwyg-editor/) are served with a strict CSP and Trusted Types
//   enforced, so any inline script/style-attribute/eval/unsafe HTML sink in the editor fails the tests.
// - The built docs site (<repo>/_site) is served under /open-wysiwyg-editor/, like GitHub Pages does. It
//   gets no CSP header: its pages carry their own CSP <meta> tag, which is what runs in production.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const siteRoot = resolve(root, "_site");
const SITE_BASE = "/open-wysiwyg-editor/";
const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const port = Number(arg("port") ?? process.env.PORT ?? 4317);
const defaultPage = arg("page") ?? "/test/e2e/fixtures/index.html";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".map": "application/json",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};

export const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: https:",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "require-trusted-types-for 'script'",
  "trusted-types open-wysiwyg-editor ProseMirrorClipboard",
].join("; ");

/** Reads `file` if it is a regular file inside `base`; null otherwise (also blocks path traversal). */
async function readInside(base, file) {
  if (file !== base && !file.startsWith(base + sep)) throw new Error("outside");
  const info = await stat(file).catch(() => null);
  return info?.isFile() ? { path: file, body: await readFile(file) } : null;
}

async function find(base, rel) {
  const file = resolve(base, "." + sep + rel);
  if (file !== base && !file.startsWith(base + sep)) throw new Error("outside");
  const info = await stat(file).catch(() => null);
  if (info?.isDirectory()) return readInside(base, resolve(file, "index.html"));
  return (
    (await readInside(base, file)) ?? (extname(file) ? null : readInside(base, file + ".html"))
  );
}

createServer(async (req, res) => {
  try {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { Allow: "GET, HEAD" }).end();
      return;
    }
    const url = new URL(req.url ?? "/", `http://localhost:${port}`);
    const pathname = decodeURIComponent(url.pathname === "/" ? defaultPage : url.pathname);
    const isSite = pathname === SITE_BASE.slice(0, -1) || pathname.startsWith(SITE_BASE);

    if (isSite && pathname === SITE_BASE.slice(0, -1)) {
      res.writeHead(301, { Location: SITE_BASE + url.search }).end();
      return;
    }

    let found;
    let status = 200;
    if (isSite) {
      const rel = pathname.slice(SITE_BASE.length);
      const dir = await stat(resolve(siteRoot, "." + sep + rel)).catch(() => null);
      if (dir?.isDirectory() && !pathname.endsWith("/")) {
        res.writeHead(301, { Location: pathname + "/" + url.search }).end(); // like GitHub Pages
        return;
      }
      found = await find(siteRoot, rel);
      if (!found) {
        found = await find(siteRoot, "404.html");
        status = 404;
      }
    } else {
      found = await find(root, pathname.slice(1));
    }
    if (!found) {
      res.writeHead(404).end("not found");
      return;
    }
    res.writeHead(status, {
      "Content-Type": TYPES[extname(found.path).toLowerCase()] ?? "application/octet-stream",
      ...(isSite ? {} : { "Content-Security-Policy": CSP }),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    });
    res.end(req.method === "HEAD" ? undefined : found.body);
  } catch {
    res.writeHead(404).end("not found");
  }
}).listen(port, () =>
  console.log(
    `Serving with strict CSP + Trusted Types on http://localhost:${port}${defaultPage}\n` +
      `Serving the built site (_site) on http://localhost:${port}${SITE_BASE}`,
  ),
);
