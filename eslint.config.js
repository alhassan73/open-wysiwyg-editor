import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/dist/**", "_site/**", "playwright-report/**", "test-results/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      // Security: forbid dynamic code and raw HTML sinks outside the audited trusted-types module.
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-restricted-properties": [
        "error",
        { property: "innerHTML", message: "Use h()/textContent or src/core/trusted-types.ts." },
        { property: "outerHTML", message: "Use the serializer." },
        { property: "insertAdjacentHTML", message: "Use h()." },
        { object: "document", property: "write", message: "Never." },
        { object: "document", property: "execCommand", message: "Deprecated; use editor commands." },
      ],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  {
    files: ["**/*.test.ts", "e2e/**", "apps/**"],
    rules: { "no-restricted-properties": "off" },
  },
);
