import { NodeSelection } from "prosemirror-state";
import type { Editor } from "../core/editor";
import { h } from "../core/dom";
import { sanitizeUrl, type UrlPolicy } from "../core/url";
import type { ImageAttrs } from "../core/types";
import type { ImageOptions } from "../extensions/image";
import type { TableOptions } from "../extensions/table";
import { markRange } from "../extensions/helpers";
import { field, openDialog } from "./components";
import { formatShortcut } from "./shortcuts";
import type { LabelKey } from "../core/i18n";
import { contrastRatio, normalizeColor, type PaletteColor } from "../core/color";

interface DialogContext {
  editor: Editor;
  container: HTMLElement;
  /** Restores focus after closing: the invoking control if any, else the editor (with selection). */
  restoreFocus: () => void;
}

const policyOf = (editor: Editor): UrlPolicy => (editor.schema.cached.urlPolicy as UrlPolicy | undefined) ?? {};

/** "example.com" → "https://example.com", "me@x.org" → "mailto:me@x.org" (only when unambiguous). */
export function normalizeUrlInput(raw: string): string {
  const value = raw.trim();
  if (!value || /^[a-z][a-z0-9+.-]*:/i.test(value) || /^[/#?.]/.test(value)) return value;
  if (/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(value)) return `mailto:${value}`;
  if (/^(www\.)?[^\s/]+\.[a-z]{2,}([/?#].*)?$/i.test(value)) return `https://${value}`;
  return value;
}

const common = (ctx: DialogContext) => ({
  container: ctx.container,
  cancelLabel: ctx.editor.t("cancel"),
  closeLabel: ctx.editor.t("close"),
  onClose: ctx.restoreFocus,
});

// ---- Link ------------------------------------------------------------------------------------

export function openLinkDialog(ctx: DialogContext) {
  const { editor } = ctx;
  const t = editor.t;
  const state = editor.state;
  const linkType = editor.schema.marks.link;
  if (!linkType) return;
  const existing = editor.isActive("link") ? editor.getAttributes("link") : null;
  let currentText = "";
  const { empty, from, to, $from } = state.selection;
  if (!empty) currentText = state.doc.textBetween(from, to, " ");
  else if (existing) {
    const range = markRange($from, linkType);
    if (range) currentText = state.doc.textBetween(range.from, range.to, " ");
  }

  const url = field({
    label: t("linkUrl"),
    required: true,
    requiredLabel: t("required"),
    input: h("input", {
      type: "text",
      inputmode: "url",
      autocomplete: "url",
      spellcheck: "false",
      dir: "ltr",
      value: (existing?.href as string) ?? "",
    }),
  });
  const text = field({ label: t("linkText"), input: h("input", { type: "text", value: currentText }) });
  const newTab = field({
    label: t("linkNewTab"),
    input: h("input", { type: "checkbox", checked: existing?.target === "_blank" }),
  });

  openDialog({
    ...common(ctx),
    title: existing ? t("editLink") : t("insertLink"),
    submitLabel: existing ? t("save") : t("insert"),
    body: [url.element, text.element, newTab.element],
    extraActions: existing ? [{ label: t("unlink"), danger: true, run: () => editor.commands.unsetLink() }] : [],
    onSubmit: () => {
      const raw = (url.input as HTMLInputElement).value;
      if (!raw.trim()) {
        url.setError(t("urlRequired"));
        return false;
      }
      const href = sanitizeUrl(normalizeUrlInput(raw), policyOf(editor));
      if (!href) {
        url.setError(t("invalidUrl"));
        return false;
      }
      const ok = editor.commands.setLink({
        href,
        text: (text.input as HTMLInputElement).value.trim() || undefined,
        newTab: (newTab.input as HTMLInputElement).checked,
      });
      if (ok && !existing) editor.announce(t("inserted", { name: t("link") }));
      return true;
    },
  });
}

// ---- Image -----------------------------------------------------------------------------------

export function openImageDialog(ctx: DialogContext) {
  const { editor } = ctx;
  const t = editor.t;
  const sel = editor.state.selection;
  const editing = sel instanceof NodeSelection && sel.node.type.name === "image" ? (sel.node.attrs as ImageAttrs) : null;
  const upload = (editor.extensions.find((e) => e.name === "image")?.options as ImageOptions | undefined)?.upload ?? null;

  const url = field({
    label: t("imageUrl"),
    required: !upload,
    requiredLabel: t("required"),
    input: h("input", { type: "text", inputmode: "url", dir: "ltr", spellcheck: "false", value: editing?.src ?? "" }),
  });
  const file = upload
    ? field({ label: t("imageUpload"), input: h("input", { type: "file", accept: "image/*" }) })
    : null;
  const altInput = h("textarea", { rows: "2" });
  altInput.value = editing?.alt ?? "";
  const alt = field({ label: t("altText"), input: altInput, help: t("altHelp"), required: true, requiredLabel: t("required") });
  const decorative = field({
    label: t("decorative"),
    input: h("input", { type: "checkbox", checked: editing?.alt === "" }),
  });
  const caption = field({ label: t("caption"), input: h("input", { type: "text", value: editing?.caption ?? "" }) });

  const syncDecorative = () => {
    const isDecorative = (decorative.input as HTMLInputElement).checked;
    altInput.disabled = isDecorative;
    alt.setError(null);
  };
  decorative.input.addEventListener("change", syncDecorative);
  syncDecorative();

  openDialog({
    ...common(ctx),
    title: editing ? t("editImage") : t("insertImage"),
    submitLabel: editing ? t("save") : t("insert"),
    body: [url.element, ...(file ? [file.element] : []), alt.element, decorative.element, caption.element],
    onSubmit: () => {
      const isDecorative = (decorative.input as HTMLInputElement).checked;
      const altText = altInput.value.trim();
      // ATAG B.2.3.1 / Section 508 §504.3: prompt for a text alternative.
      if (!isDecorative && !altText) {
        alt.setError(t("altRequired"));
        return false;
      }
      const chosen = (file?.input as HTMLInputElement | undefined)?.files?.[0];
      const attrs = { alt: isDecorative ? "" : altText, caption: (caption.input as HTMLInputElement).value.trim() || null };
      const insert = (src: string) => {
        const ok = editing
          ? editor.commands.updateImage({ ...attrs, src })
          : editor.commands.setImage({ ...attrs, src });
        if (!ok) url.setError(t("invalidUrl"));
        else if (!editing) editor.announce(t("inserted", { name: t("image") }));
        return ok;
      };
      if (chosen && upload) {
        return upload(chosen).then(insert, () => {
          file!.setError(t("invalidUrl"));
          return false;
        });
      }
      const raw = (url.input as HTMLInputElement).value;
      if (!raw.trim()) {
        url.setError(t("urlRequired"));
        return false;
      }
      const src = sanitizeUrl(normalizeUrlInput(raw), policyOf(editor), "image");
      if (!src) {
        url.setError(t("invalidUrl"));
        return false;
      }
      return insert(src);
    },
  });
}

// ---- Table -----------------------------------------------------------------------------------

export function openTableDialog(ctx: DialogContext) {
  const { editor } = ctx;
  const t = editor.t;
  const max = (editor.extensions.find((e) => e.name === "table")?.options as TableOptions | undefined)?.maxSize ?? 100;
  const num = (value: number) =>
    h("input", { type: "number", min: "1", max: String(max), step: "1", value: String(value), inputmode: "numeric" });
  const rows = field({ label: t("rows"), input: num(3) });
  const cols = field({ label: t("columns"), input: num(3) });
  const header = field({ label: t("headerRow"), input: h("input", { type: "checkbox", checked: true }) });
  const caption = field({ label: t("tableCaption"), input: h("input", { type: "text" }) });

  openDialog({
    ...common(ctx),
    title: t("insertTable"),
    submitLabel: t("insert"),
    body: [h("div", { className: "owe-field-row" }, rows.element, cols.element), header.element, caption.element],
    onSubmit: () => {
      const r = Number((rows.input as HTMLInputElement).value);
      const c = Number((cols.input as HTMLInputElement).value);
      if (!Number.isInteger(r) || r < 1 || r > max) {
        rows.setError(`1–${max}`);
        return false;
      }
      if (!Number.isInteger(c) || c < 1 || c > max) {
        cols.setError(`1–${max}`);
        return false;
      }
      editor.commands.insertTable({
        rows: r,
        cols: c,
        withHeaderRow: (header.input as HTMLInputElement).checked,
        caption: (caption.input as HTMLInputElement).value,
      });
      editor.announce(t("inserted", { name: t("tableSize", { rows: r, cols: c }) }));
      return true;
    },
  });
}

export function openTableCaptionDialog(ctx: DialogContext) {
  const { editor } = ctx;
  const t = editor.t;
  const current = (editor.getAttributes("table").caption as string | null) ?? "";
  const caption = field({ label: t("tableCaption"), input: h("input", { type: "text", value: current }) });
  openDialog({
    ...common(ctx),
    title: t("tableProperties"),
    submitLabel: t("save"),
    body: [caption.element],
    onSubmit: () => {
      editor.commands.setTableCaption((caption.input as HTMLInputElement).value);
      return true;
    },
  });
}

// ---- Custom color ----------------------------------------------------------------------------

export function openColorDialog(ctx: DialogContext, kind: "textColor" | "highlight") {
  const { editor } = ctx;
  const t = editor.t;
  const palette = (editor.extensions.find((e) => e.name === kind)?.options as { palette?: PaletteColor[] } | undefined)?.palette ?? [];
  const initial =
    normalizeColor(editor.getAttributes(kind).color) ?? normalizeColor(palette[0]?.value) ?? (kind === "textColor" ? "#1b1f24" : "#fff2a8");
  const picker = field({ label: t("color"), input: h("input", { type: "color", value: initial }) });
  const hex = field({
    label: t("hexValue"),
    input: h("input", { type: "text", value: initial, dir: "ltr", spellcheck: "false", autocomplete: "off", maxlength: "32" }),
  });
  const sample = h("span", { className: "owe-color-sample" }, "Aa أب");
  // Live WCAG contrast feedback (ATAG B.2: help authors choose accessible colors).
  const contrast = h("p", { className: "owe-contrast", role: "status", "aria-live": "polite" });
  const preview = h("div", { className: "owe-color-preview" }, sample, contrast);

  const refresh = (value: string | null) => {
    if (!value) {
      contrast.textContent = "";
      return;
    }
    const fg = kind === "textColor" ? value : "#1b1f24";
    const bg = kind === "textColor" ? "#ffffff" : value;
    sample.style.setProperty("color", fg);
    sample.style.setProperty("background-color", bg);
    const ratio = contrastRatio(fg, bg) ?? 1;
    const ratioText = (Math.floor(ratio * 10) / 10).toFixed(1);
    const head = t(kind === "textColor" ? "contrastText" : "contrastBg", { ratio: ratioText });
    contrast.textContent = `${head} — ${t(ratio >= 4.5 ? "contrastPass" : "contrastFail")}`;
    contrast.classList.toggle("owe-contrast-fail", ratio < 4.5);
  };
  picker.input.addEventListener("input", () => {
    (hex.input as HTMLInputElement).value = (picker.input as HTMLInputElement).value;
    hex.setError(null);
    refresh((picker.input as HTMLInputElement).value);
  });
  hex.input.addEventListener("input", () => {
    const value = normalizeColor((hex.input as HTMLInputElement).value);
    if (value) (picker.input as HTMLInputElement).value = value;
    refresh(value);
  });
  refresh(initial);

  openDialog({
    ...common(ctx),
    title: `${t(kind)} — ${t("customColor")}`,
    submitLabel: t("apply"),
    body: [h("div", { className: "owe-field-row" }, picker.element, hex.element), preview],
    onSubmit: () => {
      const value = normalizeColor((hex.input as HTMLInputElement).value);
      if (!value) {
        hex.setError(t("invalidColor"));
        return false;
      }
      if (kind === "textColor") editor.commands.setTextColor(value);
      else editor.commands.setHighlight(value);
      return true;
    },
  });
}

// ---- Keyboard help ---------------------------------------------------------------------------

interface ShortcutRow {
  label: LabelKey;
  vars?: Record<string, string | number>;
  keys: string;
  /** Present only if this node/mark/command exists. */
  requires?: string;
}

const NAVIGATION: ShortcutRow[] = [
  { label: "focusToolbar", keys: "Alt-F10" },
  { label: "showShortcuts", keys: "Alt-0" },
  { label: "openFind", keys: "Mod-f", requires: "setSearch" },
  { label: "insertLink", keys: "Mod-k", requires: "link" },
  { label: "undo", keys: "Mod-z", requires: "undo" },
  { label: "redo", keys: "Mod-Shift-z", requires: "redo" },
];

const FORMATTING: ShortcutRow[] = [
  { label: "bold", keys: "Mod-b", requires: "bold" },
  { label: "italic", keys: "Mod-i", requires: "italic" },
  { label: "underline", keys: "Mod-u", requires: "underline" },
  { label: "strike", keys: "Mod-Shift-s", requires: "strike" },
  { label: "code", keys: "Mod-e", requires: "code" },
  { label: "subscript", keys: "Mod-,", requires: "subscript" },
  { label: "superscript", keys: "Mod-.", requires: "superscript" },
  { label: "highlight", keys: "Mod-Shift-h", requires: "highlight" },
  { label: "alignStart", keys: "Mod-Shift-l", requires: "setTextAlign" },
  { label: "alignCenter", keys: "Mod-Shift-e", requires: "setTextAlign" },
  { label: "alignEnd", keys: "Mod-Shift-r", requires: "setTextAlign" },
  { label: "alignJustify", keys: "Mod-Shift-j", requires: "setTextAlign" },
];

const BLOCKS: ShortcutRow[] = [
  { label: "paragraph", keys: "Mod-Alt-0", requires: "paragraph" },
  ...[1, 2, 3, 4, 5, 6].map((level) => ({ label: "heading" as LabelKey, vars: { level }, keys: `Mod-Alt-${level}`, requires: "heading" })),
  { label: "orderedList", keys: "Mod-Shift-7", requires: "orderedList" },
  { label: "bulletList", keys: "Mod-Shift-8", requires: "bulletList" },
  { label: "taskList", keys: "Mod-Shift-9", requires: "taskList" },
  { label: "blockquote", keys: "Mod-Shift-b", requires: "blockquote" },
  { label: "codeBlock", keys: "Mod-Alt-c", requires: "codeBlock" },
  { label: "hardBreak", keys: "Shift-Enter", requires: "hardBreak" },
  { label: "indent", keys: "Tab", requires: "listItem" },
  { label: "outdent", keys: "Shift-Tab", requires: "listItem" },
];

const TYPING: Array<{ label: LabelKey; vars?: Record<string, number>; typed: string; requires: string }> = [
  { label: "heading", vars: { level: 2 }, typed: "## ", requires: "heading" },
  { label: "bulletList", typed: "- ", requires: "bulletList" },
  { label: "orderedList", typed: "1. ", requires: "orderedList" },
  { label: "taskList", typed: "[ ] ", requires: "taskList" },
  { label: "blockquote", typed: "> ", requires: "blockquote" },
  { label: "codeBlock", typed: "``` ", requires: "codeBlock" },
  { label: "horizontalRule", typed: "---", requires: "horizontalRule" },
  { label: "bold", typed: "**text**", requires: "bold" },
  { label: "italic", typed: "*text*", requires: "italic" },
  { label: "code", typed: "`text`", requires: "code" },
  { label: "strike", typed: "~~text~~", requires: "strike" },
];

export function openHelpDialog(ctx: DialogContext) {
  const { editor } = ctx;
  const t = editor.t;
  const has = (name?: string) =>
    !name || !!editor.schema.nodes[name] || !!editor.schema.marks[name] || name in editor.commands;

  const table = (caption: string, rows: Array<[string, string]>) =>
    h(
      "table",
      { className: "owe-shortcuts" },
      h("caption", null, caption),
      h("thead", null, h("tr", null, h("th", { scope: "col" }, t("action")), h("th", { scope: "col" }, t("shortcut")))),
      h(
        "tbody",
        null,
        rows.map(([label, keys]) => h("tr", null, h("th", { scope: "row" }, label), h("td", null, h("kbd", { dir: "ltr" }, keys)))),
      ),
    );
  const rows = (list: ShortcutRow[]) =>
    list.filter((r) => has(r.requires)).map((r) => [t(r.label, r.vars), formatShortcut(r.keys)] as [string, string]);

  openDialog({
    ...common(ctx),
    title: t("shortcuts"),
    wide: true,
    scrollable: true,
    body: [
      h("p", null, t("shortcutsHelp", { shortcut: formatShortcut("Alt-F10") })),
      h("p", null, t("leaveEditor")),
      table(t("navigation"), rows(NAVIGATION)),
      table(t("formatting"), rows(FORMATTING)),
      table(t("blocks"), rows(BLOCKS)),
      table(
        t("markdownShortcuts"),
        TYPING.filter((r) => has(r.requires)).map((r) => [t(r.label, r.vars), r.typed]),
      ),
    ],
  });
}
