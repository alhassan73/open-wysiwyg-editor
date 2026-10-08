import { DOMParser as PMDOMParser, Slice, type Mark, type Node as PMNode, type Schema } from "prosemirror-model";
import { liftTarget } from "prosemirror-transform";
import {
  AllSelection,
  EditorState,
  NodeSelection,
  Plugin,
  PluginKey,
  Selection,
  TextSelection,
  type Command,
  type Transaction,
} from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";
import { inputRules as inputRulesPlugin, type InputRule } from "prosemirror-inputrules";
import { createCommandManager, type ChainedCommands, type SingleCommands } from "./commands";
import { h, uid } from "./dom";
import { LIB, assertBrowser, warn } from "./env";
import { createEmitter } from "./events";
import {
  defineExtension,
  resolveExtensions,
  type AnyExtension,
  type CommandFactory,
  type ExtensionContext,
} from "./extension";
import { docToHTML } from "./html";
import { createI18n, resolveLanguage, type EditorLanguage, type I18n, type LabelKey, type Labels } from "./i18n";
import { restoreStyles, sanitizeToFragment } from "./sanitize";
import { cleanPastedHTML } from "./paste";
import { buildSchema } from "./schema";
import type { JSONContent, TextDirection } from "./types";
import type { UrlPolicy } from "./url";

export type Content = string | JSONContent | null | undefined;

export interface EditorOptions {
  /**
   * Where to mount. A `<textarea>` is hidden and kept in sync (works in plain HTML forms); any
   * other element is used as the container and its existing HTML becomes the initial content.
   * Pass the element or a CSS selector (`"#editor"`). Omit to create a detached editor and append
   * `editor.root` yourself.
   */
  element?: HTMLElement | string | null;
  /** Initial content as HTML (always sanitized) or ProseMirror JSON. */
  content?: Content;
  extensions?: AnyExtension[];
  editable?: boolean;
  autofocus?: boolean | "start" | "end";
  /** Accessible name of the editing area. Defaults to the textarea's <label> or "Rich text editor". */
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  placeholder?: string | false;
  /** UI language code (BCP 47). Defaults to <html lang>, then the first language. */
  language?: string;
  languages?: EditorLanguage[];
  labels?: Partial<Labels>;
  /** Base direction of the content. Blocks can override it individually. */
  dir?: TextDirection;
  /** Language of the content (sets `lang` on the editing area, used by spellcheck and screen readers). */
  contentLang?: string;
  urlPolicy?: UrlPolicy;
  /** Markdown-style typing shortcuts ("# ", "* ", "**bold**"…). Default true. */
  inputRules?: boolean;
  onCreate?: (editor: Editor) => void;
  /** Fires when the document changes. */
  onUpdate?: (editor: Editor) => void;
  onSelectionUpdate?: (editor: Editor) => void;
  onFocus?: (editor: Editor, event: FocusEvent) => void;
  onBlur?: (editor: Editor, event: FocusEvent) => void;
  onDestroy?: () => void;
  onContentError?: (error: Error) => void;
}

export interface EditorEvents {
  create: [];
  update: [];
  transaction: [transaction: Transaction];
  selectionUpdate: [];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
  options: [];
  destroy: [];
  contentError: [error: Error];
}

export interface SetContentOptions {
  /** Fire `update`/`onUpdate`. Default false (like a fresh load). */
  emitUpdate?: boolean;
  /** Make the change undoable. Default false. */
  addToHistory?: boolean;
}

