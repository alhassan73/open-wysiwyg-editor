// Verifies every runtime dependency (transitively) of published packages uses an allowed license.
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";

const ALLOWED = new Set(["MIT", "ISC", "BSD-2-Clause", "BSD-3-Clause", "Apache-2.0", "0BSD", "MPL-2.0", "BlueOak-1.0.0"]);
const PACKAGES = ["packages/editor"];

/** Allowed when the SPDX expression has at least one allowed alternative (e.g. "(MPL-2.0 OR Apache-2.0)"). */
const allowed = (expr) =>
  typeof expr === "string" &&
  expr
    .replace(/[()]/g, "")
    .split(/\s+OR\s+/i)
    .some((alt) => alt.split(/\s+AND\s+/i).every((id) => ALLOWED.has(id.trim())));

const seen = new Map();
function visit(name, fromDir) {
  if (seen.has(name)) return;
  const require = createRequire(join(fromDir, "noop.js"));
  let pkgPath;
  try {
    pkgPath = require.resolve(`${name}/package.json`);
  } catch {
    // Packages without an exported package.json: walk up from the main entry.
    let dir = dirname(require.resolve(name));
    while (!existsSync(join(dir, "package.json"))) dir = dirname(dir);
    pkgPath = join(dir, "package.json");
  }
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  seen.set(name, pkg.license ?? "UNKNOWN");
  for (const dep of Object.keys(pkg.dependencies ?? {})) visit(dep, dirname(pkgPath));
}

for (const dir of PACKAGES) {
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  for (const dep of Object.keys(pkg.dependencies ?? {})) visit(dep, resolve(dir));
}

let bad = 0;
for (const [name, license] of [...seen].sort()) {
  const ok = allowed(license);
  if (!ok) bad++;
  console.log(`${ok ? "✓" : "✗"} ${name}: ${license}`);
}
console.log(`${seen.size} runtime dependencies checked.`);
process.exit(bad ? 1 : 0);
