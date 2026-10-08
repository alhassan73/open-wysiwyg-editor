// Run after `next build`: copies examples/out -> <repo>/_site and adds a Content-Security-Policy <meta>
// to every page. GitHub Pages cannot send headers, and Next inlines a few scripts (flight data, the
// theme script), so each executable inline script is allowed by its sha256 hash instead of 'unsafe-inline'.
import { createHash } from "node:crypto";
import { cp, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const examples = path.resolve(here, "..");
const repo = path.resolve(examples, "..");
const OUT = path.join(examples, "out");
const SITE = path.join(repo, "_site");
const SOCIAL = path.join(repo, ".github", "assets", "social-preview.png");

const exists = (p) => stat(p).then(() => true, () => false);

if (!(await exists(OUT))) {
  console.error(`export: ${path.relative(repo, OUT)} not found. Run "next build" first (npm run site does both).`);
  process.exit(1);
}
if (!(await exists(SOCIAL))) {
  console.error(`export: missing ${path.relative(repo, SOCIAL)}.`);
  process.exit(1);
}

await rm(SITE, { recursive: true, force: true });
await cp(OUT, SITE, { recursive: true });
await cp(SOCIAL, path.join(SITE, "social-preview.png"));
await writeFile(path.join(SITE, ".nojekyll"), "");

// Next writes the prefetch segments of nested routes into folders (en/api/__next.$d$locale/api/__PAGE__.txt),
// but the router requests them flat, with dots (en/api/__next.$d$locale.api.__PAGE__.txt). A static host cannot
// rewrite, so every link prefetch would 404: flatten them to the names the router asks for.
const SEGMENT = /(^|[\\/])(__next\.[^\\/]+)[\\/](.+)$/;
const segmentDirs = new Set();
for (const rel of await readdir(SITE, { recursive: true })) {
  const m = SEGMENT.exec(rel);
  if (!m || !(await stat(path.join(SITE, rel))).isFile()) continue;
  const parent = rel.slice(0, m.index + m[1].length);
  segmentDirs.add(path.join(SITE, parent, m[2]));
  const flat = path.join(SITE, parent, `${m[2]}.${m[3].replace(/[\\/]/g, ".")}`);
  if (await exists(flat)) throw new Error(`export: ${path.relative(SITE, flat)} already exists.`);
  await rename(path.join(SITE, rel), flat);
}
for (const dir of segmentDirs) await rm(dir, { recursive: true, force: true });

const SCRIPT = /<script\b((?:"[^"]*"|'[^']*'|[^>"'])*)>([\s\S]*?)<\/script\s*>/gi;
const HAS_SRC = /(?:^|\s)src\s*=/i;
const TYPE = /(?:^|\s)type\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i;
// Script types that run. Everything else (application/ld+json, application/json, ...) is data.
const EXECUTABLE = new Set(["", "text/javascript", "application/javascript", "module"]);

/** Hash of an inline script exactly as the browser sees it (the HTML parser turns CRLF/CR into LF). */
const hash = (text) =>
  "'sha256-" + createHash("sha256").update(text.replace(/\r\n?/g, "\n"), "utf8").digest("base64") + "'";

function inlineScriptHashes(html) {
  const hashes = new Set();
  for (const [, attrs, text] of html.matchAll(SCRIPT)) {
    if (HAS_SRC.test(attrs) || text.length === 0) continue;
    const m = TYPE.exec(attrs);
    const type = (m ? (m[1] ?? m[2] ?? m[3]) : "").trim().toLowerCase();
    if (EXECUTABLE.has(type)) hashes.add(hash(text));
  }
  return [...hashes].sort();
}

function policy(hashes) {
  return [
    "default-src 'self'",
    ["script-src 'self'", ...hashes].join(" "),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "require-trusted-types-for 'script'",
    // "default": the guarded policy of TrustedTypesScript, for the route chunks Turbopack loads.
    "trusted-types default open-wysiwyg-editor ProseMirrorClipboard nextjs#bundler 'allow-duplicates'",
  ].join("; ");
}

// Insert right after <head>, but after a leading <meta charset> so the encoding stays in the first 1024 bytes.
const HEAD = /<head(?:\s[^>]*)?>(\s*<meta\s+charset=[^>]*>)?/i;

const files = (await readdir(SITE, { recursive: true })).filter((f) => f.endsWith(".html"));
let totalHashes = 0;
let maxHashes = 0;
let maxBytes = 0;

for (const rel of files) {
  const file = path.join(SITE, rel);
  const html = await readFile(file, "utf8");
  if (/http-equiv=["']?Content-Security-Policy/i.test(html)) {
    throw new Error(`export: ${rel} already has a CSP meta.`);
  }
  const head = HEAD.exec(html);
  if (!head) throw new Error(`export: no <head> in ${rel}.`);

  const hashes = inlineScriptHashes(html);
  const meta = `<meta http-equiv="Content-Security-Policy" content="${policy(hashes)}">`;
  const at = head.index + head[0].length;
  await writeFile(file, html.slice(0, at) + meta + html.slice(at));

  totalHashes += hashes.length;
  maxHashes = Math.max(maxHashes, hashes.length);
  maxBytes = Math.max(maxBytes, meta.length);
}

console.log(`export: ${path.relative(repo, OUT)} -> ${path.relative(repo, SITE)}`);
console.log(`  ${files.length} HTML page(s): ${files.map((f) => f.replace(/\\/g, "/")).join(", ")}`);
console.log(`  CSP meta added to each: ${totalHashes} inline-script hash(es) in total, up to ${maxHashes} per page (${maxBytes} bytes max).`);
console.log("  wrote .nojekyll and social-preview.png");
