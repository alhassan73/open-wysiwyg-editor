# Open WYSIWYG Editor

[![npm version](https://img.shields.io/npm/v/open-wysiwyg-editor)](https://www.npmjs.com/package/open-wysiwyg-editor)
[![bundle size](https://img.shields.io/bundlephobia/minzip/open-wysiwyg-editor)](https://bundlephobia.com/package/open-wysiwyg-editor)
[![license](https://img.shields.io/npm/l/open-wysiwyg-editor)](https://github.com/alhassan73/open-wysiwyg-editor/blob/main/LICENSE)

**[Live demo →](https://alhassan73.github.io/open-wysiwyg-editor/)** · [GitHub](https://github.com/alhassan73/open-wysiwyg-editor) · [npm](https://www.npmjs.com/package/open-wysiwyg-editor)

An accessible rich text editor that works on **any website**: plain HTML/JS, React, Next.js, Vue, Nuxt, Angular, Svelte, Astro, WordPress and more. It's RTL-first, it runs under a strict Content Security Policy, and it ships its own TypeScript types. MIT licensed, with no license key, no telemetry and no cloud service.

Built on [ProseMirror](https://prosemirror.net). Content is stored as HTML or JSON, and node and mark names match Tiptap's.

## Features

| Area | What you get |
| --- | --- |
| **Formatting** | Headings · Bold, italic, underline, strike, inline code · Subscript / superscript · Text and highlight colors · Alignment · Text direction per block |
| **Blocks** | Bullet, numbered and task lists · Blockquote · Code block · Horizontal rule · Tables with caption and header rows · Images with alt text and caption · Links |
| **Tools** | Find & replace · HTML source view · Word and character count · Element path · Keyboard shortcut help · Undo / redo · Markdown-style typing shortcuts |
| **Accessibility** | WCAG 2.2 AA, ATAG 2.0 and WAI-ARIA patterns · Fully keyboard operable, no keyboard trap · Screen reader announcements · Windows High Contrast · Dark theme |
| **Security** | DOMPurify on every input · URL allow-list · Trusted Types · No `unsafe-inline` needed |
| **Languages** | English and Arabic built in (add your own) · Mirrored UI in RTL · `dir="auto"` on every block |
| **Your way** | Full UI by default · Headless mode for your own UI · Custom toolbar buttons · Extensions API · Theme with CSS variables |

Every release is tested end to end in Chromium, Firefox and WebKit, under a strict CSP with Trusted Types and with axe-core accessibility checks.

## Install

```bash
npm install open-wysiwyg-editor
# or
pnpm add open-wysiwyg-editor
# or
yarn add open-wysiwyg-editor
```

Or with no build step, from a CDN:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/open-wysiwyg-editor@0.1/dist/style.min.css" />
<script src="https://cdn.jsdelivr.net/npm/open-wysiwyg-editor@0.1/dist/open-wysiwyg-editor.global.js"></script>
```

## Usage

The core is one function, `createEditor(options)`. It mounts the editor inside the element you pass and returns an `editor` instance. Follow three rules in every framework:

1. Load the stylesheet once: `import "open-wysiwyg-editor/style.css"` (or the `<link>` above).
2. Call `createEditor()` **in the browser**, after the element exists. It throws during server-side rendering.
3. Call `editor.destroy()` when the element goes away.

### Plain HTML / JavaScript (no framework, no bundler)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/open-wysiwyg-editor@0.1/dist/style.min.css" />
<script src="https://cdn.jsdelivr.net/npm/open-wysiwyg-editor@0.1/dist/open-wysiwyg-editor.global.js"></script>

<div id="editor"><p>Hello <strong>world</strong></p></div>

<script>
  const editor = OpenWysiwygEditor.createEditor({
    element: document.querySelector("#editor"),
    placeholder: "Write something…",
  });
  // editor.getHTML() → '<p dir="auto">Hello <strong>world</strong></p>'
</script>
```

This also works in WordPress, Shopify, Webflow, PHP, Django and Rails templates.

### HTML forms

Mount the editor on a `<textarea>`. The editor hides the textarea and keeps its value in sync, so the form submits the HTML. The textarea's `<label>` becomes the editor's accessible name.

```html
<form method="post">
  <label for="body">Article</label>
  <textarea id="body" name="body"><p>Draft…</p></textarea>
  <button>Save</button>
</form>
<script>
  OpenWysiwygEditor.createEditor({ element: document.querySelector("#body") });
</script>
```

### Any bundler (Vite, Webpack, Parcel…), JS or TS

```js
import { createEditor } from "open-wysiwyg-editor";
import "open-wysiwyg-editor/style.css";

const editor = createEditor({
  element: document.querySelector("#editor"),
  onUpdate: (editor) => console.log(editor.getHTML()),
});
```

### React (Vite, CRA, Remix, Gatsby)

```tsx
import { useEffect, useRef } from "react";
import { createEditor } from "open-wysiwyg-editor";
import "open-wysiwyg-editor/style.css";

export function RichText({ defaultValue, onChange }: { defaultValue?: string; onChange?: (html: string) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const change = useRef(onChange);
  change.current = onChange;

  useEffect(() => {
    const editor = createEditor({
      element: host.current,
      content: defaultValue,
      onUpdate: (e) => change.current?.(e.getHTML()),
    });
    return () => editor.destroy();
  }, []);

  return <div ref={host} />;
}
```

### Next.js (App Router)

Put the component above in a file that starts with `"use client"`, then use it from any page or layout. Import the stylesheet in `app/layout.tsx` or in that client file.

```tsx
// app/editor/page.tsx
import { RichText } from "@/components/rich-text"; // the file starts with "use client"

export default function Page() {
  return <RichText defaultValue="<p>Hello</p>" />;
}
```

On the Pages Router, the same component works as is.

### Vue 3

```vue
<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { createEditor } from "open-wysiwyg-editor";
import "open-wysiwyg-editor/style.css";

const html = defineModel({ type: String, default: "" });
const host = ref();
let editor;

onMounted(() => {
  editor = createEditor({
    element: host.value,
    content: html.value,
    onUpdate: (e) => (html.value = e.getHTML()),
  });
});
onBeforeUnmount(() => editor?.destroy());
</script>

<template><div ref="host" /></template>
```

### Nuxt 3

Use the Vue component above inside `<ClientOnly>`. The editor needs the browser DOM.

```vue
<ClientOnly><RichText v-model="article" /></ClientOnly>
```

### Angular

```ts
import { Component, ElementRef, NgZone, OnDestroy, afterNextRender, inject, output, viewChild } from "@angular/core";
import { createEditor, type Editor } from "open-wysiwyg-editor";

@Component({
  selector: "app-rich-text",
  template: `<div #host></div>`,
})
export class RichTextComponent implements OnDestroy {
  readonly changed = output<string>();
  private host = viewChild.required<ElementRef<HTMLElement>>("host");
  private zone = inject(NgZone);
  private editor?: Editor;

  constructor() {
    // afterNextRender only runs in the browser, so this is safe with Angular SSR.
    afterNextRender(() => {
      this.editor = this.zone.runOutsideAngular(() =>
        createEditor({
          element: this.host().nativeElement,
          onUpdate: (e) => this.zone.run(() => this.changed.emit(e.getHTML())),
        }),
      );
    });
  }

  ngOnDestroy() {
    this.editor?.destroy();
  }
}
```

Add the stylesheet to `angular.json`, in `"styles": ["node_modules/open-wysiwyg-editor/dist/style.css"]`.

### Svelte / SvelteKit

```svelte
<script>
  import { onMount } from "svelte";
  import { createEditor } from "open-wysiwyg-editor";
  import "open-wysiwyg-editor/style.css";

  let host;
  let html = "<p>Hello</p>";

  onMount(() => {
    const editor = createEditor({ element: host, content: html, onUpdate: (e) => (html = e.getHTML()) });
    return () => editor.destroy();
  });
</script>

<div bind:this={host}></div>
```

`onMount` never runs on the server, so this is safe in SvelteKit.

### Astro

```astro
<div id="editor"></div>
<script>
  import { createEditor } from "open-wysiwyg-editor";
  import "open-wysiwyg-editor/style.css";
  createEditor({ element: document.querySelector("#editor") });
</script>
```

### Headless (bring your own UI)

Use the headless entry when you want the engine and every extension without the built-in UI:

```js
import { createEditor, StarterKit } from "open-wysiwyg-editor/headless";

const editor = createEditor({ element, extensions: [StarterKit] });
boldButton.onclick = () => editor.chain().focus().toggleBold().run();
editor.subscribe(() => {
  boldButton.setAttribute("aria-pressed", String(editor.isActive("bold")));
});
```

From the main entry, `createEditor({ ui: false })` does the same thing.

### Reading and saving content

```js
editor.getHTML();             // clean, sanitized HTML: save this
editor.getJSON();             // or ProseMirror JSON
editor.setContent("<p>…</p>"); // load new content
```

Still sanitize on the server. To display saved HTML on a page that has no editor, load `content.css` and wrap the HTML in `<div class="owe-content-root">` (see [Styling](#styling)).

---

## Options

```ts
createEditor({
  element,                 // container or <textarea>; omit to create it detached and append editor.root yourself
  content,                 // HTML string (always sanitized) or ProseMirror JSON
  extensions: [StarterKit],
  editable: true,
  autofocus: false,        // true | "start" | "end"
  placeholder: "Write something…",
  ariaLabel, ariaLabelledBy, ariaDescribedBy,

  language: "ar",          // UI language; defaults to <html lang>
  languages,               // add or replace UI languages (see i18n)
  labels: { bold: "Strong" },
  dir: "rtl",              // base direction of the content
  contentLang: "ar-EG",    // lang of the content (used for spellcheck and screen readers)

  urlPolicy: { protocols: ["https", "mailto"], allowDataImages: false, allowRelative: true },
  inputRules: true,        // Markdown-style shortcuts: "# ", "* ", "1. ", "> ", "```", **bold**…

  onCreate, onUpdate, onSelectionUpdate, onFocus, onBlur, onDestroy, onContentError,

  ui: {                    // or `false` for headless
    toolbar: ["bold", "italic", "|", "link", "textColor", "highlight", "|", "sourceCode"],
    items: { /* custom buttons, see below */ },
    statusbar: { elementPath: true, wordCount: true, characterCount: false }, // or false
    theme: "auto",         // "light" | "dark"
    stickyToolbar: true,
    shortcuts: { toolbar: "Alt-F10", help: "Alt-0", find: "Mod-f", link: "Mod-k" },
  },
});
```

## Editor API

```ts
editor.getHTML();                         // clean, sanitized HTML
editor.getJSON();                         // ProseMirror JSON
editor.getText({ blockSeparator: "\n\n" });
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
editor.subscribe(() => {});               // store-style: fires on every change (useSyncExternalStore-friendly)
editor.announce("Saved");                 // send a message to screen readers
editor.destroy();
```

The main entry also exports `getUI(editor)`, which returns `focusToolbar()`, `openDialog(kind)`, `openFind()`, `toggleSource()`, `isSourceMode()` and `update()`.

### Commands

| Area | Commands |
| --- | --- |
| Marks | `toggleBold` `toggleItalic` `toggleUnderline` `toggleStrike` `toggleCode` `toggleSubscript` `toggleSuperscript` `unsetAllMarks` |
| Color | `setTextColor(color)` `unsetTextColor` `setHighlight(color?)` `unsetHighlight` `toggleHighlight(color?)` |
| Blocks | `setParagraph` `setHeading(level)` `toggleHeading(level)` `clearNodes` `toggleBlockquote` `toggleCodeBlock` `setHorizontalRule` `setHardBreak` |
| Lists | `toggleBulletList` `toggleOrderedList` `toggleTaskList` `sinkListItem` `liftListItem` |
| Links & images | `setLink({ href, text?, title?, newTab? })` `unsetLink` `setImage({ src, alt, caption? })` `updateImage` |
| Tables | `insertTable({ rows, cols, withHeaderRow, caption })` `addRowBefore/After` `addColumnBefore/After` `deleteRow` `deleteColumn` `deleteTable` `mergeCells` `splitCell` `toggleHeaderRow` `toggleHeaderColumn` `setTableCaption` |
| Layout | `setTextAlign("start" \| "center" \| "end" \| "justify")` `setTextDirection("ltr" \| "rtl" \| "auto")` and the matching `unset…` |
| Find | `setSearch({ query, caseSensitive, wholeWord })` `findNext` `findPrevious` `replaceCurrent(text)` `replaceAll(text)` `clearSearch` |
| General | `undo` `redo` `focus` `blur` `selectAll` |

Color commands accept hex, `rgb()`, `hsl()` or named colors. Anything else is refused and the command returns `false`.

---

## Feature guide

### Toolbar

The default toolbar contains:

`undo redo | blockType | bold italic underline strike code | textColor highlight | link | bulletList orderedList taskList | blockquote codeBlock | align direction | image table horizontalRule | removeFormat | find sourceCode help`

`subscript` and `superscript` are also available. A toolbar item only appears when its extension is enabled. On narrow screens and at 400% zoom the toolbar wraps onto more lines instead of scrolling sideways (WCAG 1.4.10).

To add your own button:

```js
import { createEditor, DEFAULT_TOOLBAR } from "open-wysiwyg-editor";

createEditor({
  element,
  ui: {
    toolbar: [...DEFAULT_TOOLBAR, "|", "timestamp"],
    items: {
      timestamp: {
        label: "Insert date",
        text: "Date",           // or icon: "<built-in name>" | ["M4 12h16", …] (24×24 SVG paths)
        // shortcut: "Mod-Shift-d" only shows the key in the tooltip; bind it with an extension keymap
        run: (editor) => {
          editor.view.dispatch(editor.state.tr.insertText(new Date().toLocaleDateString()));
          editor.focus();
        },
        isEnabled: (editor) => editor.isEditable,
      },
    },
  },
});
```

### Text and background color

The **Text color** and **Highlight** menu buttons open a palette of named swatches. Every built-in color has at least 4.5:1 contrast (WCAG AA): text colors against white, and highlights behind dark text. Each swatch is a menu radio item announced by name ("Dark red"), and the trigger button reports the current color.

**Custom…** opens a dialog with a color picker and a hex field. As you type, the dialog shows the contrast ratio live and warns when the color is below the AA minimum.

- The output is portable: `<span style="color: #b3261e">` and `<mark style="background-color: #fff2a8">`.
- Inside the editor, colors are applied through the CSSOM, never as `style` strings, so the live view stays clean under strict CSP.
- When you paste, noise colors are dropped: Word and Google Docs add black text, white or transparent backgrounds and `windowtext`. Real colors are kept.
- Set your own palettes with `StarterKit.configure({ textColor: { palette: [{ name: "Brand", value: "#0b57d0" }] } })`.
- The shortcut <kbd>Ctrl/⌘ + Shift + H</kbd> toggles the highlight.

The color helpers are exported: `normalizeColor`, `contrastRatio`, `luminance`, `parseColor`, `TEXT_PALETTE` and `HIGHLIGHT_PALETTE`.

### HTML source view

The **Source code** button switches the editing area to a formatted, editable view of the HTML. When you switch back, the HTML is sanitized and parsed into the document again. Your edits become a single undo step. While the source view is open, the formatting buttons are disabled. It is also available from code: `getUI(editor).toggleSource()`.

### General HTML support (opt-in)

By default the editor keeps only the markup its schema understands. This is the safest choice and gives the most predictable output. Add `HtmlSupport` to also keep other HTML the editor doesn't model, such as wrapper `<div>` and `<section>` elements, `<details>`, `<dl>`, `<abbr>`, `<span lang>`, classes, `data-*` attributes and ids:

```js
import { createEditor, StarterKit, HtmlSupport } from "open-wysiwyg-editor";

createEditor({ element, extensions: [StarterKit, HtmlSupport] }); // "safe" preset
```

You can also allow exactly what you want:

```js
HtmlSupport.configure({
  allow: [
    { name: "section", classes: ["card", /^theme-/] },
    { name: "p", attributes: ["data-*"], styles: ["text-indent"] },
  ],
  disallow: [{ name: "p", attributes: ["data-secret"] }], // disallow always wins
});
```

Some things are always removed, whatever the rules say:

- event handlers
- `javascript:` and similar URLs
- `url()` and `expression()` in styles
- `contenteditable`, `tabindex` and `hidden`
- the editor's own classes
- ids that could clobber DOM globals

Attributes stored in JSON are validated again before output. Allowed `style` values are written to the output only. In the live editor they still need `style-src-attr 'unsafe-inline'`, so leave `styles` out if you need the editor to stay fully CSP-clean.

### More

- **Tables.** Caption and header rows are on by default. Rows and columns can be inserted, deleted, merged and split, and header rows or columns can be toggled. Tab moves between cells.
- **Images.** The dialog asks for alt text, offers a "decorative image" option, and accepts an optional caption. Pasted or dropped files are uploaded only through your own `upload` function: `StarterKit.configure({ image: { upload: async (file) => url } })`. Without one, nothing is inserted, so you never get silent base64 data or surprise network calls.
- **Links.** The dialog has URL, text, title and "open in new tab" fields (new-tab links always get `rel="noopener noreferrer"`). Pasting a URL over selected text turns it into a link. Add rel values for user-generated content with `link: { rel: "nofollow ugc" }`.
- **Paste cleanup.** Pastes from Word, Google Docs and web pages are cleaned. Word's fake lists become real lists, and junk spans, comments and styles are stripped.
- **Find & replace.** Supports case-sensitive and whole-word search (word boundaries work in Arabic and CJK too), and announces the match count ("2 of 5 matches") and how many matches were replaced.
- **Status bar.** Shows an element path (a breadcrumb that selects the element you click) and word and character counts that segment words correctly in Arabic and CJK. Set a limit with `characterCount: { limit: 5000 }`.
- **Configure or remove anything.** For example: `StarterKit.configure({ table: false, heading: { levels: [2, 3] }, textAlign: { output: "class" } })`.

---

## Security

| Layer | What it does |
| --- | --- |
| Input | Every input path (initial content, `setContent`, paste, drop, source view) passes through DOMPurify. Script-capable elements are removed before parsing. |
| Model | Only schema-known content survives, unless `HtmlSupport` is added, and even then its blocklist applies. |
| Output | `getHTML()` is produced by a serializer that does not use the DOM. It validates tag and attribute names, escapes every value and checks every URL again. |
| URLs | Allowed by default: `http`, `https`, `mailto` and `tel`, plus relative URLs. `data:` images are off unless `urlPolicy.allowDataImages` is set. |
| CSP | Works under `script-src 'self'; style-src 'self'; require-trusted-types-for 'script'`. The live view never writes inline style strings. |
| Trusted Types | Adds one policy named `open-wysiwyg-editor` to your `trusted-types` directive, or pass your own with `setTrustedTypesPolicy()`. |

Still sanitize on the server. Never trust HTML that comes from the client. Report vulnerabilities through [SECURITY.md](https://github.com/alhassan73/open-wysiwyg-editor/blob/main/SECURITY.md).

Recommended CSP:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self';
  img-src 'self' https: data:; require-trusted-types-for 'script';
  trusted-types open-wysiwyg-editor
```

If your published pages also forbid inline styles, use `textAlign: { output: "class" }` and the [content stylesheet](#styling).

## Accessibility

- **Toolbar.** The toolbar follows the ARIA toolbar pattern with a single tab stop and a roving tabindex. Arrow keys, Home and End move between buttons, and the arrows follow RTL direction. Buttons announce their pressed or expanded state and their keyboard shortcuts.
- **Menus and dialogs.** Menus follow the APG menu-button pattern. Dialogs are native `<dialog>` elements with labelled fields, inline error messages and focus returned to where you were.
- **No keyboard trap.** In the text, Tab indents lists and moves between table cells. Press <kbd>Esc</kbd> and then <kbd>Tab</kbd> to leave the editor.
- **Announcements.** Live regions announce results such as "2 of 5 matches", "Link inserted" and "Some HTML isn't supported and was removed or simplified" (shown when the source view had to clean up HTML).
- **Visual accessibility.** Focus is always visible. The editor supports Windows High Contrast (`forced-colors`), honors `prefers-reduced-motion`, and offers a dark theme.
- **Help for authors (ATAG part B).** Images prompt for alt text, tables get headers and a caption by default, and color pickers report contrast. An accessibility checker that locates problems, explains them and repairs them is in progress.

| Shortcut | Action |
| --- | --- |
| <kbd>Alt + F10</kbd> | Move focus to the toolbar |
| <kbd>Esc</kbd> | Return from the toolbar to the text |
| <kbd>Alt + 0</kbd> | Open the list of keyboard shortcuts |
| <kbd>Ctrl/⌘ + K</kbd> | Insert or edit a link |
| <kbd>Ctrl/⌘ + F</kbd> | Find & replace |
| <kbd>Ctrl/⌘ + B / I / U</kbd> | Bold / italic / underline |
| <kbd>Ctrl/⌘ + Shift + H</kbd> | Highlight |
| <kbd>Ctrl/⌘ + Alt + 1…6</kbd> / <kbd>0</kbd> | Heading 1 to 6 / paragraph |
| <kbd>Ctrl/⌘ + Shift + 7 / 8 / 9</kbd> | Numbered, bulleted or task list |

The help dialog (<kbd>Alt + 0</kbd>) lists every shortcut for the current platform.

## i18n and RTL

```js
import { createEditor, arabicLabels } from "open-wysiwyg-editor";

createEditor({ element, language: "ar" });           // built in: en, ar
createEditor({
  element,
  language: "fr",
  languages: [{ code: "fr", name: "Français", dir: "ltr", labels: { bold: "Gras" /* … */ } }],
});
```

Untranslated labels fall back to English, and plurals use `Intl.PluralRules`. The UI mirrors itself in RTL languages. In the content, every block that has text gets `dir="auto"`, so Arabic and English paragraphs each display correctly in the same document. The direction button sets a block's direction explicitly.

## Styling

| File | Use |
| --- | --- |
| `open-wysiwyg-editor/style.css` (`.min.css`) | The editor, its UI and its content styles |
| `open-wysiwyg-editor/content.css` (`.min.css`) | Only the content styles, for published pages: wrap saved HTML in `<div class="owe-content-root">` |

All rules are in `@layer owe`, so any of your own CSS outside a layer overrides them. To theme the editor, set the design tokens:

```css
.owe {
  --owe-accent: #0b57d0;
  --owe-font: "IBM Plex Sans Arabic", system-ui, sans-serif;
  --owe-radius: 10px;
}
```

## Extensions

Everything is built from extensions. You can write your own the same way:

```ts
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

createEditor({ element, extensions: [StarterKit, Timestamp] });
```

`defineExtension` also accepts `nodes`, `marks`, `globalAttributes`, `inputRules`, `plugins` (raw ProseMirror plugins), `onCreate` and `onDestroy`. Call `.configure(options)` on any extension to change its options.

## Package contents

| Import | Format | Use it for |
| --- | --- | --- |
| `open-wysiwyg-editor` | ESM + CJS + `.d.ts` | The engine, every extension and the accessible UI |
| `open-wysiwyg-editor/headless` | ESM + CJS + `.d.ts` | The engine and extensions without UI code |
| `open-wysiwyg-editor/style.css` (`.min.css`) | CSS | Editor, UI and content styles |
| `open-wysiwyg-editor/content.css` (`.min.css`) | CSS | Content styles only, for pages that display saved HTML |
| `dist/open-wysiwyg-editor.global.js` | IIFE | `<script>` tag; exposes `window.OpenWysiwygEditor` |

## Browser support

The editor targets current versions of Chrome, Edge, Firefox and Safari, on desktop and mobile. Every change is tested end to end in Chromium, Firefox and WebKit, under a strict CSP with Trusted Types and with axe-core accessibility checks.

## Links

- [Live demo](https://alhassan73.github.io/open-wysiwyg-editor/)
- [Changelog](https://github.com/alhassan73/open-wysiwyg-editor/blob/main/packages/editor/CHANGELOG.md)
- [Contributing](https://github.com/alhassan73/open-wysiwyg-editor/blob/main/CONTRIBUTING.md) · [Security policy](https://github.com/alhassan73/open-wysiwyg-editor/blob/main/SECURITY.md)

## License

[MIT](https://github.com/alhassan73/open-wysiwyg-editor/blob/main/LICENSE) © alhassan-ahmed
