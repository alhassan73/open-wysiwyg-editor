import { defineConfig } from "tsup";

const banner = `/*! open-wysiwyg-editor | MIT License | https://github.com/alhassan73/open-wysiwyg-editor */`;

export default defineConfig([
  {
    entry: { index: "src/index.ts", headless: "src/headless.ts", element: "src/element.ts" },
    format: ["esm", "cjs"],
    // Shared chunks in CJS too, so `/element` and the main entry drive one editor module.
    splitting: true,
    dts: true,
    clean: true,
    sourcemap: true,
    target: "es2020",
    treeshake: true,
    banner: { js: banner },
    esbuildOptions(o) {
      o.charset = "utf8"; // keep Arabic labels as UTF-8 instead of \u escapes (≈3× smaller)
      o.legalComments = "inline";
    },
  },
  {
    entry: { "open-wysiwyg-editor": "src/global.ts" },
    format: ["iife"],
    globalName: "OpenWysiwygEditor",
    outExtension: () => ({ js: ".global.js" }),
    minify: true,
    sourcemap: false, // a 1.7 MB map for a CDN file; debug with the ESM/CJS builds' maps instead
    target: "es2020",
    noExternal: [/.*/], // the script-tag build is self-contained
    banner: { js: banner },
    esbuildOptions(o) {
      o.charset = "utf8";
      o.legalComments = "inline";
    },
  },
]);
