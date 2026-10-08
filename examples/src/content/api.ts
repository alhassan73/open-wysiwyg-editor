// API reference data for the "API" section. Names, types and defaults are code (English). The descriptions are
// translated and live in the messages, as `Api.rows.<group>.<id>`. Checked against packages/core/src
// (editor.ts, core/editor.ts, ui/index.ts, element.ts).
import type { ApiRow, CommandGroup } from "@/types";

export const OPTIONS: ApiRow[] = [
  { id: "element", name: "element", type: "HTMLElement | string | <textarea>" },
  { id: "content", name: "content", type: "string | JSON" },
  { id: "extensions", name: "extensions", type: "AnyExtension[]", def: "[StarterKit]" },
  { id: "editable", name: "editable", type: "boolean", def: "true" },
  { id: "autofocus", name: "autofocus", type: 'boolean | "start" | "end"', def: "false" },
  { id: "placeholder", name: "placeholder", type: "string" },
  { id: "ariaLabel", name: "ariaLabel, ariaLabelledBy, ariaDescribedBy", type: "string" },
  { id: "language", name: "language", type: "string", def: "<html lang>" },
  { id: "languages", name: "languages", type: "EditorLanguage[]" },
  { id: "labels", name: "labels", type: "Partial<Labels>" },
  { id: "dir", name: "dir", type: '"ltr" | "rtl" | "auto"' },
  { id: "contentLang", name: "contentLang", type: "string" },
  { id: "urlPolicy", name: "urlPolicy", type: "UrlPolicy" },
  { id: "inputRules", name: "inputRules", type: "boolean", def: "true" },
  { id: "ui", name: "ui", type: "UIOptions | false", def: "built-in UI" },
];

export const UI_OPTIONS: ApiRow[] = [
  { id: "toolbar", name: "toolbar", type: "string[] | false", def: "DEFAULT_TOOLBAR" },
  { id: "items", name: "items", type: "Record<string, ItemSpec>" },
  {
    id: "statusbar",
    name: "statusbar",
    type: "{ elementPath, wordCount, characterCount } | false",
  },
  { id: "theme", name: "theme", type: '"auto" | "light" | "dark"', def: '"auto"' },
  { id: "stickyToolbar", name: "stickyToolbar", type: "boolean", def: "true" },
  {
    id: "shortcuts",
    name: "shortcuts",
    type: "{ toolbar, help, find, link }",
    def: "Alt-F10, Alt-0, Mod-f, Mod-k",
  },
];

export const CALLBACKS: ApiRow[] = [
  { id: "onCreate", name: "onCreate", type: "(editor) => void" },
  { id: "onUpdate", name: "onUpdate", type: "(editor) => void" },
  { id: "onSelectionUpdate", name: "onSelectionUpdate", type: "(editor) => void" },
  { id: "onFocus", name: "onFocus, onBlur", type: "(editor, event) => void" },
  { id: "onDestroy", name: "onDestroy", type: "() => void" },
  { id: "onContentError", name: "onContentError", type: "(error: Error) => void" },
];

export const METHODS: ApiRow[] = [
  { id: "getHTML", name: "getHTML()", type: "string" },
  { id: "getJSON", name: "getJSON()", type: "JSONContent" },
  { id: "getText", name: "getText({ blockSeparator })", type: "string" },
  { id: "setContent", name: "setContent(content, { emitUpdate, addToHistory })", type: "void" },
  { id: "clearContent", name: "clearContent()", type: "void" },
  { id: "isEmpty", name: "isEmpty, isFocused, isEditable", type: "boolean" },
  { id: "setEditable", name: "setEditable(editable)", type: "void" },
  { id: "setOptions", name: "setOptions(options)", type: "void" },
  { id: "commands", name: "commands.name()", type: "boolean" },
  { id: "can", name: "can().name()", type: "boolean" },
  { id: "chain", name: "chain().…run()", type: "boolean" },
  { id: "isActive", name: "isActive(name, attrs?)", type: "boolean" },
  { id: "getAttributes", name: "getAttributes(name)", type: "object" },
  { id: "on", name: "on(event, fn)", type: "() => void" },
  { id: "subscribe", name: "subscribe(fn)", type: "() => void" },
  { id: "announce", name: "announce(message)", type: "void" },
  { id: "focus", name: "focus(), blur()", type: "void" },
  { id: "destroy", name: "destroy()", type: "void" },
];

