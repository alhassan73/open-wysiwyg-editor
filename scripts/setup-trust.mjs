// One-time setup: lets .github/workflows/release.yml publish every package through npm Trusted
// Publishing (OIDC), so releases need no npm token or 2FA code.
// Usage: node scripts/setup-trust.mjs [--dry-run] [--otp=123456]
//
// Run it after each package exists on npm (first publish by hand: `node scripts/publish.mjs`).
// It uses `npm trust github` from the latest npm, and npm asks for your 2FA once per package.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO = "alhassan73/open-wysiwyg-editor";
const WORKFLOW = "release.yml";
const DIRS = ["core", "react", "next", "preact", "vue", "nuxt", "svelte", "solid", "angular", "astro"];
// Extra flags go straight to npm: --dry-run, --otp=123456.
const extra = process.argv.slice(2);
const npx = process.platform === "win32" ? "npx.cmd" : "npx";

let failed = 0;
for (const dir of DIRS) {
  const { name, private: isPrivate } = JSON.parse(readFileSync(join("packages", dir, "package.json"), "utf8"));
  if (isPrivate) continue;
  const args = ["-y", "npm@latest", "trust", "github", name, "--file", WORKFLOW, "--repository", REPO, "--allow-publish", "--yes"];
  args.push(...extra);
  console.log(`> npm trust github ${name}`);
  const res = spawnSync(npx, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (res.status !== 0) {
    failed++;
    console.error(`x ${name}: trusted publisher not set (does the package exist on npm yet?)`);
  }
}
process.exit(failed ? 1 : 0);