export interface Editor {
  readonly root: HTMLElement;
  readonly view: EditorView;
  readonly schema: Schema;
  readonly state: EditorState;
  readonly extensions: readonly AnyExtension[];
  readonly i18n: I18n;
  readonly isDestroyed: boolean;
  readonly isEditable: boolean;
  readonly isEmpty: boolean;
  readonly isFocused: boolean;
  readonly commands: SingleCommands;
  can(): SingleCommands;
  chain(): ChainedCommands;
  getHTML(): string;
  getJSON(): JSONContent;
  getText(options?: { blockSeparator?: string }): string;
  setContent(content: Content, options?: SetContentOptions): boolean;
  clearContent(options?: SetContentOptions): void;
  setEditable(editable: boolean): void;
  focus(position?: "start" | "end" | number): void;
  blur(): void;
  isActive(name: string, attrs?: Record<string, unknown>): boolean;
  getAttributes(name: string): Record<string, unknown>;
  /** Translate a UI label in the editor's language. */
  t(key: LabelKey, vars?: Record<string, string | number>): string;
  /** Announce a message to screen readers through the editor's live regions. */
  announce(message: string, politeness?: "polite" | "assertive"): void;
  on<E extends keyof EditorEvents>(event: E, listener: (...args: EditorEvents[E]) => void): () => void;
  off<E extends keyof EditorEvents>(event: E, listener: (...args: EditorEvents[E]) => void): void;
  /** Store-style subscription (fires on every transaction and option change). */
  subscribe(listener: () => void): () => void;
  /** Update runtime options: editable, placeholder, aria*, dir, contentLang, callbacks. */
  setOptions(options: Partial<EditorOptions>): void;
  destroy(): void;
}

const placeholderKey = new PluginKey("owe-placeholder");

