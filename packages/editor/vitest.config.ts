import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // jsdom: DOMPurify's officially supported DOM (happy-dom mis-sanitizes, which would make the
    // security tests pass for the wrong reason). Layout APIs are polyfilled in test/setup.ts.
    environment: "jsdom",
    setupFiles: ["test/setup.ts"],
    include: ["test/**/*.test.ts"],
  },
});
