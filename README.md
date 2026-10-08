<p align="center"><a href="https://alhassan73.github.io/open-wysiwyg-editor/"><img src="https://raw.githubusercontent.com/alhassan73/open-wysiwyg-editor/main/.github/assets/banner.png" alt="Open WYSIWYG Editor — accessible, RTL-first rich text editor for every framework" width="100%"></a></p>

# Open WYSIWYG Editor

[![npm version](https://img.shields.io/npm/v/open-wysiwyg-editor)](https://www.npmjs.com/package/open-wysiwyg-editor)
[![bundle size](https://img.shields.io/bundlephobia/minzip/open-wysiwyg-editor)](https://bundlephobia.com/package/open-wysiwyg-editor)
[![license](https://img.shields.io/npm/l/open-wysiwyg-editor)](https://github.com/alhassan73/open-wysiwyg-editor/blob/main/LICENSE)

**[Live demo →](https://alhassan73.github.io/open-wysiwyg-editor/)** · [GitHub](https://github.com/alhassan73/open-wysiwyg-editor) · [npm](https://www.npmjs.com/package/open-wysiwyg-editor)

An accessible rich text editor that works on **any website**: plain HTML/JS, React, Next.js, Preact, Vue, Nuxt, Angular, Svelte, Solid, Astro, WordPress and more. It's RTL-first, it runs under a strict Content Security Policy, and it ships its own TypeScript types. MIT licensed, with no license key, no telemetry and no cloud service.

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
| **Everywhere** | `<owe-editor>` web component for plain HTML and forms · Packages for React, Next.js, Preact, Vue, Nuxt, Angular, Svelte, Solid and Astro |
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
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/open-wysiwyg-editor@1/dist/style.min.css" />
<script src="https://cdn.jsdelivr.net/npm/open-wysiwyg-editor@1/dist/open-wysiwyg-editor.global.js"></script>
```

### Pick your framework

The core package works everywhere. Each framework also has its own small package. It re-exports the whole core API, ships the stylesheets, and handles mounting, cleanup, server-side rendering and two-way binding for you. Install **one** of them (it brings the core with it):

| Framework | Package | Install |
| --- | --- | --- |
| Plain JS, HTML forms, CMSs, Lit, Alpine, htmx, Ember, Qwik | [`open-wysiwyg-editor`](https://www.npmjs.com/package/open-wysiwyg-editor) | `npm install open-wysiwyg-editor` |
| React, Remix, Gatsby, Vite | [`@open-wysiwyg-editor/react`](https://www.npmjs.com/package/@open-wysiwyg-editor/react) | `npm install @open-wysiwyg-editor/react` |
| Next.js | [`@open-wysiwyg-editor/next`](https://www.npmjs.com/package/@open-wysiwyg-editor/next) | `npm install @open-wysiwyg-editor/next` |
| Preact | [`@open-wysiwyg-editor/preact`](https://www.npmjs.com/package/@open-wysiwyg-editor/preact) | `npm install @open-wysiwyg-editor/preact` |
| Vue 3 | [`@open-wysiwyg-editor/vue`](https://www.npmjs.com/package/@open-wysiwyg-editor/vue) | `npm install @open-wysiwyg-editor/vue` |
| Nuxt | [`@open-wysiwyg-editor/nuxt`](https://www.npmjs.com/package/@open-wysiwyg-editor/nuxt) | `npm install @open-wysiwyg-editor/nuxt` |
| Angular | [`@open-wysiwyg-editor/angular`](https://www.npmjs.com/package/@open-wysiwyg-editor/angular) | `npm install @open-wysiwyg-editor/angular` |
| Svelte, SvelteKit | [`@open-wysiwyg-editor/svelte`](https://www.npmjs.com/package/@open-wysiwyg-editor/svelte) | `npm install @open-wysiwyg-editor/svelte` |
| Solid, SolidStart | [`@open-wysiwyg-editor/solid`](https://www.npmjs.com/package/@open-wysiwyg-editor/solid) | `npm install @open-wysiwyg-editor/solid` |
| Astro | [`@open-wysiwyg-editor/astro`](https://www.npmjs.com/package/@open-wysiwyg-editor/astro) | `npm install @open-wysiwyg-editor/astro` |

All packages share one version number and are released together.

## Usage

The core is one function, `createEditor(options)`. It mounts the editor inside the element you pass and returns an `editor` instance. The framework packages do the three steps below for you. If you use the core directly, follow them in every framework:

1. Load the stylesheet once: `import "open-wysiwyg-editor/style.css"` (or the `<link>` above).
2. Call `createEditor()` **in the browser**, after the element exists. It throws during server-side rendering.
3. Call `editor.destroy()` when the element goes away.

### Plain HTML / JavaScript (no framework, no bundler)

The CDN script defines the `<owe-editor>` tag, so one tag is enough:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/open-wysiwyg-editor@1/dist/style.min.css" />
<script src="https://cdn.jsdelivr.net/npm/open-wysiwyg-editor@1/dist/open-wysiwyg-editor.global.js"></script>

<owe-editor id="editor" placeholder="Write something…">
  <template><p>Hello <strong>world</strong></p></template>
</owe-editor>

<script>
  document.querySelector("#editor").addEventListener("input", (event) => {
    console.log(event.target.value); // '<p dir="auto">Hello <strong>world</strong></p>'
  });
</script>
```

Or call the function yourself:

```html
<div id="editor"><p>Hello <strong>world</strong></p></div>

<script>
  const editor = OpenWysiwygEditor.createEditor({
    element: "#editor", // a selector, or document.querySelector("#editor")
    placeholder: "Write something…",
  });
  // editor.getHTML() → '<p dir="auto">Hello <strong>world</strong></p>'
</script>
```

This also works in WordPress, Shopify, Webflow, PHP, Django and Rails templates.

### HTML forms

Use `<owe-editor name="…">`. It is a form-associated element, so the form submits the editor's HTML under that name, and `form.reset()` restores the starting content. A `<label for>` pointing at its `id` becomes the accessible name.

```html
<form method="post">
  <label for="body">Article</label>
  <owe-editor id="body" name="body">
    <template><p>Draft…</p></template>
  </owe-editor>
  <button>Save</button>
</form>
```

Or mount the editor on a `<textarea>`. The editor hides the textarea and keeps its value in sync, so the form submits the HTML. The textarea's `<label>` becomes the editor's accessible name.

```html
<form method="post">
  <label for="body">Article</label>
  <textarea id="body" name="body"><p>Draft…</p></textarea>
  <button>Save</button>
</form>
<script>
  OpenWysiwygEditor.createEditor({ element: "#body" });
</script>
```

### Any bundler (Vite, Webpack, Parcel…), JS or TS

```js
import { createEditor } from "open-wysiwyg-editor";
import "open-wysiwyg-editor/style.css";

const editor = createEditor({
  element: "#editor", // or an HTMLElement
  onUpdate: (editor) => console.log(editor.getHTML()),
});
```

To use the `<owe-editor>` tag with a bundler, import its entry once: `import "open-wysiwyg-editor/element";`.

### React (Vite, CRA, Remix, Gatsby)

```bash
npm install @open-wysiwyg-editor/react
```

```tsx
import { useState } from "react";
import { RichTextEditor } from "@open-wysiwyg-editor/react";
import "@open-wysiwyg-editor/react/style.css";

export function Article() {
  const [html, setHtml] = useState("<p>Hello</p>");
  return <RichTextEditor value={html} onChange={setHtml} placeholder="Write something…" />;
}
```

For a custom UI, `useEditor({ ui: false })` returns `{ ref, editor }`. [Full guide →](https://github.com/alhassan73/open-wysiwyg-editor/tree/main/packages/react#readme)

### Next.js

```bash
npm install @open-wysiwyg-editor/next
```

App Router: the package is already marked `"use client"`, so you can use it straight from a Server Component. Import the stylesheet once in the layout:

```tsx
// app/layout.tsx
import "@open-wysiwyg-editor/next/style.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

```tsx
// app/articles/new/page.tsx  (a Server Component)
import { RichTextEditor } from "@open-wysiwyg-editor/next";
import { saveArticle } from "./actions";

export default function Page() {
  return (
    <form action={saveArticle}>
      <RichTextEditor name="body" defaultValue="<p>Hello</p>" />
      <button>Save</button>
    </form>
  );
}
```

`name` keeps a hidden `<input>` in sync, so the Server Action receives the HTML in its `FormData`:

```ts
// app/articles/new/actions.ts
"use server";

export async function saveArticle(formData: FormData) {
  const html = String(formData.get("body")); // sanitize again here before you store it
}
```

Pages Router: use the same component in any page and import the stylesheet in `pages/_app.tsx`. [Full guide →](https://github.com/alhassan73/open-wysiwyg-editor/tree/main/packages/next#readme)

### Preact

```bash
npm install @open-wysiwyg-editor/preact
```

```tsx
import { useState } from "preact/hooks";
import { RichTextEditor } from "@open-wysiwyg-editor/preact";
import "@open-wysiwyg-editor/preact/style.css";

export function Article() {
  const [html, setHtml] = useState("<p>Hello</p>");
  return <RichTextEditor value={html} onChange={setHtml} class="article-editor" />;
}
```

Same API as the React package, with `class` instead of `className`. [Full guide →](https://github.com/alhassan73/open-wysiwyg-editor/tree/main/packages/preact#readme)

### Vue 3

```bash
npm install @open-wysiwyg-editor/vue
```

```vue
<script setup>
import { ref } from "vue";
import { RichTextEditor } from "@open-wysiwyg-editor/vue";
import "@open-wysiwyg-editor/vue/style.css";

const html = ref("<p>Hello</p>");
</script>

<template>
  <RichTextEditor v-model="html" placeholder="Write something…" />
</template>
```

Pass more `createEditor` options with `:options="{ … }"`. A template ref exposes `editor`. [Full guide →](https://github.com/alhassan73/open-wysiwyg-editor/tree/main/packages/vue#readme)

### Nuxt

```bash
npm install @open-wysiwyg-editor/nuxt
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@open-wysiwyg-editor/nuxt"],
  // optional: wysiwygEditor: { css: true, componentName: "RichTextEditor" },
});
```

The module adds the stylesheet and auto-imports the component, so it works in any page without an import:

```vue
<script setup>
const html = ref("<p>Hello</p>");
</script>

<template>
  <RichTextEditor v-model="html" />
</template>
```

[Full guide →](https://github.com/alhassan73/open-wysiwyg-editor/tree/main/packages/nuxt#readme)

### Angular

```bash
npm install @open-wysiwyg-editor/angular
```

Add the stylesheet to `angular.json`, in `"styles": ["node_modules/@open-wysiwyg-editor/angular/style.css"]`. Then use the standalone component. It works with `ngModel` and reactive forms:

```ts
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RichTextEditorComponent } from "@open-wysiwyg-editor/angular";

@Component({
  selector: "app-article",
  imports: [FormsModule, RichTextEditorComponent],
  template: `<owe-rich-text-editor [(ngModel)]="html" placeholder="Write something…" />`,
})
export class ArticleComponent {
  html = "<p>Hello</p>";
}
```

It starts in the browser only (safe with Angular SSR) and runs outside the zone. [Full guide →](https://github.com/alhassan73/open-wysiwyg-editor/tree/main/packages/angular#readme)

### Svelte / SvelteKit

```bash
npm install @open-wysiwyg-editor/svelte
```

```svelte
<script>
  import { richText } from "@open-wysiwyg-editor/svelte";
  import "@open-wysiwyg-editor/svelte/style.css";

  let html = "<p>Hello</p>";
</script>

<div use:richText={{ content: html, onUpdate: (e) => (html = e.getHTML()) }}></div>
```

Works with Svelte 3, 4 and 5. Actions never run on the server, so this is safe in SvelteKit. [Full guide →](https://github.com/alhassan73/open-wysiwyg-editor/tree/main/packages/svelte#readme)

### Solid / SolidStart

```bash
npm install @open-wysiwyg-editor/solid
```

```tsx
import { createSignal } from "solid-js";
import { richText } from "@open-wysiwyg-editor/solid";
import "@open-wysiwyg-editor/solid/style.css";

export function Article() {
  const [html, setHtml] = createSignal("<p>Hello</p>");
  false && richText; // keeps the import from being tree-shaken, so `use:richText` works
  return <div use:richText={{ content: html(), onUpdate: (e) => setHtml(e.getHTML()) }} />;
}
```

[Full guide →](https://github.com/alhassan73/open-wysiwyg-editor/tree/main/packages/solid#readme)

### Astro

```bash
npm install @open-wysiwyg-editor/astro
```

```astro
---
import { RichTextEditor } from "@open-wysiwyg-editor/astro";
---

<form method="post">
  <RichTextEditor name="body" value="<p>Hello</p>" placeholder="Write something…" />
  <button>Save</button>
</form>
```

The component renders `<owe-editor>` and loads the element and stylesheet in the browser, so it works with plain form posts and no UI framework. [Full guide →](https://github.com/alhassan73/open-wysiwyg-editor/tree/main/packages/astro#readme)

### Others (Lit, Alpine, htmx, Ember, Qwik, WordPress, PHP)

Anything that can write HTML can use the `<owe-editor>` tag from the core package: load the CDN script (or `import "open-wysiwyg-editor/element"`) and the stylesheet, then put the tag in your markup. It dispatches `input` and `change` events and takes part in forms, so htmx, Turbo and plain `<form>` posts work without glue code.

```html
<!-- Alpine -->
<owe-editor name="body" x-on:input="html = $event.target.value"></owe-editor>

<!-- htmx: the form field is sent like any other input -->
<form hx-post="/articles" hx-swap="outerHTML">
  <owe-editor name="body" value="&lt;p&gt;Hello&lt;/p&gt;"></owe-editor>
  <button>Save</button>
</form>
```

```ts
// Lit
import "open-wysiwyg-editor/element";
import "open-wysiwyg-editor/style.css";
// html`<owe-editor .value=${this.html} @input=${(e) => (this.html = e.target.value)}></owe-editor>`
```

In WordPress or any PHP template, add the CDN `<link>` and `<script>` in the page head or footer, and print the tag with an escaped `value` attribute (`esc_attr( $html )`).

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

## The `<owe-editor>` element

`<owe-editor>` is the full editor as an HTML tag. It is a form-associated custom element that renders in the light DOM, so `style.css` applies as usual (no Shadow DOM, CSP-safe). The CDN script defines it automatically. With a bundler, `import "open-wysiwyg-editor/element"` defines it.

| Attribute | Description |
| --- | --- |
| `name` | Form field name. The form submits the editor's HTML under it |
| `placeholder` | Placeholder text |
| `readonly` | Makes the content read-only |
| `disabled` | Disables the editor and leaves it out of the form |
| `dir` | Base direction of the content (`ltr`, `rtl`, `auto`) |
| `content-lang` | `lang` of the content (spellcheck and screen readers) |
| `label` | Accessible name. Or point a `<label for>` at the element's `id` |
| `value` | Initial content as HTML (read once, when the editor is created) |
| `language` | UI language, e.g. `ar` (read once). Defaults to `<html lang>` |
| `toolbar` | Toolbar items separated by spaces (`"bold italic \| link"`), or `none` (read once) |

`placeholder`, `readonly`, `disabled`, `dir`, `content-lang` and `label` follow later changes. `value`, `language` and `toolbar` are only read when the editor starts.

| Property | Description |
| --- | --- |
| `editor` | The live `Editor`, or `null` while the element isn't in the document |
| `value` | The content as HTML. Setting it loads new content |
| `options` | More `createEditor()` options (`extensions`, `ui`, `labels`, callbacks…). Set it **before** the element is added to the page. Attributes win over it |
| `form` | The surrounding `<form>`, or `null` |

| Event | When |
| --- | --- |
| `input` | On every change. `event.target.value` has the HTML |
| `change` | When the editor loses focus after a change |

**Initial content** comes from the `value` attribute, else from a `<template>` child, else from the element's own children. Use `value` or `<template>` when the content comes from users: neither can run anything before the editor sanitizes it. Content placed directly as children is parsed by the browser first.

```js
const el = document.querySelector("owe-editor");
el.options = { language: "ar", ui: { stickyToolbar: false } };
el.value = "<p>New content</p>";
el.editor?.commands.toggleBold();
```

In Angular, bind the element with `ngDefaultControl [(ngModel)]` (or use the [Angular package](https://github.com/alhassan73/open-wysiwyg-editor/tree/main/packages/angular#readme)).

## Options

```ts
createEditor({
  element,                 // container, CSS selector or <textarea>; omit to create it detached and append editor.root yourself
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

Each framework package ships the same files under its own name, for example `@open-wysiwyg-editor/vue/style.css` and `@open-wysiwyg-editor/vue/content.css`, because package managers like pnpm don't expose the core package to your app.

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

## Writing your own integration

The framework packages are thin wrappers around a few helpers that the core package exports, so you can wrap the editor for any other framework in the same way:

| Helper | What it does |
| --- | --- |
| `RUNTIME_OPTIONS` | The options an existing editor can change through `setOptions()`: `editable`, `placeholder`, `ariaLabel`, `ariaLabelledBy`, `ariaDescribedBy`, `dir`, `contentLang` |
| `pickRuntimeOptions(options)` | Returns only those options from an options object |
| `sameRuntimeOptions(a, b)` | `true` when two such objects hold the same values, so you can skip a `setOptions()` call |
| `forwardCallbacks(get)` | Returns `onCreate`, `onUpdate`, `onSelectionUpdate`, `onFocus`, `onBlur`, `onDestroy` and `onContentError` handlers that always call the latest options' versions, so changing a callback never recreates the editor |
| `syncContent(editor, content)` | Loads bound content into the editor, and skips HTML the editor itself just produced, so typing never resets the cursor |

```ts
import {
  createEditor, forwardCallbacks, pickRuntimeOptions, sameRuntimeOptions, syncContent,
  type Editor, type EditorOptions,
} from "open-wysiwyg-editor";

function mount(element: HTMLElement, initial: Omit<EditorOptions, "element">) {
  let options = initial;
  let runtime = pickRuntimeOptions(options);
  const editor: Editor = createEditor({ ...options, element, ...forwardCallbacks(() => options) });

  return {
    update(next: Omit<EditorOptions, "element">) {
      options = next; // callbacks pick this up through forwardCallbacks
      if (next.content !== undefined) syncContent(editor, next.content);
      const nextRuntime = pickRuntimeOptions(next);
      if (!sameRuntimeOptions(runtime, nextRuntime)) editor.setOptions((runtime = nextRuntime));
    },
    destroy: () => editor.destroy(),
  };
}
```

Remember the three rules from [Usage](#usage): load the stylesheet, start in the browser only, and destroy the editor when the element goes away. The [Svelte](https://github.com/alhassan73/open-wysiwyg-editor/blob/main/packages/svelte/src/index.ts) and [Solid](https://github.com/alhassan73/open-wysiwyg-editor/blob/main/packages/solid/src/index.ts) packages are small, complete examples.

## Package contents

| Package | Import | Format | Use it for |
| --- | --- | --- | --- |
| `open-wysiwyg-editor` | `open-wysiwyg-editor` | ESM + CJS + `.d.ts` | The engine, every extension and the accessible UI |
| | `open-wysiwyg-editor/headless` | ESM + CJS + `.d.ts` | The engine and extensions without UI code |
| | `open-wysiwyg-editor/element` | ESM + CJS + `.d.ts` | Defines the `<owe-editor>` element |
| | `open-wysiwyg-editor/style.css` (`.min.css`) | CSS | Editor, UI and content styles |
| | `open-wysiwyg-editor/content.css` (`.min.css`) | CSS | Content styles only, for pages that display saved HTML |
| | `dist/open-wysiwyg-editor.global.js` | IIFE | `<script>` tag; exposes `window.OpenWysiwygEditor` and defines `<owe-editor>` |
| `@open-wysiwyg-editor/react` | `@open-wysiwyg-editor/react` | ESM + CJS + `.d.ts` | `<RichTextEditor>` and `useEditor()` (React 18+) |
| `@open-wysiwyg-editor/next` | `@open-wysiwyg-editor/next` | ESM + CJS + `.d.ts` | The React package with `"use client"` for the App Router |
| `@open-wysiwyg-editor/preact` | `@open-wysiwyg-editor/preact` | ESM + CJS + `.d.ts` | `<RichTextEditor>` and `useEditor()` on `preact/hooks` |
| `@open-wysiwyg-editor/vue` | `@open-wysiwyg-editor/vue` | ESM + CJS + `.d.ts` | `<RichTextEditor v-model>` (Vue 3.3+) |
| `@open-wysiwyg-editor/nuxt` | `@open-wysiwyg-editor/nuxt` | Nuxt module | Auto-imported component and stylesheet |
| `@open-wysiwyg-editor/angular` | `@open-wysiwyg-editor/angular` | Angular package (ng-packagr) | Standalone component with forms support (Angular 21+) |
| `@open-wysiwyg-editor/svelte` | `@open-wysiwyg-editor/svelte` | ESM + CJS + `.d.ts` | `use:richText` action (Svelte 3, 4, 5) |
| `@open-wysiwyg-editor/solid` | `@open-wysiwyg-editor/solid` | ESM + CJS + `.d.ts` | `use:richText` directive (Solid 1.6+) |
| `@open-wysiwyg-editor/astro` | `@open-wysiwyg-editor/astro` | `.astro` component + `.d.ts` | `RichTextEditor.astro`, which renders `<owe-editor>` |

Every framework package re-exports the whole core API and ships `style.css`, `style.min.css`, `content.css` and `content.min.css`.

## Browser support

The editor targets current versions of Chrome, Edge, Firefox and Safari, on desktop and mobile. Every change is tested end to end in Chromium, Firefox and WebKit, under a strict CSP with Trusted Types and with axe-core accessibility checks.

## Development

```bash
npm install
npm run build      # builds every package
npm run check      # lint + build + typecheck + unit tests
npm run e2e        # end-to-end + axe tests in Chromium, Firefox and WebKit (Playwright)
npm run dev        # serve the demo site locally
```

Layout:

```
README.md CHANGELOG.md CONTRIBUTING.md SECURITY.md LICENSE
examples/        the documentation website + live demo (deployed to GitHub Pages)
test/e2e/        Playwright end-to-end + axe tests
scripts/         serve-e2e, size-check, license-check, copy-styles, publish, render-banner
packages/<name>/ core, react, next, preact, vue, nuxt, angular, svelte, solid, astro
```

Every push to `main` rebuilds `examples/` and deploys it as the [live demo](https://alhassan73.github.io/open-wysiwyg-editor/). This README is the npm page of the core package: it is copied to `packages/core/README.md` when that package is packed.

See [CONTRIBUTING.md](https://github.com/alhassan73/open-wysiwyg-editor/blob/main/CONTRIBUTING.md), [SECURITY.md](https://github.com/alhassan73/open-wysiwyg-editor/blob/main/SECURITY.md) and the [changelog](https://github.com/alhassan73/open-wysiwyg-editor/blob/main/CHANGELOG.md).

## License

[MIT](https://github.com/alhassan73/open-wysiwyg-editor/blob/main/LICENSE) © alhassan-ahmed
