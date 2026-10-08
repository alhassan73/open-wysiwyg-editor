import {
  Schema,
  type DOMOutputSpec,
  type Mark,
  type MarkSpec,
  type Node as PMNode,
  type NodeSpec,
  type TagParseRule,
} from "prosemirror-model";
import type { AnyExtension, GlobalAttributeSpec, SchemaContext } from "./extension";

/** NodeSpec/MarkSpec may carry `toHTML` — the output renderer (falls back to `toDOM`). */
export type HTMLRenderer = (node: PMNode) => DOMOutputSpec;

type Owner = PMNode | Mark;
type Renderer = (owner: Owner, ...rest: unknown[]) => DOMOutputSpec;

export function buildSchema(extensions: AnyExtension[], ctx: SchemaContext): Schema {
  const nodes: Record<string, NodeSpec> = {};
  const marks: Record<string, MarkSpec> = {};

  for (const ext of extensions) {
    Object.assign(nodes, ext.config.nodes?.(ext.options, ctx));
    Object.assign(marks, ext.config.marks?.(ext.options, ctx));
  }
  if (!nodes.doc || !nodes.text) {
    throw new Error("[open-wysiwyg-editor] The Document and Text extensions are required.");
  }

  // Global attributes apply to node *and* mark types (e.g. classes on links).
  for (const ext of extensions) {
    for (const group of ext.config.globalAttributes?.(ext.options) ?? []) {
      for (const type of group.types) {
        if (nodes[type]) nodes[type] = withGlobalAttributes(nodes[type], group.attributes);
        else if (marks[type]) marks[type] = withGlobalAttributes(marks[type], group.attributes);
      }
    }
  }

  // ProseMirror uses the first node of a group as the default block, so paragraph goes first.
  const ordered: Record<string, NodeSpec> = { doc: nodes.doc };
  if (nodes.paragraph) ordered.paragraph = nodes.paragraph;
  for (const [name, spec] of Object.entries(nodes)) if (!(name in ordered)) ordered[name] = spec;

  const schema = new Schema({ nodes: ordered, marks });
  schema.cached.urlPolicy = ctx.urlPolicy;
  return schema;
}

function withGlobalAttributes<S extends NodeSpec | MarkSpec>(spec: S, globals: Record<string, GlobalAttributeSpec>): S {
  const entries = Object.entries(globals);
  const attrs: Record<string, { default?: unknown }> = { ...spec.attrs };
  for (const [name, g] of entries) attrs[name] = { default: g.default ?? null };

  const parseDOM = spec.parseDOM?.map((rule) => {
    if (!("tag" in rule) || !rule.tag) return rule;
    const tagRule = rule as TagParseRule;
    return {
      ...tagRule,
      getAttrs(dom: HTMLElement) {
        const base = tagRule.getAttrs ? tagRule.getAttrs(dom) : (tagRule.attrs ?? null);
        if (base === false) return false;
        const extra: Record<string, unknown> = {};
        for (const [name, g] of entries) {
          const value = g.parseHTML ? g.parseHTML(dom) : dom.getAttribute(name);
          if (value !== null && value !== undefined) extra[name] = value;
        }
        return { ...tagRule.attrs, ...base, ...extra };
      },
    } satisfies TagParseRule;
  });

  const render = (mode: "dom" | "html", owner: Owner, out: DOMOutputSpec): DOMOutputSpec => {
    let extra: Record<string, string> = {};
    for (const [name, g] of entries) {
      const fn = mode === "dom" ? (g.renderDOM ?? g.renderHTML) : g.renderHTML;
      const value = owner.attrs[name];
      const rendered = fn ? fn(value, owner) : value == null ? null : { [name]: String(value) };
      if (rendered) extra = mergeAttrs(extra, rendered);
    }
    return injectAttrs(out, extra);
  };

  const toDOM = spec.toDOM as Renderer | undefined;
  const toHTML = ((spec as { toHTML?: Renderer }).toHTML as Renderer | undefined) ?? toDOM;
  return {
    ...spec,
    attrs,
    parseDOM,
    toDOM: toDOM && ((owner: Owner, ...rest: unknown[]) => render("dom", owner, toDOM(owner, ...rest))),
    toHTML: toHTML && ((owner: Owner, ...rest: unknown[]) => render("html", owner, toHTML(owner, ...rest))),
  } as S;
}

export function mergeAttrs(a: Record<string, string>, b: Record<string, string>): Record<string, string> {
  const out = { ...a };
  for (const [key, value] of Object.entries(b)) {
    if (key === "class" && out.class) out.class = `${out.class} ${value}`;
    else if (key === "style" && out.style) out.style = `${out.style.replace(/;?\s*$/, ";")} ${value}`;
    else out[key] = value;
  }
  return out;
}

function isAttrs(value: unknown): value is Record<string, string> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !(typeof Node !== "undefined" && value instanceof Node)
  );
}

/** Adds attributes to the outer element of a DOMOutputSpec array. */
export function injectAttrs(out: DOMOutputSpec, extra: Record<string, string>): DOMOutputSpec {
  if (!Array.isArray(out) || Object.keys(extra).length === 0) return out;
  const [tag, maybeAttrs, ...rest] = out as unknown as [string, ...unknown[]];
  if (isAttrs(maybeAttrs)) {
    const clean = Object.fromEntries(
      Object.entries(maybeAttrs).filter(([, v]) => v !== null && v !== undefined),
    ) as Record<string, string>;
    return [tag, mergeAttrs(clean, extra), ...rest] as unknown as DOMOutputSpec;
  }
  const tail = maybeAttrs === undefined ? rest : [maybeAttrs, ...rest];
  return [tag, extra, ...tail] as unknown as DOMOutputSpec;
}