export function createEditor(options: EditorOptions = {}): Editor {
  assertBrowser("createEditor()");
  let opts: EditorOptions = { ...options };
  const emitter = createEmitter<EditorEvents>();

  const language = resolveLanguage(opts.language, opts.languages);
  const i18n = createI18n(language, opts.labels);
  const urlPolicy: UrlPolicy = opts.urlPolicy ?? {};
  const extensions = resolveExtensions([CoreExtension, ...(opts.extensions ?? [])]);
  const schema = buildSchema(extensions, { t: i18n.t, urlPolicy });
  const domParser = PMDOMParser.fromSchema(schema);
  const parseHTML = (html: string) => {
    const fragment = sanitizeToFragment(html);
    restoreStyles(fragment);
    return domParser.parse(fragment);
  };
  // Pastes and drops arrive from cleanPastedHTML with styles still parked in data-owe-style.
  const clipboardParser: PMDOMParser = Object.create(domParser);
  clipboardParser.parseSlice = (dom, options) => {
    restoreStyles(dom);
    return domParser.parseSlice(dom, options);
  };

  // ---- mount -------------------------------------------------------------------------------
  const target = resolveElement(opts.element);
  const textarea = target instanceof HTMLTextAreaElement ? target : null;
  let initial: Content | HTMLElement = opts.content;
  if (initial === undefined && target) initial = textarea ? textarea.value : target;

  const root = h("div", { className: "owe", dir: i18n.dir, lang: i18n.lang });
  const body = h("div", { className: "owe-body" });
  const polite = h("div", { className: "owe-sr-only", role: "status", "aria-live": "polite" });
  const assertive = h("div", { className: "owe-sr-only", role: "alert", "aria-live": "assertive" });
  root.append(body, polite, assertive);

  if (textarea) {
    textarea.hidden = true;
    textarea.after(root);
    if (!opts.ariaLabel && !opts.ariaLabelledBy && textarea.labels?.length) {
      const label = textarea.labels[0]!;
      if (!label.id) label.id = uid("owe-label");
      opts.ariaLabelledBy = label.id;
      label.addEventListener("click", focusFromLabel);
    }
  }

  // Parse initial content (an element's own children are sanitized like any other HTML input).
  let editable = opts.editable !== false;
  let destroyed = false;
  let focused = false;
  const doc = parseContent(initial, true) ?? schema.topNodeType.createAndFill()!;
  if (target && !textarea) {
    target.replaceChildren(root);
  }

  // Runtime contexts need the editor object, which is created below (closures read it lazily).
  const ctxFor = <O>(ext: AnyExtension): ExtensionContext<O> => ({
    options: ext.options as O,
    schema,
    editor: editorRef,
  });

  const plugins: Plugin[] = [];
  const rules: InputRule[] = [];
  const factories: Record<string, CommandFactory> = {};

  const view = new EditorView(body, {
    state: EditorState.create({ schema, doc }),
    editable: () => editable,
    attributes: () => viewAttributes(),
    dispatchTransaction,
    // Every paste and drop goes through the same sanitizer as setContent(), plus Office cleanup.
    clipboardParser,
    transformPastedHTML: (html) => {
      const result = cleanPastedHTML(html, urlPolicy);
      if (result.dropped) announce(i18n.t("pasteDropped"));
      return result.html;
    },
    // Pasting into an *empty* textblock replaces it, so the pasted block keeps its own
    // attributes (e.g. dir="rtl" from an Arabic document) instead of inheriting the empty one's.
    transformPasted: (slice, v) => {
      const { $from, empty } = v.state.selection;
      if (empty && $from.parent.isTextblock && $from.parent.content.size === 0 && slice.openStart > 0 && slice.content.firstChild?.isBlock) {
        return new Slice(slice.content, 0, slice.openEnd);
      }
      return slice;
    },
    handleDOMEvents: {
      focus: (_v, event) => {
        focused = true;
        emitter.emit("focus", event as FocusEvent);
        opts.onFocus?.(editorRef, event as FocusEvent);
        return false;
      },
      blur: (_v, event) => {
        focused = false;
        emitter.emit("blur", event as FocusEvent);
        opts.onBlur?.(editorRef, event as FocusEvent);
        syncTextarea();
        return false;
      },
    },
  });

  function viewAttributes(): Record<string, string> {
    const attrs: Record<string, string> = {
      class: "owe-content",
      role: "textbox",
      "aria-multiline": "true",
      "aria-readonly": editable ? "false" : "true",
    };
    if (opts.ariaLabelledBy) attrs["aria-labelledby"] = opts.ariaLabelledBy;
    else attrs["aria-label"] = opts.ariaLabel ?? i18n.t("editorLabel");
    if (opts.ariaDescribedBy) attrs["aria-describedby"] = opts.ariaDescribedBy;
    const placeholder = placeholderText();
    if (placeholder) attrs["aria-placeholder"] = placeholder;
    if (opts.dir) attrs.dir = opts.dir;
    if (opts.contentLang) attrs.lang = opts.contentLang;
    return attrs;
  }

  function placeholderText(): string | null {
    if (opts.placeholder === false) return null;
    return opts.placeholder ?? i18n.t("placeholder");
  }

  function dispatchTransaction(tr: Transaction) {
    if (destroyed) return;
    const before = view.state;
    const next = before.apply(tr);
    view.updateState(next);
    emitter.emit("transaction", tr);
    if (!before.selection.eq(next.selection)) {
      emitter.emit("selectionUpdate");
      opts.onSelectionUpdate?.(editorRef);
    }
    if (tr.docChanged && !tr.getMeta("owe-silent")) {
      emitter.emit("update");
      opts.onUpdate?.(editorRef);
      scheduleTextareaSync();
    }
  }

  // ---- textarea sync -----------------------------------------------------------------------
  let syncTimer: ReturnType<typeof setTimeout> | undefined;
  function syncTextarea() {
    clearTimeout(syncTimer);
    if (textarea && !destroyed) textarea.value = editorRef.getHTML();
  }
  function scheduleTextareaSync() {
    if (!textarea) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(syncTextarea, 150);
  }
  const form = textarea?.form ?? null;
  form?.addEventListener("submit", syncTextarea, true);
  form?.addEventListener("formdata", syncTextarea, true);
  function focusFromLabel(event: Event) {
    event.preventDefault();
    editorRef.focus();
  }

  // ---- "Escape, then Tab" leaves the editor even inside lists/tables (no keyboard trap) -----
  let tabEscape = false;
  const onKeyDownCapture = (event: KeyboardEvent) => {
    if (event.key === "Escape" && view.dom.contains(event.target as Node)) tabEscape = true;
    else if (event.key === "Tab" && tabEscape) {
      tabEscape = false;
      event.stopPropagation(); // ProseMirror never sees it, so the browser moves focus.
    } else if (event.key !== "Shift") tabEscape = false;
  };
  root.addEventListener("keydown", onKeyDownCapture, true);

  // ---- live regions ------------------------------------------------------------------------
  let announceFrame = 0;
  function announce(message: string, politeness: "polite" | "assertive" = "polite") {
    const region = politeness === "assertive" ? assertive : polite;
    region.textContent = "";
    cancelAnimationFrame(announceFrame);
    announceFrame = requestAnimationFrame(() => {
      region.textContent = message;
    });
  }

  // ---- content I/O -------------------------------------------------------------------------
  function parseContent(content: Content | HTMLElement, initialLoad = false): PMNode | null {
    try {
      if (content === null || content === undefined || content === "") {
        return schema.topNodeType.createAndFill();
      }
      if (typeof content === "string") return parseHTML(content);
      if (typeof HTMLElement !== "undefined" && content instanceof HTMLElement) {
        // Re-serialize through the sanitizer — the element's live DOM is never adopted directly.
        return parseHTML(elementHTML(content));
      }
      const node = schema.nodeFromJSON(content);
      node.check();
      return node;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (initialLoad) warn(`Invalid initial content: ${err.message}`);
      queueMicrotask(() => {
        emitter.emit("contentError", err);
        opts.onContentError?.(err);
      });
      return null;
    }
  }

  // ---- runtime extension parts -------------------------------------------------------------
  const editorRef: Editor = buildApi();

  for (const ext of extensions) {
    const ctx = ctxFor(ext);
    Object.assign(factories, ext.config.commands?.(ctx));
    if (opts.inputRules !== false) rules.push(...(ext.config.inputRules?.(ctx) ?? []));
  }
  if (rules.length) plugins.push(inputRulesPlugin({ rules }));
  for (const ext of extensions) {
    const map = ext.config.keymap?.(ctxFor(ext));
    if (map && Object.keys(map).length) plugins.push(keymap(map));
  }
  for (const ext of extensions) plugins.push(...(ext.config.plugins?.(ctxFor(ext)) ?? []));
  plugins.push(keymap(baseKeymap), placeholderPlugin());

  view.updateState(view.state.reconfigure({ plugins }));
  const manager = createCommandManager(factories, {
    view: () => view,
    focus: (position) => editorRef.focus(position),
  });

  function placeholderPlugin() {
    return new Plugin({
      key: placeholderKey,
      props: {
        decorations(state) {
          const text = placeholderText();
          const first = state.doc.firstChild;
          if (!text || state.doc.childCount !== 1 || !first?.isTextblock || first.content.size) return null;
          return DecorationSet.create(state.doc, [
            Decoration.node(0, first.nodeSize, { class: "owe-placeholder", "data-placeholder": text }),
          ]);
        },
      },
    });
  }

  function buildApi(): Editor {
    const api: Editor = {
      get root() {
        return root;
      },
      get view() {
        return view;
      },
      schema,
      get state() {
        return view.state;
      },
      extensions,
      i18n,
      get isDestroyed() {
        return destroyed;
      },
      get isEditable() {
        return editable;
      },
      get isEmpty() {
        const d = view.state.doc;
        return d.childCount === 1 && !!d.firstChild?.isTextblock && d.firstChild.content.size === 0;
      },
      get isFocused() {
        return focused;
      },
      get commands() {
        return manager.commands;
      },
      can: () => manager.can,
      chain: () => manager.chain(),
      getHTML: () => docToHTML(view.state.doc, urlPolicy),
      getJSON: () => view.state.doc.toJSON() as JSONContent,
      getText: ({ blockSeparator = "\n\n" } = {}) =>
        view.state.doc.textBetween(0, view.state.doc.content.size, blockSeparator),
      setContent(content, { emitUpdate = false, addToHistory = false } = {}) {
        const node = parseContent(content);
        if (!node) return false;
        const tr = view.state.tr.replaceWith(0, view.state.doc.content.size, node.content);
        tr.setSelection(Selection.atStart(tr.doc));
        if (!addToHistory) tr.setMeta("addToHistory", false);
        if (!emitUpdate) tr.setMeta("owe-silent", true);
        view.dispatch(tr);
        if (!emitUpdate) scheduleTextareaSync();
        return true;
      },
      clearContent(o) {
        api.setContent(null, o);
      },
      setEditable(value) {
        api.setOptions({ editable: value });
      },
      focus(position) {
        if (destroyed) return;
        if (position !== undefined) {
          const { doc: d } = view.state;
          const sel =
            position === "start"
              ? Selection.atStart(d)
              : position === "end"
                ? Selection.atEnd(d)
                : TextSelection.near(d.resolve(Math.max(0, Math.min(position, d.content.size))));
          view.dispatch(view.state.tr.setSelection(sel).scrollIntoView());
        }
        view.focus();
      },
      blur() {
        (view.dom as HTMLElement).blur();
      },
      isActive: (name, attrs) => isActive(view.state, schema, name, attrs),
      getAttributes: (name) => getAttributes(view.state, schema, name),
      t: i18n.t,
      announce,
      on: (event, listener) => emitter.on(event, listener),
      off: (event, listener) => emitter.off(event, listener),
      subscribe(listener) {
        const offTr = emitter.on("transaction", listener);
        const offOpts = emitter.on("options", listener);
        return () => {
          offTr();
          offOpts();
        };
      },
      setOptions(partial) {
        if (destroyed) return;
        opts = { ...opts, ...partial };
        if (partial.editable !== undefined) editable = partial.editable;
        view.setProps({}); // re-evaluates editable + attributes
        view.dispatch(view.state.tr.setMeta(placeholderKey, true)); // refresh decorations
        emitter.emit("options");
      },
      destroy() {
        if (destroyed) return;
        syncTextarea();
        for (const ext of extensions) ext.config.onDestroy?.(ctxFor(ext));
        destroyed = true;
        clearTimeout(syncTimer);
        cancelAnimationFrame(announceFrame);
        root.removeEventListener("keydown", onKeyDownCapture, true);
        form?.removeEventListener("submit", syncTextarea, true);
        form?.removeEventListener("formdata", syncTextarea, true);
        if (textarea) {
          textarea.labels?.forEach((l) => l.removeEventListener("click", focusFromLabel));
          textarea.hidden = false;
        }
        view.destroy();
        root.remove();
        emitter.emit("destroy");
        opts.onDestroy?.();
        emitter.clear();
      },
    };
    return api;
  }

  for (const ext of extensions) ext.config.onCreate?.(ctxFor(ext));
  emitter.emit("create");
  opts.onCreate?.(editorRef);
  if (opts.autofocus) {
    editorRef.focus(opts.autofocus === true ? undefined : opts.autofocus);
  }
  return editorRef;
}

