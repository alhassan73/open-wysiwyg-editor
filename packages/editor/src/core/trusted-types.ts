/**
 * The single Trusted Types policy used by the editor. It is only ever handed to DOMPurify
 * (which parses into an inert document and sanitizes) — never used to write to a live sink.
 *
 * Integrators enforcing Trusted Types should allow:
 *   trusted-types open-wysiwyg-editor ProseMirrorClipboard;
 *   require-trusted-types-for 'script';
 */
export const TRUSTED_TYPES_POLICY_NAME = "open-wysiwyg-editor";

export interface PolicyLike {
  createHTML(input: string): unknown;
  createScriptURL(input: string): unknown;
}

interface TrustedTypesFactory {
  createPolicy(
    name: string,
    rules: { createHTML?: (s: string) => string; createScriptURL?: (s: string) => string },
  ): PolicyLike;
}

const REGISTRY = Symbol.for("open-wysiwyg-editor.tt-policy");
type Store = { [REGISTRY]?: PolicyLike | null };

let custom: PolicyLike | null | undefined;

/** Lets integrators supply their own policy (e.g. one created under a different allowed name). */
export function setTrustedTypesPolicy(policy: PolicyLike | null): void {
  custom = policy;
}

export function getTrustedTypesPolicy(): PolicyLike | null {
  if (custom !== undefined) return custom;
  const store = globalThis as Store;
  if (store[REGISTRY] !== undefined) return store[REGISTRY] ?? null;
  const tt = (globalThis as { trustedTypes?: TrustedTypesFactory }).trustedTypes;
  let policy: PolicyLike | null = null;
  if (tt && typeof tt.createPolicy === "function") {
    try {
      policy = tt.createPolicy(TRUSTED_TYPES_POLICY_NAME, {
        createHTML: (s) => s,
        // DOMPurify requires this hook; the editor never produces script URLs.
        createScriptURL: () => "",
      });
    } catch {
      policy = null; // policy name not allowed by CSP — DOMPurify falls back to its own policy.
    }
  }
  store[REGISTRY] = policy;
  return policy;
}
