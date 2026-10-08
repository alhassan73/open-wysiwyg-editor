import type { Editor } from "../core/editor";
import type { LabelKey } from "../core/i18n";
import type { CommandName } from "../core/commands";
import type { HeadingOptions } from "../extensions/nodes";
import { h, svg } from "../core/dom";
import { normalizeColor, type PaletteColor } from "../core/color";
import { createMenuButton, icon, iconButton, isDisabled, setDisabled, type MenuItemSpec } from "./components";
import type { IconName } from "./icons";
import type { Tooltip } from "./tooltip";

export type DialogKind = "link" | "image" | "table" | "tableCaption" | "help" | "textColor" | "highlight";

export interface ItemContext {
  editor: Editor;
  tooltip: Tooltip;
  /** Container for popups (menus) — inside the editor root so CSS tokens apply. */
  popups: HTMLElement;
  getDir: () => "ltr" | "rtl";
  openDialog: (kind: DialogKind, returnTo?: HTMLElement) => void;
  openFind: () => void;
  toggleSource: () => void;
  isSourceMode: () => boolean;
}

export interface ToolbarItem {
  element: HTMLElement;
  update?: () => void;
  destroy?: () => void;
}

export type ToolbarItemFactory = (ctx: ItemContext) => ToolbarItem | null;

/** Spec for integrator-defined toolbar buttons. */
export interface CustomItemSpec {
  label: string;
  /** A built-in icon name, or SVG path data (24×24 viewBox, stroked with currentColor). */
  icon?: IconName | string[];
  text?: string;
  shortcut?: string;
  run: (editor: Editor) => void;
  isActive?: (editor: Editor) => boolean;
  isEnabled?: (editor: Editor) => boolean;
}

const run = (editor: Editor, name: CommandName, ...args: unknown[]) =>
  (editor.commands[name] as (...a: unknown[]) => boolean)(...args);
const can = (editor: Editor, name: CommandName, ...args: unknown[]) =>
  name in editor.commands && (editor.can()[name] as (...a: unknown[]) => boolean)(...args);

function commandButton(opts: {
  label: LabelKey;
  icon: IconName;
  command: CommandName;
  args?: unknown[];
  shortcut?: string;
  active?: string;
  requires?: string;
}): ToolbarItemFactory {
  return ({ editor, tooltip }) => {
    const required = opts.requires ?? opts.active;
    if (!(opts.command in editor.commands)) return null;
    if (required && !editor.schema.nodes[required] && !editor.schema.marks[required]) return null;
    const toggle = !!opts.active;
    const button = iconButton({ label: editor.t(opts.label), icon: opts.icon, shortcut: opts.shortcut, toggle, tooltip });
    button.addEventListener("click", () => {
      if (!isDisabled(button)) run(editor, opts.command, ...(opts.args ?? []));
    });
    return {
      element: button,
      update() {
        if (toggle) button.setAttribute("aria-pressed", String(editor.isActive(opts.active!)));
        setDisabled(button, !editor.isEditable || !can(editor, opts.command, ...(opts.args ?? [])));
      },
    };
  };
}

function dialogButton(label: LabelKey, iconName: IconName, kind: "link" | "image" | "help", opts: { shortcut?: string; requires?: string } = {}): ToolbarItemFactory {
  return (ctx) => {
    const { editor } = ctx;
    if (opts.requires && !editor.schema.nodes[opts.requires] && !editor.schema.marks[opts.requires]) return null;
    const button = iconButton({ label: editor.t(label), icon: iconName, shortcut: opts.shortcut, haspopup: "dialog", tooltip: ctx.tooltip });
    button.addEventListener("click", () => {
      if (!isDisabled(button)) ctx.openDialog(kind, button);
    });
    return {
      element: button,
      update() {
        if (kind === "link") {
          button.classList.toggle("is-active", editor.isActive("link"));
          setDisabled(button, !editor.isEditable || !can(editor, "setLink", { href: "https://example.com" }));
        } else if (kind === "image") setDisabled(button, !editor.isEditable);
      },
    };
  };
}

function menuItem(
  label: string,
  build: (ctx: ItemContext) => { button: HTMLButtonElement; items: () => MenuItemSpec[]; update?: () => void } | null,
): ToolbarItemFactory {
  return (ctx) => {
    const built = build(ctx);
    if (!built) return null;
    const menu = createMenuButton({
      button: built.button,
      label,
      items: built.items,
      container: ctx.popups,
      getDir: ctx.getDir,
    });
    return {
      element: built.button,
      update() {
        built.update?.();
        setDisabled(built.button, !ctx.editor.isEditable);
      },
      destroy: menu.destroy,
    };
  };
}

