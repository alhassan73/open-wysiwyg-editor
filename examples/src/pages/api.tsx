import { Callout } from "../components/Callout";
import { CodeBlock } from "../components/CodeBlock";
import { Layout } from "../components/Layout";
import { PropsTable } from "../components/PropsTable";
import { PageHead, Section, P } from "../components/ui";
import type { PropRow } from "../content/frameworks";
import { mount } from "../mount";

const OPTIONS: PropRow[] = [
  { name: "element", type: "HTMLElement | string | <textarea>", desc: "Container, CSS selector or textarea (hidden and kept in sync). Omit it to create the editor detached and append editor.root yourself." },
  { name: "content", type: "string | JSON", desc: "Initial content: HTML (always sanitized) or ProseMirror JSON." },
  { name: "extensions", type: "AnyExtension[]", def: "[StarterKit]", desc: "The feature set." },
  { name: "editable", type: "boolean", def: "true", desc: "Allow editing." },
  { name: "autofocus", type: 'boolean | "start" | "end"', def: "false", desc: "Focus on creation." },
  { name: "placeholder", type: "string", desc: "Text shown when empty." },
  { name: "ariaLabel, ariaLabelledBy, ariaDescribedBy", type: "string", desc: "Accessible name and description of the editing area." },
  { name: "language", type: "string", def: "<html lang>", desc: "UI language. Built in: en, ar." },
  { name: "languages", type: "EditorLanguage[]", desc: "Add or replace UI languages." },
  { name: "labels", type: "Partial<Labels>", desc: "Override single UI strings." },
  { name: "dir", type: '"ltr" | "rtl" | "auto"', desc: "Base direction of the content." },
  { name: "contentLang", type: "string", desc: "lang of the content, used for spellcheck and screen readers." },
  { name: "urlPolicy", type: "UrlPolicy", desc: "{ protocols, allowDataImages, allowRelative }. Allowed link and image URLs." },
  { name: "inputRules", type: "boolean", def: "true", desc: 'Markdown-style shortcuts: "# ", "* ", "1. ", "> ", fenced code, **bold**…' },
  { name: "ui", type: "UIOptions | false", def: "built-in UI", desc: "Toolbar, custom items, status bar, theme and shortcuts. false = headless." },
  { name: "onCreate, onUpdate, onSelectionUpdate, onFocus, onBlur, onDestroy, onContentError", type: "callbacks", desc: "Editor events (see below)." },
];

const UI_OPTIONS: PropRow[] = [
  { name: "toolbar", type: "string[] | false", def: "DEFAULT_TOOLBAR", desc: 'Item names and "|" separators. false hides the toolbar.' },
  { name: "items", type: "Record<string, ItemSpec>", desc: "Custom or overriding toolbar buttons, referenced by name in toolbar." },
  { name: "statusbar", type: "{ elementPath, wordCount, characterCount } | false", desc: "Status bar content. characterCount can take { limit }." },
  { name: "theme", type: '"auto" | "light" | "dark"', def: '"auto"', desc: "Color theme of the editor." },
  { name: "stickyToolbar", type: "boolean", def: "true", desc: "Keep the toolbar visible while scrolling long documents." },
  { name: "shortcuts", type: "{ toolbar, help, find, link }", def: "Alt-F10, Alt-0, Mod-f, Mod-k", desc: "Key bindings of the built-in UI." },
];

const EVENTS: PropRow[] = [
  { name: "onCreate", type: "(editor) => void", desc: "The editor was created." },
  { name: "onUpdate", type: "(editor) => void", desc: "The content changed." },
  { name: "onSelectionUpdate", type: "(editor) => void", desc: "The selection changed." },
  { name: "onFocus, onBlur", type: "(editor, event) => void", desc: "The editing area gained or lost focus." },
  { name: "onDestroy", type: "() => void", desc: "The editor was destroyed." },
  { name: "onContentError", type: "(error: Error) => void", desc: "Content could not be loaded." },
];

const COMMANDS: PropRow[] = [
  { name: "Marks", type: "", desc: "toggleBold toggleItalic toggleUnderline toggleStrike toggleCode toggleSubscript toggleSuperscript unsetAllMarks" },
  { name: "Color", type: "", desc: "setTextColor(color) unsetTextColor setHighlight(color?) unsetHighlight toggleHighlight(color?)" },
  { name: "Blocks", type: "", desc: "setParagraph setHeading(level) toggleHeading(level) clearNodes toggleBlockquote toggleCodeBlock setHorizontalRule setHardBreak" },
  { name: "Lists", type: "", desc: "toggleBulletList toggleOrderedList toggleTaskList sinkListItem liftListItem" },
  { name: "Links and images", type: "", desc: "setLink({ href, text?, title?, newTab? }) unsetLink setImage({ src, alt, caption? }) updateImage" },
  { name: "Tables", type: "", desc: "insertTable({ rows, cols, withHeaderRow, caption }) addRowBefore addRowAfter addColumnBefore addColumnAfter deleteRow deleteColumn deleteTable mergeCells splitCell toggleHeaderRow toggleHeaderColumn setTableCaption" },
  { name: "Layout", type: "", desc: 'setTextAlign("start" | "center" | "end" | "justify") setTextDirection("ltr" | "rtl" | "auto") and the matching unset commands' },
  { name: "Find", type: "", desc: "setSearch({ query, caseSensitive, wholeWord }) findNext findPrevious replaceCurrent(text) replaceAll(text) clearSearch" },
  { name: "General", type: "", desc: "undo redo focus blur selectAll" },
];

