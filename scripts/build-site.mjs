// Assembles the GitHub Pages site (_site/) from the playground and the built package.
// Run `npm run build` first. Pages can't send headers, so the strict CSP the local server sends is
// added as a <meta> tag — the published demo runs under the same policy it advertises.
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const site = `${root}_site`;
const dist = `${root}packages/editor/dist`;
const playground = `${root}apps/playground`;

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: https:",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "require-trusted-types-for 'script'",
  "trusted-types open-wysiwyg-editor ProseMirrorClipboard",
].join("; ");

await rm(site, { recursive: true, force: true });
await mkdir(`${site}/dist`, { recursive: true });

for (const file of ["open-wysiwyg-editor.global.js", "style.min.css"]) {
  await cp(`${dist}/${file}`, `${site}/dist/${file}`).catch(() => {
    throw new Error(`Missing ${file} — run \`npm run build\` first.`);
  });
}
for (const file of ["demo.js", "demo.css", "sample.svg"]) await cp(`${playground}/${file}`, `${site}/${file}`);

const html = (await readFile(`${playground}/index.html`, "utf8"))
  .replaceAll("../../packages/editor/dist/", "./dist/")
  .replace('<meta charset="utf-8" />', `<meta charset="utf-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`)
  .replace("Served locally with", "Served with");
if (html.includes("../../")) throw new Error("index.html still references files outside the site");
await writeFile(`${site}/index.html`, html);
await writeFile(`${site}/.nojekyll`, "");

console.log("Site assembled in _site/");
