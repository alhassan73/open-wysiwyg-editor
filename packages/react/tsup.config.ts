import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  target: "es2020",
  // Marks the component as a Client Component for the Next.js App Router.
  banner: { js: '"use client";' },
});
