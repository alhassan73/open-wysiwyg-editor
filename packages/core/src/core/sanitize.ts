import DOMPurify, { type Config } from "dompurify";
import { getTrustedTypesPolicy } from "./trusted-types";

/** Elements that never reach the schema parser. Embeds come back only through vetted node types. */
export const FORBIDDEN_TAGS = [
  "script",
  "style",
  "iframe",
  "frame",
  "frameset",
  "object",
  "embed",
  "applet",
  "form",
  "input",
  "button",
  "select",
  "textarea",
  "option",
  "base",
  "meta",
  "link",
  "template",
  "noscript",
  "svg",
  "math",
];

const DROPPED_CONTENTS = [
  "script", "style", "template", "noscript", "iframe", "frame", "frameset", "object", "embed",
  "applet", "svg", "math", "select", "option", "textarea", "button", "head", "title",
];

/** Attributes removed on top of DOMPurify's defaults (which already drop on* handlers). */
export const FORBIDDEN_ATTRS = ["srcdoc", "formaction", "xlink:href", "action", "ping"];

function config(extra?: Config): Config {
  const policy = getTrustedTypesPolicy();
  return {
    FORBID_TAGS: FORBIDDEN_TAGS,
    FORBID_ATTR: FORBIDDEN_ATTRS,
    // Drop the *contents* of these too (not just the tags): CSS, scripts, form widgets, etc.
    ADD_FORBID_CONTENTS: DROPPED_CONTENTS,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    // Pasted Office/Google Docs content carries formatting in `style`; the schema parser reads
    // only the specific properties it understands and never copies raw style into the document.
    ...(policy ? { TRUSTED_TYPES_POLICY: policy as Config["TRUSTED_TYPES_POLICY"] } : {}),
    ...extra,
  };
}

/**
 * Removes <style> blocks and Office conditional comments *before* parsing. Not a security step
 * (DOMPurify runs next) — it stops browsers from emitting CSP `style-src` violation reports for
 * every paste from Word/Google Docs on sites with a strict policy.
 */
export function stripInertBlocks(html: string): string {
  return html
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, "")
    .replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, "")
    .replace(/<xml\b[^>]*>[\s\S]*?<\/xml\s*>/gi, "");
}

/**
 * Raw `style` attributes are carried as `data-owe-style` until schema parsing. Chromium applies the
 * page's CSP to inert parsing documents too: under `style-src` without 'unsafe-inline' every parsed
 * `style=""` raises a violation report *and* is left out of `element.style`, which is where
 * ProseMirror reads styles — so alignment, colors and Google Docs bold/italic were silently lost.
 */
export const STYLE_DATA_ATTR = "data-owe-style";

// `<tag` + any attributes (quoted values may contain `>` or "style") + whitespace + `style`.
const STYLE_ATTR =
  /(<[a-z][^\s/>]*(?:\s+[^\s/>="']+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*?\s+)style(?=\s*=)/gi;

/** Renames `style` attributes in an HTML string so parsing it never evaluates inline CSS. */
export function protectStyles(html: string): string {
  return html.replace(STYLE_ATTR, `$1${STYLE_DATA_ATTR}`);
}

/**
 * Turns `data-owe-style` back into real styles through the CSSOM (`style.cssText`), which CSP
 * permits, right before ProseMirror parses the nodes. Only properties the browser understands
 * survive; the schema's parse rules then read just the ones they know.
 */
export function restoreStyles(root: Node): void {
  const scope = root as Partial<ParentNode>;
  if (typeof scope.querySelectorAll !== "function") return; // a text node: nothing to restore
  for (const el of [...scope.querySelectorAll<HTMLElement>(`[${STYLE_DATA_ATTR}]`)]) {
    const css = el.getAttribute(STYLE_DATA_ATTR) ?? "";
    el.removeAttribute(STYLE_DATA_ATTR);
    if (el.style) el.style.cssText = css;
  }
}

/** Clipboard/drop HTML → sanitized string handed to ProseMirror's clipboard parser. */
export function sanitizePastedHTML(html: string): string {
  return DOMPurify.sanitize(stripInertBlocks(html), { ...config(), RETURN_TRUSTED_TYPE: false }) as string;
}

/**
 * Sanitizes an HTML string and returns a DocumentFragment that belongs to an inert document
 * (nothing in it loads or executes). Used for every HTML input path before schema parsing.
 * Inline styles come back as `data-owe-style`: call `restoreStyles()` before parsing.
 */
export function sanitizeToFragment(html: string): DocumentFragment {
  // The wrapper keeps leading <style>/<meta>/<title> in <body> (instead of being hoisted into
  // <head>), so their contents are reliably dropped. The fragment is used as-is — never
  // re-serialized — so the wrapper can't introduce mutation XSS.
  const fragment = DOMPurify.sanitize(`<div data-owe-wrap="">${protectStyles(stripInertBlocks(html))}</div>`, {
    ...config(),
    RETURN_DOM_FRAGMENT: true,
  }) as DocumentFragment;
  // Unwrap, so a real <div> in the content (kept by HtmlSupport) is never confused with ours.
  for (const wrap of [...fragment.children].filter((el) => el.hasAttribute("data-owe-wrap"))) {
    wrap.replaceWith(...wrap.childNodes);
  }
  return fragment;
}

/** Sanitizes an HTML string and returns a string. Requires a DOM (browser, or pass `window`). */
export function sanitizeHTML(html: string, options?: { window?: Window; config?: Config }): string {
  const purify = options?.window
    ? DOMPurify(options.window as unknown as Parameters<typeof DOMPurify>[0])
    : DOMPurify;
  return purify.sanitize(html, { ...config(options?.config), RETURN_TRUSTED_TYPE: false }) as string;
}
