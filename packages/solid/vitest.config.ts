import { defineConfig } from "vitest/config";

export default defineConfig({
  // solid-js has a server build where effects never run; the tests need the browser one.
  resolve: { conditions: ["browser", "development"] },
  test: {
    environment: "jsdom",
    include: ["test/**/*.test.ts"],
    server: { deps: { inline: [/solid-js/] } },
  },
});
