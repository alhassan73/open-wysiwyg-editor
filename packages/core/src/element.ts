// <owe-editor> custom element: the full editor as an HTML tag. Works in plain HTML forms, CMS pages,
// htmx, Lit and any framework. Importing this entry defines the element; the <script> build defines
// it too. It renders in the light DOM, so style.css applies as usual (no Shadow DOM, CSP-safe).
import { createEditor, type EditorOptions } from "./editor";
import type { Content, Editor } from "./core/editor";
import { uid } from "./core/dom";
import { forwardCallbacks } from "./integrations/shared";
import { getUI, type UIOptions } from "./ui";

export const EDITOR_TAG = "owe-editor";

export interface EditorElement extends HTMLElement {
  /** The live editor, or `null` while the element isn't in the document. */
  readonly editor: Editor | null;
  /** The content as HTML. Setting it loads new content. */
  value: string;
  /**
   * More `createEditor()` options (extensions, ui, labels, callbacks…). Set it before the element is
   * added to the page; attributes win over it.
   */
  options: Omit<EditorOptions, "element">;
  readonly form: HTMLFormElement | null;
}

const OBSERVED = ["placeholder", "readonly", "dir", "content-lang", "label", "theme", "brand"];

/**
 * Defines `<owe-editor>` (or `tagName`). Safe to call more than once and on the server, where it
 * does nothing.
 *
 * Attributes: `name` (form field), `placeholder`, `readonly`, `disabled`, `dir`, `content-lang`,
 * `label` (accessible name, or use `<label for>`), `theme` ("auto", "light" or "dark") and `brand`
 * (any CSS color; the buttons, links, focus ring and selection follow it), plus `value`, `language`
 * and `toolbar` (space-separated items, or `none`), which are read when the editor is created.
 * All of these follow later changes except `value`, `language` and `toolbar`.
 * Initial content: the `value` attribute, else a `<template>` child, else the element's children.
 * Use `value` or `<template>` for server-rendered user content: neither runs before sanitizing.
 * Events: `input` on every change, `change` when it loses focus after a change.
 */
