// Fails CI when a published bundle grows past its gzip budget.
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const budgets = [
  // Everything (engine + all StarterKit extensions + tables + sanitizer + UI + en/ar labels).
  ["packages/editor/dist/open-wysiwyg-editor.global.js", 150_000],
  ["packages/editor/dist/style.min.css", 12_000],
  ["packages/editor/dist/content.min.css", 6_000],
];

let failed = false;
for (const [file, limit] of budgets) {
  const size = gzipSync(readFileSync(file), { level: 9 }).length;
  const ok = size <= limit;
  failed ||= !ok;
  console.log(`${ok ? "✓" : "✗"} ${file}: ${(size / 1000).toFixed(1)} kB gzip (budget ${limit / 1000} kB)`);
}
process.exit(failed ? 1 : 0);