const blockType: ToolbarItemFactory = (ctx) => {
  const { editor } = ctx;
  const t = editor.t;
  const levels = (editor.extensions.find((e) => e.name === "heading")?.options as HeadingOptions | undefined)?.levels ?? [];
  if (!editor.schema.nodes.heading && !editor.schema.nodes.codeBlock) return null;
  const current = () => {
    for (const level of levels) if (editor.isActive("heading", { level })) return t("heading", { level });
    if (editor.isActive("codeBlock")) return t("codeBlock");
    return t("paragraph");
  };
  const button = iconButton({ label: t("blockType"), text: current(), haspopup: "menu", tooltip: ctx.tooltip, className: "owe-btn-wide" });
  return menuItem(t("blockType"), () => ({
    button,
    items: () => [
      { label: t("paragraph"), kind: "radio", shortcut: "Mod-Alt-0", checked: editor.isActive("paragraph") && !levels.some((l) => editor.isActive("heading", { level: l })), run: () => editor.commands.setParagraph() },
      ...levels.map((level) => ({
        label: t("heading", { level }),
        kind: "radio" as const,
        shortcut: `Mod-Alt-${level}`,
        checked: editor.isActive("heading", { level }),
        run: () => editor.commands.setHeading(level),
      })),
    ],
    update() {
      const text = current();
      button.querySelector(".owe-btn-text")!.textContent = text;
      button.setAttribute("aria-label", `${t("blockType")}: ${text}`);
    },
  }))(ctx);
};

const ALIGN: Array<{ value: "start" | "center" | "end" | "justify"; label: LabelKey; icon: IconName; shortcut: string }> = [
  { value: "start", label: "alignStart", icon: "alignStart", shortcut: "Mod-Shift-l" },
  { value: "center", label: "alignCenter", icon: "alignCenter", shortcut: "Mod-Shift-e" },
  { value: "end", label: "alignEnd", icon: "alignEnd", shortcut: "Mod-Shift-r" },
  { value: "justify", label: "alignJustify", icon: "alignJustify", shortcut: "Mod-Shift-j" },
];

function currentBlockAttr(editor: Editor, attr: string): unknown {
  const { $from } = editor.state.selection;
  for (let d = $from.depth; d > 0; d--) {
    const node = $from.node(d);
    if (attr in node.attrs) return node.attrs[attr];
  }
  return null;
}

function swapIcon(button: HTMLElement, name: IconName) {
  const first = button.querySelector("svg");
  if (first?.dataset.icon === name) return;
  const next = icon(name);
  next.dataset.icon = name;
  first?.replaceWith(next);
}

const align: ToolbarItemFactory = (ctx) => {
  const { editor } = ctx;
  if (!("setTextAlign" in editor.commands)) return null;
  const t = editor.t;
  const button = iconButton({ label: t("align"), icon: "alignStart", haspopup: "menu", tooltip: ctx.tooltip });
  const value = () => (currentBlockAttr(editor, "textAlign") as string | null) ?? "start";
  return menuItem(t("align"), () => ({
    button,
    items: () =>
      ALIGN.map((a) => ({
        label: t(a.label),
        icon: a.icon,
        kind: "radio" as const,
        shortcut: a.shortcut,
        checked: value() === a.value,
        run: () => editor.commands.setTextAlign(a.value),
      })),
    update: () => swapIcon(button, ALIGN.find((a) => a.value === value())?.icon ?? "alignStart"),
  }))(ctx);
};

const direction: ToolbarItemFactory = (ctx) => {
  const { editor } = ctx;
  if (!("setTextDirection" in editor.commands)) return null;
  const t = editor.t;
  const button = iconButton({ label: t("direction"), icon: "dirAuto", haspopup: "menu", tooltip: ctx.tooltip });
  const value = () => (currentBlockAttr(editor, "dir") as string | null) ?? "auto";
  const options: Array<{ value: "ltr" | "rtl" | "auto"; label: LabelKey; icon: IconName }> = [
    { value: "ltr", label: "dirLtr", icon: "dirLtr" },
    { value: "rtl", label: "dirRtl", icon: "dirRtl" },
    { value: "auto", label: "dirAuto", icon: "dirAuto" },
  ];
  return menuItem(t("direction"), () => ({
    button,
    items: () =>
      options.map((o) => ({
        label: t(o.label),
        icon: o.icon,
        kind: "radio" as const,
        checked: value() === o.value,
        run: () => (o.value === "auto" ? editor.commands.unsetTextDirection() : editor.commands.setTextDirection(o.value)),
      })),
    update: () => swapIcon(button, options.find((o) => o.value === value())?.icon ?? "dirAuto"),
  }))(ctx);
};