export function defineEditorElement(tagName: string = EDITOR_TAG): CustomElementConstructor | undefined {
  if (typeof customElements === "undefined") return undefined;
  const existing = customElements.get(tagName);
  if (existing) return existing;

  class OweEditorElement extends HTMLElement implements EditorElement {
    static formAssociated = true;
    static observedAttributes = OBSERVED;

    options: Omit<EditorOptions, "element"> = {};
    private instance: Editor | null = null;
    private internals: ElementInternals | null = null;
    private pending: Content = undefined;
    private initialHTML = "";
    private committedHTML = "";

    constructor() {
      super();
      this.internals = typeof this.attachInternals === "function" ? this.attachInternals() : null;
      // Native `input` events from the editing area and dialog fields stop here; listeners get the
      // element's own `input` event, whose target has `.value`, like a native field.
      this.addEventListener("input", (event) => {
        if (event.target !== this) event.stopImmediatePropagation();
      });
      this.addEventListener("click", (event) => {
        if (event.target === this) this.instance?.focus(); // a click on its <label>
      });
    }

    get editor(): Editor | null {
      return this.instance;
    }

    get value(): string {
      if (this.instance) return this.instance.getHTML();
      return typeof this.pending === "string" ? this.pending : "";
    }

    set value(html: string) {
      if (!this.instance) {
        this.pending = html;
        return;
      }
      if (html === this.instance.getHTML()) return;
      this.instance.setContent(html);
      this.committedHTML = this.instance.getHTML();
      this.setFormValue(this.committedHTML);
    }

    get form(): HTMLFormElement | null {
      return this.internals?.form ?? null;
    }

    connectedCallback() {
      // When the parser upgrades the element, its children (the initial content) aren't parsed yet.
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => this.mount(), { once: true });
      } else this.mount();
    }

    disconnectedCallback() {
      if (!this.instance) return;
      this.pending = this.instance.getHTML(); // moving the element keeps its content
      this.instance.destroy();
      this.instance = null;
    }

    attributeChangedCallback(name: string) {
      this.instance?.setOptions(this.runtimeOptions());
      if (name === "theme" || name === "brand") this.applyTheme();
    }

    formDisabledCallback() {
      this.instance?.setOptions(this.runtimeOptions());
    }

    formResetCallback() {
      this.value = this.initialHTML;
    }

    private mount() {
      if (this.instance || !this.isConnected) return;
      const options = this.options;
      const toolbar = this.getAttribute("toolbar");
      const items: string[] | false | undefined =
        toolbar === null ? undefined : toolbar.trim() === "none" ? false : toolbar.trim().split(/\s+/);
      const ui =
        options.ui === false
          ? false
          : { ...options.ui, ...(items === undefined ? null : { toolbar: items }), ...this.themeAttributes() };
      const labelledBy = this.internals?.labels?.[0] as HTMLElement | undefined;
      if (labelledBy && !labelledBy.id) labelledBy.id = uid("owe-label");

      const content =
        this.pending !== undefined
          ? this.pending
          : (options.content ?? this.getAttribute("value") ?? templateHTML(this));
      this.pending = undefined;
      this.instance = createEditor({
        ...options,
        ...this.runtimeOptions(),
        ariaLabelledBy: labelledBy?.id ?? options.ariaLabelledBy,
        language: this.getAttribute("language") ?? options.language,
        ui,
        // `undefined` makes the editor read this element's children as the initial content.
        content,
        element: this,
        ...forwardCallbacks(() => this.options),
        onUpdate: (editor) => {
          this.setFormValue(editor.getHTML());
          this.options.onUpdate?.(editor);
          this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
        },
        onBlur: (editor, event) => {
          this.options.onBlur?.(editor, event);
          const html = editor.getHTML();
          if (html === this.committedHTML) return;
          this.committedHTML = html;
          this.dispatchEvent(new Event("change", { bubbles: true }));
        },
      });
      this.committedHTML = this.instance.getHTML();
      this.initialHTML ||= this.committedHTML;
      this.setFormValue(this.committedHTML);
    }

    /** The `theme` and `brand` attributes that are set (valid ones only); they win over `options.ui`. */
    private themeAttributes(): Pick<UIOptions, "theme" | "brand"> {
      const theme = this.getAttribute("theme");
      const brand = this.getAttribute("brand");
      return {
        ...(theme === "auto" || theme === "light" || theme === "dark" ? { theme } : null),
        ...(brand ? { brand } : null),
      };
    }

    private applyTheme() {
      const ui = this.instance && getUI(this.instance);
      ui?.setTheme({ ...(this.options.ui || null), ...this.themeAttributes() });
    }

    private setFormValue(html: string) {
      // Form participation needs ElementInternals.setFormValue (Safari 16.4+).
      if (typeof this.internals?.setFormValue === "function") this.internals.setFormValue(html);
    }

    private runtimeOptions(): Partial<EditorOptions> {
      const { options } = this;
      const attr = (name: string) => this.getAttribute(name) ?? undefined;
      const dir = attr("dir");
      return {
        editable: !this.hasAttribute("readonly") && !this.matches(":disabled") && options.editable !== false,
        placeholder: attr("placeholder") ?? options.placeholder,
        ariaLabel: attr("label") ?? options.ariaLabel,
        dir: dir === "ltr" || dir === "rtl" || dir === "auto" ? dir : options.dir,
        contentLang: attr("content-lang") ?? options.contentLang,
      };
    }
  }

  customElements.define(tagName, OweEditorElement);
  return OweEditorElement;
}

/**
 * Initial content given as `<owe-editor><template>…</template></owe-editor>`. A template's content is
 * inert (no scripts, no image loads) until the editor sanitizes it. When generating it on a server,
 * escape `</template` in user content, or use the `value` attribute instead.
 */
function templateHTML(host: HTMLElement): string | undefined {
  const template = [...host.children].find((child) => child instanceof HTMLTemplateElement);
  // Reading (not writing) markup; createEditor() sanitizes it.
  // eslint-disable-next-line no-restricted-properties
  return template ? (template as HTMLTemplateElement).innerHTML : undefined;
}

defineEditorElement();

declare global {
  interface HTMLElementTagNameMap {
    "owe-editor": EditorElement;
  }
}
