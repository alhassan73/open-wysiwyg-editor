// Copies the core stylesheets into a framework package's dist/ (run from that package), so apps
// import them from the package they installed: `@open-wysiwyg-editor/react/style.css`. With pnpm the
// core package isn't hoisted, so `open-wysiwyg-editor/style.css` wouldn't resolve from the app.
import { cp, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const from = fileURLToPath(new URL("../packages/core/dist/", import.meta.url));
const to = `${process.cwd()}/${process.argv[2] ?? "dist"}/`;

await mkdir(to, { recursive: true });
for (const file of ["style.css", "style.min.css", "content.css", "content.min.css"]) {
  await cp(from + file, to + file).catch(() => {
    throw new Error(`Missing ${from}${file}: build packages/core first.`);
  });
}
console.log(`styles: copied into ${to}`);