const table: ToolbarItemFactory = (ctx) => {
  const { editor } = ctx;
  if (!editor.schema.nodes.table) return null;
  const t = editor.t;
  const button = iconButton({ label: t("table"), icon: "table", haspopup: "menu", tooltip: ctx.tooltip });
  const op = (label: LabelKey, command: CommandName, separatorBefore = false): MenuItemSpec => ({
    label: t(label),
    disabled: !can(editor, command),
    separatorBefore,
    run: () => run(editor, command),
  });
  return menuItem(t("table"), () => ({
    button,
    items: () => {
      if (!editor.isActive("table")) {
        return [{ label: `${t("insertTable")}…`, icon: "table", run: () => ctx.openDialog("table", button) }];
      }
      return [
        op("addRowBefore", "addRowBefore"),
        op("addRowAfter", "addRowAfter"),
        op("addColumnBefore", "addColumnBefore", true),
        op("addColumnAfter", "addColumnAfter"),
        { label: t("headerRow"), kind: "checkbox", checked: headerRowOn(editor), separatorBefore: true, run: () => editor.commands.toggleHeaderRow() },
        { label: t("headerColumn"), kind: "checkbox", checked: headerColOn(editor), run: () => editor.commands.toggleHeaderColumn() },
        { label: `${t("tableCaption")}…`, run: () => ctx.openDialog("tableCaption", button) },
        op("mergeCells", "mergeCells", true),
        op("splitCell", "splitCell"),
        op("deleteRow", "deleteRow", true),
        op("deleteColumn", "deleteColumn"),
        op("deleteTable", "deleteTable"),
      ];
    },
    update: () => button.classList.toggle("is-active", editor.isActive("table")),
  }))(ctx);
};

function tableNode(editor: Editor) {
  const { $from } = editor.state.selection;
  for (let d = $from.depth; d > 0; d--) if ($from.node(d).type.name === "table") return $from.node(d);
  return null;
}
function headerRowOn(editor: Editor): boolean {
  const row = tableNode(editor)?.firstChild;
  let all = !!row;
  row?.forEach((cell) => (all &&= cell.type.name === "tableHeader"));
  return all;
}
function headerColOn(editor: Editor): boolean {
  const tbl = tableNode(editor);
  let all = !!tbl;
  tbl?.forEach((row) => (all &&= row.firstChild?.type.name === "tableHeader"));
  return all;
}

const find: ToolbarItemFactory = (ctx) => {
  if (!("setSearch" in ctx.editor.commands)) return null;
  const button = iconButton({ label: ctx.editor.t("findAndReplace"), icon: "find", shortcut: "Mod-f", tooltip: ctx.tooltip });
  button.addEventListener("click", () => ctx.openFind());
  return { element: button };
};

function colorMenu(kind: "textColor" | "highlight"): ToolbarItemFactory {
  return (ctx) => {
    const { editor } = ctx;
    if (!editor.schema.marks[kind]) return null;
    const t = editor.t;
    const palette = (editor.extensions.find((e) => e.name === kind)?.options as { palette?: PaletteColor[] } | undefined)?.palette ?? [];
    const label = t(kind);
    const button = iconButton({
      label,
      icon: kind,
      haspopup: "menu",
      shortcut: kind === "highlight" ? "Mod-Shift-h" : undefined,
      tooltip: ctx.tooltip,
      className: "owe-btn-color",
    });
    const bar = h("span", { className: "owe-color-bar", "aria-hidden": "true" });
    button.append(bar);
    const current = () => normalizeColor(editor.getAttributes(kind).color);
    const nameOf = (color: string) => {
      const entry = palette.find((c) => normalizeColor(c.value) === color);
      return entry ? t(entry.name as LabelKey) : color;
    };
    const set = (color: string | null) => {
      if (kind === "textColor") return color ? editor.commands.setTextColor(color) : editor.commands.unsetTextColor();
      return color ? editor.commands.setHighlight(color) : editor.commands.unsetHighlight();
    };
    return menuItem(label, () => ({
      button,
      items: () => {
        const now = current();
        return [
          { label: t(kind === "textColor" ? "automatic" : "noHighlight"), kind: "radio", checked: !now, swatch: null, run: () => set(null) },
          ...palette.map((c) => ({
            label: t(c.name as LabelKey),
            kind: "radio" as const,
            checked: now === normalizeColor(c.value),
            swatch: c.value,
            run: () => set(c.value),
          })),
          { label: `${t("customColor")}…`, separatorBefore: true, run: () => ctx.openDialog(kind, button) },
        ];
      },
      update() {
        const now = current();
        bar.style.setProperty("background-color", now ?? (kind === "textColor" ? "currentColor" : "transparent"));
        bar.classList.toggle("owe-color-bar-empty", !now && kind === "highlight");
        // The current color is part of the name, e.g. "Text color: Dark red".
        button.setAttribute("aria-label", now ? `${label}: ${nameOf(now)}` : label);
      },
    }))(ctx);
  };
}

