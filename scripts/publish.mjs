// Publishes every package whose `name@version` is not on npm yet, in dependency order.
// Usage: node scripts/publish.mjs [--dry-run] [--otp=123456] [--ignore-scripts]
//
// Run by .github/workflows/release.yml with npm Trusted Publishing (OIDC): no npm token or 2FA
// code is needed, and every package gets a provenance attestation.
//
// One-time setup: a package must already exist on npm before a trusted publisher can be added,
// so the first publish of each new package is done by hand by running this script locally
// (npm asks for your 2FA). Then `node scripts/setup-trust.mjs` adds the trusted publisher
// (GitHub Actions, `alhassan73/open-wysiwyg-editor`, `release.yml`) to every package; after
// that, tags publish automatically.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Extra flags go straight to npm: --dry-run, --otp=123456, or --ignore-scripts after a full build.
const extra = process.argv.slice(2);
// Dependency order: core first, react before next, etc.
const DIRS = ["core", "react", "next", "preact", "vue", "nuxt", "svelte", "solid", "angular", "astro"];
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const run = (args) => spawnSync(npm, args, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"], shell: process.platform === "win32" });

let failed = false;
for (const dir of DIRS) {
  const pkgFile = join("packages", dir, "package.json");
  if (!existsSync(pkgFile)) continue;
  const { name, version, private: isPrivate } = JSON.parse(readFileSync(pkgFile, "utf8"));
  if (isPrivate) continue;

  const view = run(["view", `${name}@${version}`, "version"]);
  if (view.status === 0 && view.stdout.trim() === version) {
    console.log(`- ${name}@${version} is already on npm, skipping`);
    continue;
  }

  // Angular is published from its ng-packagr output; everything else from its workspace.
  const target = dir === "angular" ? ["packages/angular/dist"] : ["--workspace", name];
  const args = ["publish", ...target, "--access", "public", ...extra];
  console.log(`> npm ${args.join(" ")}`);
  const res = spawnSync(npm, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (res.status !== 0) {
    failed = true;
    console.error(`x ${name}@${version} failed to publish`);
    break; // later packages depend on earlier ones
  }
}
process.exit(failed ? 1 : 0);
