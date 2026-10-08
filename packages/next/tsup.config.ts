import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  target: "es2020",
  // Client Component boundary: pages and layouts (Server Components) can render it directly.
  banner: { js: '"use client";' },
});
