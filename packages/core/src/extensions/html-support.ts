import type { DOMOutputSpec, Mark, MarkSpec, Node as PMNode, NodeSpec } from "prosemirror-model";
import { defineExtension } from "../core/extension";
import { sanitizeUrl, type UrlPolicy } from "../core/url";

/**
 * One allowlist rule. Strings support a trailing "*" wildcard ("data-*", "aria-*").
 *
 * ```ts
 * HtmlSupport.configure({ allow: [
 *   { name: "section", classes: true, attributes: ["data-*", "id"] },
 *   { name: /^(span|abbr)$/, attributes: ["title", "lang"], classes: ["highlight", /^tag-/] },
 *   { name: "p", styles: ["color", "background-color"] },
 * ]})
 * ```
 */
export interface HtmlRule {
  name: string | RegExp;
  attributes?: true | Array<string | RegExp>;
  classes?: true | Array<string | RegExp>;
  /** CSS properties allowed in `style`. Note: inline styles in the live editor need
   * `style-src-attr 'unsafe-inline'` under CSP; leave this out to stay strict-CSP clean. */
  styles?: true | Array<string | RegExp>;
}

export interface HtmlSupportOptions {
  /** Rules for markup to keep, or "safe" for a sensible preset (no styles, no scripts). */
  allow: HtmlRule[] | "safe";
  /** Rules that win over `allow`. */
  disallow: HtmlRule[];
}

/** Elements kept as generic block containers (content: blocks). */
export const HTML_CONTAINERS = [
  "div", "section", "article", "aside", "header", "footer", "nav", "main", "address", "hgroup",
  "details", "dl", "dd", "center", "search",
];
/** Elements kept as generic text blocks (content: inline). */
export const HTML_TEXTBLOCKS = ["summary", "dt"];
/** Elements kept as generic inline wrappers. */
export const HTML_INLINE = [
  "span", "abbr", "cite", "dfn", "kbd", "mark", "q", "small", "time", "var", "samp", "bdi", "bdo",
  "data", "big", "ruby", "rt", "rp",
];

/** Element names of the built-in node/mark types that may receive extra attributes. */
const KNOWN_TYPES = [
  "paragraph", "heading", "blockquote", "bulletList", "orderedList", "listItem", "taskList", "taskItem",
  "codeBlock", "horizontalRule", "image", "table", "tableRow", "tableCell", "tableHeader",
  "bold", "italic", "underline", "strike", "code", "subscript", "superscript", "link",
];

export const HTML_SAFE_RULES: HtmlRule[] = [
  {
    name: new RegExp(`^(${[...HTML_CONTAINERS, ...HTML_TEXTBLOCKS].join("|")})$`),
    attributes: ["data-*", "id", "title", "lang", "aria-label", "aria-labelledby", "aria-describedby", "role"],
    classes: true,
  },
  {
    name: new RegExp(`^(${HTML_INLINE.join("|")})$`),
    attributes: ["data-*", "title", "lang", "dir", "datetime", "value", "cite", "translate"],
    classes: true,
  },
  {
    name: /^(p|h[1-6]|blockquote|ul|ol|li|table|tr|td|th|pre|code|figure|img|a|strong|em|u|s|sub|sup|hr)$/,
    attributes: ["data-*", "id", "lang", "translate"],
    classes: true,
  },
];

