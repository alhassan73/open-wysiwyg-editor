import type { Editor } from "../core/editor";
import { h } from "../core/dom";

const BLOCK = "p|h[1-6]|li|ul|ol|blockquote|pre|table|caption|thead|tbody|tr|figure|figcaption|hr|img";

/** Puts block-level tags on their own lines so the source is readable (no reformatting inside <pre>). */
export function formatHTML(html: string): string {
  const parts = html.split(/(<pre[\s>][\s\S]*?<\/pre>)/i);
  return parts
    .map((part, i) =>
      i % 2
        ? part
        : part
            .replace(new RegExp(`(</(?:${BLOCK})>)`, "gi"), "$1\n")
            .replace(new RegExp(`(<(?:ul|ol|table|tbody|thead|tr|blockquote|figure)(?:\\s[^>]*)?>)`, "gi"), "$1\n")
            .replace(/(<(?:hr|img)\b[^>]*>)(?!\n)/gi, "$1\n"),
    )
    .join("")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

const normalize = (html: string) =>
  html
    .replace(/ dir="auto"/g, "")
    .replace(/>\s+</g, "><")
    .replace(/\s+/g, " ")
    .trim();

/**
 * HTML source view. Edits are applied through the same sanitizer and schema as any other input,
 * so source mode can't be used to inject scripts or unsupported markup; the author is told when
 * something was removed or simplified. Applied as one undoable step.
 */
export function createSourceView(editor: Editor) {
  const t = editor.t;
  const textarea = h("textarea", {
    className: "owe-source",
    "aria-label": t("sourceCode"),
    dir: "ltr",
    lang: "en",
    spellcheck: "false",
    autocapitalize: "off",
    autocomplete: "off",
    hidden: true,
  });
  const body = editor.view.dom.parentElement!;
  body.append(textarea);
  let open = false;
  let original = "";

  function apply() {
    if (!open) return;
    const value = textarea.value;
    if (value === original) return;
    editor.setContent(value, { emitUpdate: true, addToHistory: true });
    const result = formatHTML(editor.getHTML());
    if (normalize(result) !== normalize(value)) editor.announce(t("sourceCleaned"), "assertive");
    textarea.value = original = result;
  }

  textarea.addEventListener("blur", apply); // also runs before a form is submitted

  return {
    isOpen: () => open,
    open() {
      if (open) return;
      open = true;
      textarea.value = original = formatHTML(editor.getHTML());
      textarea.readOnly = !editor.isEditable;
      (editor.view.dom as HTMLElement).hidden = true;
      textarea.hidden = false;
      editor.root.classList.add("owe-source-mode");
      textarea.focus();
    },
    close(focusEditor = true) {
      if (!open) return;
      apply();
      open = false;
      textarea.hidden = true;
      (editor.view.dom as HTMLElement).hidden = false;
      editor.root.classList.remove("owe-source-mode");
      if (focusEditor) editor.focus();
    },
    focus: () => textarea.focus(),
    destroy() {
      textarea.remove();
    },
  };
}

export type SourceView = ReturnType<typeof createSourceView>;
