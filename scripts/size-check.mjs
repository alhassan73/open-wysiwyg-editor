// Fails CI when a published bundle grows past its gzip budget.
import { existsSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const budgets = [
  // Everything (engine + all StarterKit extensions + tables + sanitizer + UI + en/ar labels).
  ["packages/core/dist/open-wysiwyg-editor.global.js", 150_000],
  ["packages/core/dist/style.min.css", 12_000],
  ["packages/core/dist/content.min.css", 6_000],
  // Framework wrappers are thin: the editor itself is an external dependency.
  ...["react", "next", "preact", "vue", "svelte", "solid"].map((p) => [`packages/${p}/dist/index.js`, 4_000]),
];

let failed = false;
for (const [file, limit] of budgets) {
  if (!existsSync(file)) {
    console.log(`- ${file}: not built, skipped`);
    continue;
  }
  const size = gzipSync(readFileSync(file), { level: 9 }).length;
  const ok = size <= limit;
  failed ||= !ok;
  console.log(`${ok ? "✓" : "✗"} ${file}: ${(size / 1000).toFixed(1)} kB gzip (budget ${limit / 1000} kB)`);
}
process.exit(failed ? 1 : 0);