function resolveElement(element: EditorOptions["element"]): HTMLElement | null {
  if (typeof element !== "string") return element ?? null;
  const found = document.querySelector<HTMLElement>(element);
  if (!found) throw new Error(`[${LIB}] No element matches "${element}".`);
  return found;
}

function elementHTML(el: HTMLElement): string {
  // Reading (not writing) markup from the integrator's own container; it is sanitized next.
  // eslint-disable-next-line no-restricted-properties
  return el.innerHTML;
}

// ---- state queries -----------------------------------------------------------------------------

function attrsMatch(actual: Record<string, unknown>, wanted?: Record<string, unknown>): boolean {
  if (!wanted) return true;
  return Object.entries(wanted).every(([k, v]) => actual[k] === v);
}

export function isActive(
  state: EditorState,
  schema: Schema,
  name: string,
  attrs?: Record<string, unknown>,
): boolean {
  const markType = schema.marks[name];
  if (markType) {
    const { from, to, empty, $from } = state.selection;
    if (empty) {
      return (state.storedMarks ?? $from.marks()).some(
        (m) => m.type === markType && attrsMatch(m.attrs, attrs),
      );
    }
    // Active only when *all* selected text carries the mark (word-processor semantics), so a
    // mixed selection shows "not bold" and the toggle applies bold to everything.
    let sawText = false;
    let all = true;
    state.doc.nodesBetween(from, to, (node) => {
      if (!all) return false;
      if (node.isText) {
        sawText = true;
        if (!node.marks.some((m) => m.type === markType && attrsMatch(m.attrs, attrs))) all = false;
      }
      return true;
    });
    return sawText && all;
  }
  const nodeType = schema.nodes[name];
  if (!nodeType) return false;
  const sel = state.selection;
  if (sel instanceof NodeSelection && sel.node.type === nodeType) return attrsMatch(sel.node.attrs, attrs);
  const $from = sel.$from;
  for (let d = $from.depth; d >= 0; d--) {
    const node = $from.node(d);
    if (node.type === nodeType && attrsMatch(node.attrs, attrs)) return true;
  }
  return false;
}

