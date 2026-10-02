import type { Mark, MarkSpec, Node as PMNode, NodeSpec, Schema } from "prosemirror-model";
import type { Command, Plugin } from "prosemirror-state";
import type { InputRule } from "prosemirror-inputrules";
import type { Translate } from "./i18n";
import type { UrlPolicy } from "./url";
import type { Editor } from "./editor";

/** Context available while the schema is being built (no editor instance yet). */
export interface SchemaContext {
  t: Translate;
  urlPolicy: UrlPolicy;
}

/** Context available to runtime parts (commands, keymaps, plugins, UI). */
export interface ExtensionContext<O> {
  options: O;
  schema: Schema;
  editor: Editor;
}

export interface GlobalAttributeSpec {
  default: unknown;
  /** Read the value from a parsed element. Return null/undefined for "not set". */
  parseHTML?: (element: HTMLElement) => unknown;
  /** Attributes written to HTML output (getHTML / server rendering). */
  renderHTML?: (value: unknown, owner: PMNode | Mark) => Record<string, string> | null;
  /**
   * Attributes written to the live editing view. Defaults to renderHTML. Use this to avoid inline
   * `style` attributes in the view, which strict CSP (style-src-attr) blocks.
   */
  renderDOM?: (value: unknown, owner: PMNode | Mark) => Record<string, string> | null;
}

export interface GlobalAttributes {
  types: string[];
  attributes: Record<string, GlobalAttributeSpec>;
}

export type CommandFactory = (...args: never[]) => Command;

export interface ExtensionConfig<O> {
  name: string;
  /** Higher runs first for keymaps / plugins and wins conflicts. Default 100. */
  priority?: number;
  defaultOptions?: O;
  extensions?: (options: O) => AnyExtension[];
  nodes?: (options: O, ctx: SchemaContext) => Record<string, NodeSpec>;
  marks?: (options: O, ctx: SchemaContext) => Record<string, MarkSpec>;
  globalAttributes?: (options: O) => GlobalAttributes[];
  commands?: (ctx: ExtensionContext<O>) => Record<string, CommandFactory>;
  keymap?: (ctx: ExtensionContext<O>) => Record<string, Command>;
  inputRules?: (ctx: ExtensionContext<O>) => InputRule[];
  plugins?: (ctx: ExtensionContext<O>) => Plugin[];
  onCreate?: (ctx: ExtensionContext<O>) => void;
  onDestroy?: (ctx: ExtensionContext<O>) => void;
}

export interface Extension<O = unknown> {
  readonly name: string;
  readonly options: O;
  readonly config: ExtensionConfig<O>;
  /** Returns a new extension with options merged over the current ones. */
  configure(options?: Partial<O>): Extension<O>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyExtension = Extension<any>;

export function defineExtension<O = Record<string, never>>(
  config: ExtensionConfig<O>,
  options: O = (config.defaultOptions ?? {}) as O,
): Extension<O> {
  return {
    name: config.name,
    options,
    config,
    configure(partial) {
      return defineExtension(config, mergeOptions(options, partial));
    },
  };
}

function mergeOptions<O>(base: O, partial: Partial<O> | undefined): O {
  if (!partial) return base;
  const out = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(partial)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") continue;
    out[key] = value;
  }
  return out as O;
}

/** Flattens nested extensions (e.g. StarterKit), de-duplicates by name (last wins), sorts by priority. */
export function resolveExtensions(list: AnyExtension[]): AnyExtension[] {
  const flat: AnyExtension[] = [];
  const visit = (ext: AnyExtension) => {
    const children = ext.config.extensions?.(ext.options) ?? [];
    for (const child of children) visit(child);
    flat.push(ext);
  };
  for (const ext of list) visit(ext);
  const byName = new Map<string, AnyExtension>();
  for (const ext of flat) {
    byName.delete(ext.name); // keep the position of the last definition
    byName.set(ext.name, ext);
  }
  return [...byName.values()]
    .map((ext, index) => ({ ext, index }))
    .sort((a, b) => (b.ext.config.priority ?? 100) - (a.ext.config.priority ?? 100) || a.index - b.index)
    .map(({ ext }) => ext);
}