const HELPERS: PropRow[] = [
  { name: "RUNTIME_OPTIONS", type: "string[]", desc: "The options an existing editor can change through setOptions(): editable, placeholder, ariaLabel, ariaLabelledBy, ariaDescribedBy, dir, contentLang." },
  { name: "pickRuntimeOptions(options)", type: "(o) => Partial<EditorOptions>", desc: "Returns only those options from an options object." },
  { name: "sameRuntimeOptions(a, b)", type: "(a, b) => boolean", desc: "true when two such objects hold the same values, so you can skip a setOptions() call." },
  { name: "forwardCallbacks(get)", type: "(get) => Callbacks", desc: "Returns onCreate, onUpdate, onSelectionUpdate, onFocus, onBlur, onDestroy and onContentError handlers that always call the latest options' versions." },
  { name: "syncContent(editor, content)", type: "(editor, content) => void", desc: "Loads bound content into the editor, and skips HTML the editor itself just produced, so typing never resets the cursor." },
];

function Api() {
  return (
    <Layout path="api.html" docs>
      <PageHead eyebrow="Reference" title="API" lead="Everything the core package exports, in one page. The framework packages re-export all of it." />

      <Section id="create" title="createEditor(options)">
        <P text="`createEditor(options)` returns an `Editor`. The full set of options with their defaults:" />
        <CodeBlock
          lang="ts"
          code={`createEditor({
  element,                 // container, CSS selector or <textarea>
  content,                 // HTML string (always sanitized) or ProseMirror JSON
  extensions: [StarterKit],
  editable: true,
  autofocus: false,        // true | "start" | "end"
  placeholder: "Write something…",
  ariaLabel, ariaLabelledBy, ariaDescribedBy,

  language: "ar",          // UI language; defaults to <html lang>
  languages,               // add or replace UI languages
  labels: { bold: "Strong" },
  dir: "rtl",              // base direction of the content
  contentLang: "ar-EG",    // lang of the content

  urlPolicy: { protocols: ["https", "mailto"], allowDataImages: false, allowRelative: true },
  inputRules: true,        // Markdown-style shortcuts

  onCreate, onUpdate, onSelectionUpdate, onFocus, onBlur, onDestroy, onContentError,

  ui: {                    // or \`false\` for headless
    toolbar: ["bold", "italic", "|", "link", "textColor", "highlight", "|", "sourceCode"],
    items: { /* custom buttons */ },
    statusbar: { elementPath: true, wordCount: true, characterCount: false }, // or false
    theme: "auto",         // "light" | "dark"
    stickyToolbar: true,
    shortcuts: { toolbar: "Alt-F10", help: "Alt-0", find: "Mod-f", link: "Mod-k" },
  },
});`}
        />
        <PropsTable title="createEditor options" kind="options" rows={OPTIONS} />
        <h3>UI options</h3>
        <PropsTable title="ui options" kind="options" rows={UI_OPTIONS} />
        <h3>Callbacks</h3>
        <PropsTable title="Editor callbacks" kind="events" rows={EVENTS} />
      </Section>

      <Section id="methods" title="Editor methods">
        <CodeBlock
          lang="ts"
          code={`editor.getHTML();                         // clean, sanitized HTML
editor.getJSON();                         // ProseMirror JSON
editor.getText({ blockSeparator: "\\n\\n" });
editor.setContent(htmlOrJson, { emitUpdate: false, addToHistory: false });
editor.clearContent();
editor.isEmpty; editor.isFocused; editor.isEditable;
editor.setEditable(false);
editor.setOptions({ placeholder: "…", dir: "rtl" });

editor.commands.toggleBold();             // run one command
editor.can().toggleBold();                // would it work here?
editor.chain().focus().toggleBold().setTextColor("#b3261e").run(); // one transaction, one undo step

editor.isActive("heading", { level: 2 });
editor.getAttributes("link");             // { href, target, title }

editor.on("update", () => {});            // returns an unsubscribe function
editor.subscribe(() => {});               // store-style: fires on every change
editor.announce("Saved");                 // send a message to screen readers
editor.destroy();`}
        />
        <P text="The main entry also exports `getUI(editor)`, which returns `focusToolbar()`, `openDialog(kind)`, `openFind()`, `toggleSource()`, `isSourceMode()` and `update()`." />
      </Section>

      <Section id="commands" title="Commands">
        <P text="Run commands with `editor.commands.name()`, test them with `editor.can().name()` and combine them with `editor.chain()...run()`." />
        <PropsTable title="Commands by area" kind="options" rows={COMMANDS} />
        <Callout tone="info" title="Colors">
          Color commands accept hex, rgb(), hsl() or named colors. Anything else is refused and the command returns false.
        </Callout>
      </Section>

      <Section id="toolbar" title="Toolbar and custom buttons">
        <P text="The default toolbar contains:" />
        <CodeBlock
          lang="plain"
          code={`undo redo | blockType | bold italic underline strike code | textColor highlight | link |
bulletList orderedList taskList | blockquote codeBlock | align direction |
image table horizontalRule | removeFormat | find sourceCode help`}
        />
        <P text="`subscript` and `superscript` are also available. A toolbar item only appears when its extension is enabled. Add your own button:" />
        <CodeBlock
          lang="ts"
          code={`import { createEditor, DEFAULT_TOOLBAR } from "open-wysiwyg-editor";

createEditor({
  element,
  ui: {
    toolbar: [...DEFAULT_TOOLBAR, "|", "timestamp"],
    items: {
      timestamp: {
        label: "Insert date",
        text: "Date",
        run: (editor) => {
          editor.view.dispatch(editor.state.tr.insertText(new Date().toLocaleDateString()));
          editor.focus();
        },
        isEnabled: (editor) => editor.isEditable,
      },
    },
  },
});`}
        />
      </Section>

      <Section id="extensions" title="Extensions">
        <P text="Everything is built from extensions. Configure or remove any of them, or write your own:" />
        <CodeBlock
          lang="ts"
          code={`StarterKit.configure({ table: false, heading: { levels: [2, 3] }, textAlign: { output: "class" } });

import { defineExtension } from "open-wysiwyg-editor";

const Timestamp = defineExtension({
  name: "timestamp",
  commands: () => ({
    insertTimestamp: () => (state, dispatch) => {
      dispatch?.(state.tr.insertText(new Date().toISOString()));
      return true;
    },
  }),
  keymap: ({ editor }) => ({ "Mod-Shift-d": () => editor.commands.insertTimestamp() }),
});

declare module "open-wysiwyg-editor" {
  interface CommandMap { insertTimestamp: [] }
}

createEditor({ element, extensions: [StarterKit, Timestamp] });`}
        />
        <P text="`defineExtension` also accepts `nodes`, `marks`, `globalAttributes`, `inputRules`, `plugins` (raw ProseMirror plugins), `onCreate` and `onDestroy`. Call `.configure(options)` on any extension to change its options." />
        <h3>HTML support (opt-in)</h3>
        <P text="By default the editor keeps only the markup its schema understands. Add `HtmlSupport` to keep other HTML too, with allow and disallow rules. Event handlers, javascript: URLs, url() and expression() in styles, and ids that could clobber DOM globals are always removed." />
        <CodeBlock
          lang="ts"
          code={`import { createEditor, StarterKit, HtmlSupport } from "open-wysiwyg-editor";

createEditor({ element, extensions: [StarterKit, HtmlSupport] }); // "safe" preset

HtmlSupport.configure({
  allow: [
    { name: "section", classes: ["card", /^theme-/] },
    { name: "p", attributes: ["data-*"], styles: ["text-indent"] },
  ],
  disallow: [{ name: "p", attributes: ["data-secret"] }], // disallow always wins
});`}
        />
      </Section>

      <Section id="entries" title="Entry points">
        <PropsTable
          title="Package entry points"
          kind="options"
          rows={[
            { name: "open-wysiwyg-editor", type: "ESM + CJS + .d.ts", desc: "The engine, every extension and the accessible UI." },
            { name: "open-wysiwyg-editor/headless", type: "ESM + CJS + .d.ts", desc: "The engine and extensions without UI code." },
            { name: "open-wysiwyg-editor/element", type: "ESM + CJS + .d.ts", desc: "Defines the <owe-editor> element." },
            { name: "open-wysiwyg-editor/style.css", type: "CSS", desc: "Editor, UI and content styles (also style.min.css)." },
            { name: "open-wysiwyg-editor/content.css", type: "CSS", desc: "Content styles only, for pages that display saved HTML (also content.min.css)." },
            { name: "dist/open-wysiwyg-editor.global.js", type: "IIFE", desc: "A script tag build. Exposes window.OpenWysiwygEditor and defines <owe-editor>." },
          ]}
        />
      </Section>

      <Section id="integration" title="Integration helpers">
        <P text="The framework packages are thin wrappers around a few helpers the core exports. Use them to write an integration for any other framework." />
        <PropsTable title="Integration helpers" kind="options" rows={HELPERS} />
      </Section>
    </Layout>
  );
}

mount(<Api />);
