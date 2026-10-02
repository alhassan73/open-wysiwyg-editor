// Bundles src/styles/*.css into dist/style.css (editor UI + content) and dist/content.css
// (content only, for the page that displays saved HTML). No dependencies: plain concatenation
// plus a conservative whitespace/comment minifier for the .min.css variants.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(join(root, "src/styles", name), "utf8");
const banner = "/*! open-wysiwyg-editor | MIT License */\n";

const minify = (css) =>
  css
    .replace(/\/\*(?!!)[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    // Never strip whitespace *before* ":" — `.a :is(b)` (descendant) ≠ `.a:is(b)` (compound).
    .replace(/\s*([{};,>])\s*/g, "$1")
    .replace(/:\s+/g, ":")
    .replace(/;}/g, "}")
    .trim();

const outputs = {
  "style.css": ["tokens.css", "editor.css", "ui.css", "content.css"],
  "content.css": ["tokens.css", "content.css"],
};

mkdirSync(join(root, "dist"), { recursive: true });
for (const [file, parts] of Object.entries(outputs)) {
  const css = banner + parts.map(read).join("\n");
  writeFileSync(join(root, "dist", file), css);
  writeFileSync(join(root, "dist", file.replace(".css", ".min.css")), banner + minify(css));
}
console.log("css: wrote", Object.keys(outputs).join(", "));