/** Attributes managed by the schema itself, never through HtmlSupport. */
const RESERVED = new Set([
  "src", "srcset", "href", "alt", "width", "height", "start", "type", "dir", "colspan", "rowspan",
  "colwidth", "scope", "title", "data-type", "data-checked", "data-colwidth", "data-language", "open",
]);
/** Never kept, whatever the rules say. */
const DENIED = /^(on|xmlns|xlink)|^(srcdoc|formaction|action|ping|background|tabindex|accesskey|autofocus|contenteditable|draggable|hidden|inert|popover|popovertarget|is|slot|part|nonce|style|class)$|^data-(pm|owe)-/i;
const URL_ATTRS = new Set(["cite", "longdesc"]);
const ROLES = new Set(["note", "region", "group", "figure", "doc-note", "doc-example", "doc-tip", "doc-pullquote", "doc-epigraph", "presentation", "none"]);
const CLASS = /^-?[A-Za-z_][\w-]{0,63}$/;
const ID = /^[A-Za-z][\w:.-]{0,63}$/;
const LANG = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{1,8})*$/;
// eslint-disable-next-line no-control-regex
const UNSAFE_VALUE = /[\u0000-\u001f]/;
const UNSAFE_CSS = /url\s*\(|expression\s*\(|javascript:|@import|[<>\\]|behavior\s*:|-moz-binding/i;

type Attrs = Record<string, string>;

const matchesName = (pattern: string | RegExp, name: string): boolean =>
  typeof pattern === "string"
    ? pattern.endsWith("*")
      ? name.startsWith(pattern.slice(0, -1).toLowerCase())
      : pattern.toLowerCase() === name
    : pattern.test(name);

const allowedBy = (list: true | Array<string | RegExp> | undefined, name: string): boolean =>
  list === true || (!!list && list.some((p) => matchesName(p, name)));

export function createHtmlFilter(options: HtmlSupportOptions, policy: UrlPolicy = {}) {
  const allow = options.allow === "safe" ? HTML_SAFE_RULES : options.allow;
  const deny = options.disallow;
  const rulesFor = (tag: string, rules: HtmlRule[]) => rules.filter((r) => matchesName(r.name, tag));

  const tagAllowed = (tag: string) =>
    rulesFor(tag, allow).length > 0 && !rulesFor(tag, deny).some((r) => !r.attributes && !r.classes && !r.styles);

  function permits(tag: string, kind: "attributes" | "classes" | "styles", name: string): boolean {
    const yes = rulesFor(tag, allow).some((r) => allowedBy(r[kind], name));
    const no = rulesFor(tag, deny).some((r) => allowedBy(r[kind], name));
    return yes && !no;
  }

  function validValue(name: string, value: string): string | null {
    if (value.length > 2000 || UNSAFE_VALUE.test(value)) return null;
    if (URL_ATTRS.has(name)) return sanitizeUrl(value, policy);
    if (name === "id") {
      if (!ID.test(value)) return null;
      // Ids that shadow window/document properties enable DOM clobbering.
      if (typeof window !== "undefined" && (value in window || value in document)) return null;
    }
    if (name === "lang" && !LANG.test(value)) return null;
    if (name === "role" && !ROLES.has(value)) return null;
    if (name === "dir" && !/^(ltr|rtl|auto)$/.test(value)) return null;
    return value;
  }

  /** Filters an element's attributes. `reserved` excludes attributes the schema already owns. */
  function filter(tag: string, read: (name: string) => string | null, names: string[], reserved: boolean): Attrs | null {
    const out: Attrs = {};
    for (const raw of names) {
      const name = raw.toLowerCase();
      const value = read(raw);
      if (value === null) continue;
      if (name === "class") {
        const classes = value
          .split(/\s+/)
          .filter((c) => c && CLASS.test(c) && !/^(owe-|ProseMirror)/.test(c) && permits(tag, "classes", c));
        if (classes.length) out.class = classes.join(" ");
        continue;
      }
      if (name === "style") {
        const decls: string[] = [];
        for (const decl of value.split(";")) {
          const i = decl.indexOf(":");
          if (i < 1) continue;
          const prop = decl.slice(0, i).trim().toLowerCase();
          const val = decl.slice(i + 1).trim();
          if (!/^-?[a-z][a-z-]*$/.test(prop) || !val || UNSAFE_CSS.test(val) || val.length > 200) continue;
          if (permits(tag, "styles", prop)) decls.push(`${prop}: ${val}`);
        }
        if (decls.length) out.style = decls.join("; ");
        continue;
      }
      if (DENIED.test(name) || (reserved && RESERVED.has(name))) continue;
      if (!permits(tag, "attributes", name)) continue;
      const valid = validValue(name, value);
      if (valid !== null) out[name] = valid;
    }
    return Object.keys(out).length ? out : null;
  }

  const fromElement = (el: Element, reserved: boolean) =>
    filter(el.tagName.toLowerCase(), (n) => el.getAttribute(n), el.getAttributeNames(), reserved);

  /** Re-validates stored attributes at render time (JSON input bypasses parsing). */
  const revalidate = (tag: string, value: unknown, reserved: boolean): Attrs | null => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const stored = value as Record<string, unknown>;
    const names = Object.keys(stored).filter((k) => Object.prototype.hasOwnProperty.call(stored, k));
    return filter(tag, (n) => (typeof stored[n] === "string" ? (stored[n] as string) : null), names, reserved);
  };

  return { tagAllowed, fromElement, revalidate };
}

const NODE_TAG: Record<string, string> = {
  paragraph: "p", blockquote: "blockquote", bulletList: "ul", orderedList: "ol", listItem: "li",
  taskList: "ul", taskItem: "li", codeBlock: "pre", horizontalRule: "hr", image: "img", table: "table",
  tableRow: "tr", tableCell: "td", tableHeader: "th", bold: "strong", italic: "em", underline: "u",
  strike: "s", code: "code", subscript: "sub", superscript: "sup", link: "a",
};
const tagOf = (owner: PMNode | Mark): string =>
  owner.type.name === "heading" ? `h${owner.attrs.level as number}` : (NODE_TAG[owner.type.name] ?? "div");

/**
 * General HTML support: keeps markup the editor doesn't model natively — wrappers like
 * <section>/<div>, inline elements like <abbr title>/<span lang>, and extra classes, data-*, ids
 * and (opt-in) styles on known elements — within an allowlist. Everything still passes the
 * sanitizer, URL policy and output validation.
 */
export const HtmlSupport = defineExtension<HtmlSupportOptions>({
  name: "htmlSupport",
  priority: 90,
  defaultOptions: { allow: "safe", disallow: [] },
  nodes: (options, { urlPolicy }): Record<string, NodeSpec> => {
    const f = createHtmlFilter(options, urlPolicy);
    const containers = HTML_CONTAINERS.filter(f.tagAllowed);
    const textblocks = HTML_TEXTBLOCKS.filter(f.tagAllowed);
    const nodeSpec = (tags: string[], content: string): NodeSpec => ({
      attrs: { tag: { default: tags[0] ?? "div" }, attributes: { default: null } },
      content,
      group: "block",
      parseDOM: tags.map((tag) => ({
        tag,
        priority: 40,
        getAttrs: (el: HTMLElement) => ({ tag, attributes: f.fromElement(el, false) }),
      })),
      toDOM: (node: PMNode) => {
        const tag = tags.includes(node.attrs.tag as string) ? (node.attrs.tag as string) : "div";
        const attrs: Attrs = { ...(f.revalidate(tag, node.attrs.attributes, false) ?? {}) };
        if (tag === "details") attrs.open = ""; // keep collapsible content editable/visible
        return [tag, attrs, 0] as DOMOutputSpec;
      },
    });
    return {
      ...(containers.length ? { htmlContainer: nodeSpec(containers, "block+") } : {}),
      ...(textblocks.length ? { htmlTextblock: nodeSpec(textblocks, "inline*") } : {}),
    };
  },
  marks: (options, { urlPolicy }): Record<string, MarkSpec> => {
    const f = createHtmlFilter(options, urlPolicy);
    const tags = HTML_INLINE.filter(f.tagAllowed);
    if (!tags.length) return {};
    return {
      htmlInline: {
        attrs: { tag: { default: "span" }, attributes: { default: null } },
        excludes: "", // different wrappers (and nested spans) can coexist
        parseDOM: tags.map((tag) => ({
          tag,
          priority: 40,
          getAttrs: (el: HTMLElement) => {
            const attributes = f.fromElement(el, false);
            // A bare <span> carries no meaning — let its content parse normally.
            if (tag === "span" && !attributes) return false;
            return { tag, attributes };
          },
        })),
        toDOM: (mark: Mark) => {
          const tag = tags.includes(mark.attrs.tag as string) ? (mark.attrs.tag as string) : "span";
          return [tag, f.revalidate(tag, mark.attrs.attributes, false) ?? {}, 0] as DOMOutputSpec;
        },
      },
    };
  },
  globalAttributes: (options) => {
    const f = createHtmlFilter(options);
    return [
      {
        types: KNOWN_TYPES,
        attributes: {
          htmlAttributes: {
            default: null,
            parseHTML: (el) => f.fromElement(el, true),
            renderHTML: (value, owner) => f.revalidate(tagOf(owner), value, true),
          },
        },
      },
    ];
  },
});
