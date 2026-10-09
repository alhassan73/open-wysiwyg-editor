import type { DOMOutputSpec, Fragment, Mark, Node as PMNode } from "prosemirror-model";
import type { HTMLRenderer } from "./schema";
import { sanitizeUrl, type UrlPolicy } from "./url";

const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr",
]);
const NAME = /^[a-zA-Z][a-zA-Z0-9-]*$/;
const ATTR_NAME = /^[a-zA-Z_:][a-zA-Z0-9_.:-]*$/;
/** Never emitted, whatever an extension's toDOM returns. */
const FORBIDDEN_OUTPUT = new Set([
  "script", "style", "base", "meta", "link", "object", "embed", "applet", "frame", "frameset",
  "template", "noscript", "form",
  // Foreign content: SVG animation attributes (values/to/from) can set javascript: URLs.
  "svg", "math",
]);
const URL_ATTRS = new Set(["href", "src", "cite", "poster", "action", "background"]);
/** Checked as image sources: http(s), plus raster data: images when the policy allows them. */
const IMAGE_ATTRS = new Set(["src", "poster"]);
const DROP_ATTRS = new Set(["srcdoc", "srcset", "formaction", "xlink:href", "ping"]);

const NBSP = new RegExp(String.fromCharCode(160), "g");

export const escapeText = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(NBSP, "&nbsp;");

export const escapeAttr = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

type Hole = () => string;

function renderAttrs(raw: Record<string, unknown>, policy: UrlPolicy): string {
  let attrs = "";
  for (const [name, value] of Object.entries(raw)) {
    if (value === null || value === undefined || value === false) continue;
    const lower = name.toLowerCase();
    if (!ATTR_NAME.test(name) || lower.startsWith("on") || DROP_ATTRS.has(lower)) continue;
    if (URL_ATTRS.has(lower)) {
      const safe = sanitizeUrl(String(value), policy, IMAGE_ATTRS.has(lower) ? "image" : "link");
      if (safe !== null) attrs += ` ${name}="${escapeAttr(safe)}"`;
      continue;
    }
    attrs += value === true || value === "" ? ` ${name}=""` : ` ${name}="${escapeAttr(String(value))}"`;
  }
  return attrs;
}

/**
 * Renders a DOMOutputSpec array to an HTML string. Tag and attribute names are validated, values
 * escaped, URL attributes re-checked and script-capable elements dropped, so output is safe by
 * construction even if an extension's toDOM is careless.
 */
function renderSpec(spec: DOMOutputSpec, hole: Hole | null, policy: UrlPolicy): string {
  if (typeof spec === "string") return escapeText(spec);
  if (!Array.isArray(spec)) {
    throw new Error("[open-wysiwyg-editor] toDOM/toHTML must return an array spec to be serializable.");
  }
  const [rawTag, ...rest] = spec as unknown as [string, ...unknown[]];
  const tag = rawTag.includes(" ") ? rawTag.split(" ")[1]! : rawTag;
  if (!NAME.test(tag)) throw new Error(`[open-wysiwyg-editor] Invalid tag name "${tag}".`);
  if (FORBIDDEN_OUTPUT.has(tag.toLowerCase())) return "";

  let attrs = "";
  let start = 0;
  const first = rest[0];
  if (first && typeof first === "object" && !Array.isArray(first)) {
    start = 1;
    attrs = renderAttrs(first as Record<string, unknown>, policy);
  }
  if (VOID.has(tag.toLowerCase())) return `<${tag}${attrs}>`;

  let inner = "";
  for (let i = start; i < rest.length; i++) {
    const child = rest[i];
    inner += child === 0 ? (hole ? hole() : "") : renderSpec(child as DOMOutputSpec, hole, policy);
  }
  return `<${tag}${attrs}>${inner}</${tag}>`;
}

function renderNodeSpec(node: PMNode): DOMOutputSpec {
  const spec = node.type.spec as { toHTML?: HTMLRenderer; toDOM?: HTMLRenderer };
  const fn = spec.toHTML ?? spec.toDOM;
  if (!fn) throw new Error(`[open-wysiwyg-editor] Node "${node.type.name}" has no toDOM/toHTML.`);
  return fn(node);
}

function markParts(mark: Mark, inline: boolean, policy: UrlPolicy): [string, string] {
  const spec = mark.type.spec as {
    toHTML?: (m: Mark, inline: boolean) => DOMOutputSpec;
    toDOM?: (m: Mark, inline: boolean) => DOMOutputSpec;
  };
  const fn = spec.toHTML ?? spec.toDOM;
  if (!fn) return ["", ""];
  const token = `\u0000${Math.random().toString(36).slice(2)}\u0000`;
  const html = renderSpec(fn(mark, inline), () => token, policy);
  const at = html.indexOf(token);
  return at === -1 ? [html, ""] : [html.slice(0, at), html.slice(at + token.length)];
}

export function serializeNode(node: PMNode, policy: UrlPolicy = {}): string {
  if (node.isText) return escapeText(node.text ?? "");
  return renderSpec(renderNodeSpec(node), () => serializeFragment(node.content, policy), policy);
}

/** Mirrors ProseMirror's DOMSerializer mark nesting: adjacent nodes share open marks. */
export function serializeFragment(fragment: Fragment, policy: UrlPolicy = {}): string {
  let out = "";
  const active: Array<{ mark: Mark; close: string }> = [];
  fragment.forEach((node) => {
    if (active.length || node.marks.length) {
      let keep = 0;
      let rendered = 0;
      while (keep < active.length && rendered < node.marks.length) {
        const next = node.marks[rendered]!;
        if (!next.eq(active[keep]!.mark) || next.type.spec.spanning === false) break;
        keep++;
        rendered++;
      }
      while (keep < active.length) out += active.pop()!.close;
      while (rendered < node.marks.length) {
        const mark = node.marks[rendered++]!;
        const [open, close] = markParts(mark, node.isInline, policy);
        out += open;
        active.push({ mark, close });
      }
    }
    out += serializeNode(node, policy);
  });
  while (active.length) out += active.pop()!.close;
  return out;
}

/** Serializes a document to HTML without touching the DOM (works on servers and under Trusted Types). */
export function docToHTML(doc: PMNode, policy: UrlPolicy = {}): string {
  return serializeFragment(doc.content, policy);
}