export function getAttributes(state: EditorState, schema: Schema, name: string): Record<string, unknown> {
  const markType = schema.marks[name];
  if (markType) {
    const { from, to, empty, $from } = state.selection;
    let mark: Mark | undefined;
    if (empty) mark = (state.storedMarks ?? $from.marks()).find((m) => m.type === markType);
    else {
      state.doc.nodesBetween(from, to, (node) => {
        mark ??= node.marks.find((m) => m.type === markType);
        return !mark;
      });
    }
    return mark ? { ...mark.attrs } : {};
  }
  const nodeType = schema.nodes[name];
  const sel = state.selection;
  if (sel instanceof NodeSelection && sel.node.type === nodeType) return { ...sel.node.attrs };
  for (let d = sel.$from.depth; d >= 0; d--) {
    const node = sel.$from.node(d);
    if (node.type === nodeType) return { ...node.attrs };
  }
  return {};
}

// ---- built-in core extension -------------------------------------------------------------------

const unsetAllMarks: Command = (state, dispatch) => {
  const { from, to, empty } = state.selection;
  if (empty) {
    if (dispatch) dispatch(state.tr.setStoredMarks([]));
    return true;
  }
  if (dispatch) dispatch(state.tr.removeMark(from, to, null));
  return true;
};

/** Lifts selected textblocks out of every wrapper (lists, quotes) and turns them into paragraphs. */
const clearNodes: Command = (state, dispatch) => {
  const paragraph = state.schema.nodes.paragraph;
  if (!paragraph) return false;
  const { from, to } = state.selection;
  const tr = state.tr;
  state.doc.nodesBetween(from, to, (node, pos) => {
    if (!node.isTextblock) return true;
    let range = tr.doc.resolve(tr.mapping.map(pos)).blockRange(tr.doc.resolve(tr.mapping.map(pos + node.nodeSize)));
    let target = range ? liftTarget(range) : null;
    while (range && target !== null) {
      tr.lift(range, target);
      range = tr.doc.resolve(tr.mapping.map(pos)).blockRange(tr.doc.resolve(tr.mapping.map(pos + node.nodeSize)));
      target = range ? liftTarget(range) : null;
    }
    if (node.type !== paragraph) tr.setNodeMarkup(tr.mapping.map(pos), paragraph);
    return false;
  });
  if (!tr.docChanged) return false;
  if (dispatch) dispatch(tr.scrollIntoView());
  return true;
};

const CoreExtension = defineExtension({
  name: "core",
  priority: 1000,
  commands: ({ editor }) => ({
    focus: (position?: "start" | "end" | number) => () => {
      editor.focus(position);
      return true;
    },
    blur: () => () => {
      editor.blur();
      return true;
    },
    selectAll: () => (state, dispatch) => {
      if (dispatch) dispatch(state.tr.setSelection(new AllSelection(state.doc)));
      return true;
    },
    unsetAllMarks: () => unsetAllMarks,
    clearNodes: () => clearNodes,
  }),
});