const sourceCode: ToolbarItemFactory = (ctx) => {
  const button = iconButton({ label: ctx.editor.t("sourceCode"), icon: "sourceCode", toggle: true, tooltip: ctx.tooltip });
  button.addEventListener("click", () => ctx.toggleSource());
  return {
    element: button,
    update: () => button.setAttribute("aria-pressed", String(ctx.isSourceMode())),
  };
};

export const BUILT_IN_ITEMS: Record<string, ToolbarItemFactory> = {
  sourceCode,
  textColor: colorMenu("textColor"),
  highlight: colorMenu("highlight"),
  undo: commandButton({ label: "undo", icon: "undo", command: "undo", shortcut: "Mod-z" }),
  redo: commandButton({ label: "redo", icon: "redo", command: "redo", shortcut: "Mod-Shift-z" }),
  blockType,
  bold: commandButton({ label: "bold", icon: "bold", command: "toggleBold", shortcut: "Mod-b", active: "bold" }),
  italic: commandButton({ label: "italic", icon: "italic", command: "toggleItalic", shortcut: "Mod-i", active: "italic" }),
  underline: commandButton({ label: "underline", icon: "underline", command: "toggleUnderline", shortcut: "Mod-u", active: "underline" }),
  strike: commandButton({ label: "strike", icon: "strike", command: "toggleStrike", shortcut: "Mod-Shift-s", active: "strike" }),
  code: commandButton({ label: "code", icon: "code", command: "toggleCode", shortcut: "Mod-e", active: "code" }),
  subscript: commandButton({ label: "subscript", icon: "subscript", command: "toggleSubscript", shortcut: "Mod-,", active: "subscript" }),
  superscript: commandButton({ label: "superscript", icon: "superscript", command: "toggleSuperscript", shortcut: "Mod-.", active: "superscript" }),
  link: dialogButton("link", "link", "link", { shortcut: "Mod-k", requires: "link" }),
  bulletList: commandButton({ label: "bulletList", icon: "bulletList", command: "toggleBulletList", shortcut: "Mod-Shift-8", active: "bulletList" }),
  orderedList: commandButton({ label: "orderedList", icon: "orderedList", command: "toggleOrderedList", shortcut: "Mod-Shift-7", active: "orderedList" }),
  taskList: commandButton({ label: "taskList", icon: "taskList", command: "toggleTaskList", shortcut: "Mod-Shift-9", active: "taskList" }),
  blockquote: commandButton({ label: "blockquote", icon: "blockquote", command: "toggleBlockquote", shortcut: "Mod-Shift-b", active: "blockquote" }),
  codeBlock: commandButton({ label: "codeBlock", icon: "codeBlock", command: "toggleCodeBlock", shortcut: "Mod-Alt-c", active: "codeBlock" }),
  align,
  direction,
  image: dialogButton("insertImage", "image", "image", { requires: "image" }),
  table,
  horizontalRule: commandButton({ label: "horizontalRule", icon: "horizontalRule", command: "setHorizontalRule", requires: "horizontalRule" }),
  removeFormat: commandButton({ label: "removeFormat", icon: "removeFormat", command: "unsetAllMarks" }),
  find,
  help: dialogButton("shortcuts", "keyboard", "help", { shortcut: "Alt-0" }),
};

export const DEFAULT_TOOLBAR = [
  "undo", "redo", "|",
  "blockType", "|",
  "bold", "italic", "underline", "strike", "code", "|",
  "textColor", "highlight", "|",
  "link", "|",
  "bulletList", "orderedList", "taskList", "|",
  "blockquote", "codeBlock", "|",
  "align", "direction", "|",
  "image", "table", "horizontalRule", "|",
  "removeFormat", "|",
  "find", "sourceCode", "help",
];

export function customItem(spec: CustomItemSpec): ToolbarItemFactory {
  return ({ editor, tooltip }) => {
    const builtIn = typeof spec.icon === "string" ? spec.icon : undefined;
    const button = iconButton({
      label: spec.label,
      icon: builtIn,
      text: spec.text,
      shortcut: spec.shortcut,
      toggle: !!spec.isActive,
      tooltip,
    });
    if (Array.isArray(spec.icon)) button.prepend(svg(spec.icon));
    button.addEventListener("click", () => {
      if (!isDisabled(button)) spec.run(editor);
    });
    return {
      element: button,
      update() {
        if (spec.isActive) button.setAttribute("aria-pressed", String(spec.isActive(editor)));
        setDisabled(button, !editor.isEditable || (spec.isEnabled ? !spec.isEnabled(editor) : false));
      },
    };
  };
}