export const ELEMENT_ATTRIBUTES: ApiRow[] = [
  { id: "name", name: "name", type: "string" },
  { id: "placeholder", name: "placeholder", type: "string" },
  { id: "readonly", name: "readonly", type: "boolean" },
  { id: "disabled", name: "disabled", type: "boolean" },
  { id: "dir", name: "dir", type: "ltr | rtl | auto" },
  { id: "content", name: "content-lang", type: "string" },
  { id: "label", name: "label", type: "string" },
  { id: "value", name: "value", type: "HTML string" },
  { id: "language", name: "language", type: "string" },
  { id: "toolbar", name: "toolbar", type: "string" },
];

export const ELEMENT_PROPERTIES: ApiRow[] = [
  { id: "editor", name: "editor", type: "Editor | null" },
  { id: "value", name: "value", type: "string" },
  { id: "options", name: "options", type: "EditorOptions" },
  { id: "form", name: "form", type: "HTMLFormElement | null" },
];

export const ELEMENT_EVENTS: ApiRow[] = [
  { id: "input", name: "input", type: "Event" },
  { id: "change", name: "change", type: "Event" },
];

export const ENTRY_POINTS: ApiRow[] = [
  { id: "core", name: "open-wysiwyg-editor", type: "ESM + CJS + .d.ts" },
  { id: "headless", name: "open-wysiwyg-editor/headless", type: "ESM + CJS + .d.ts" },
  { id: "element", name: "open-wysiwyg-editor/element", type: "ESM + CJS + .d.ts" },
  { id: "styleCss", name: "open-wysiwyg-editor/style.css", type: "CSS" },
  { id: "contentCss", name: "open-wysiwyg-editor/content.css", type: "CSS" },
  { id: "globalJs", name: "dist/open-wysiwyg-editor.global.js", type: "IIFE" },
];

export const COMMANDS: CommandGroup[] = [
  {
    id: "marks",
    commands:
      "toggleBold toggleItalic toggleUnderline toggleStrike toggleCode toggleSubscript toggleSuperscript unsetAllMarks",
  },
  {
    id: "color",
    commands:
      "setTextColor(color) unsetTextColor setHighlight(color?) unsetHighlight toggleHighlight(color?)",
  },
  {
    id: "blocks",
    commands:
      "setParagraph setHeading(level) toggleHeading(level) clearNodes toggleBlockquote toggleCodeBlock setHorizontalRule setHardBreak",
  },
  {
    id: "lists",
    commands: "toggleBulletList toggleOrderedList toggleTaskList sinkListItem liftListItem",
  },
  {
    id: "linksAndImages",
    commands:
      "setLink({ href, text?, title?, newTab? }) unsetLink setImage({ src, alt, caption? }) updateImage",
  },
  {
    id: "tables",
    commands:
      "insertTable({ rows, cols, withHeaderRow, caption }) addRowBefore addRowAfter addColumnBefore addColumnAfter deleteRow deleteColumn deleteTable mergeCells splitCell toggleHeaderRow toggleHeaderColumn setTableCaption",
  },
  {
    id: "layout",
    commands:
      'setTextAlign("start" | "center" | "end" | "justify") setTextDirection("ltr" | "rtl" | "auto") unsetTextAlign unsetTextDirection',
  },
  {
    id: "find",
    commands:
      "setSearch({ query, caseSensitive, wholeWord }) findNext findPrevious replaceCurrent(text) replaceAll(text) clearSearch",
  },
  { id: "general", commands: "undo redo focus blur selectAll" },
];
