<p align="center"><a href="https://alhassan73.github.io/open-wysiwyg-editor/"><img src="https://raw.githubusercontent.com/alhassan73/open-wysiwyg-editor/main/.github/assets/banner.png" alt="Open WYSIWYG Editor — accessible, RTL-first rich text editor for every framework" width="100%"></a></p>

# @open-wysiwyg-editor/svelte

[![npm version](https://img.shields.io/npm/v/@open-wysiwyg-editor/svelte)](https://www.npmjs.com/package/@open-wysiwyg-editor/svelte)
[![license](https://img.shields.io/npm/l/@open-wysiwyg-editor/svelte)](https://github.com/alhassan73/open-wysiwyg-editor/blob/main/LICENSE)

**[Live demo →](https://alhassan73.github.io/open-wysiwyg-editor/)** · [GitHub](https://github.com/alhassan73/open-wysiwyg-editor) · [npm](https://www.npmjs.com/package/@open-wysiwyg-editor/svelte)

A Svelte action that turns any element into the [Open WYSIWYG Editor](https://github.com/alhassan73/open-wysiwyg-editor#readme): an accessible (WCAG 2.2 AA), RTL-first rich text editor that runs under a strict Content Security Policy. It works with Svelte 3, 4 and 5 and with SvelteKit, and has no dependency on Svelte itself.

```svelte
<div use:richText={{ content: html, onUpdate: (e) => (html = e.getHTML()) }}></div>
```

## Install

```bash
npm install @open-wysiwyg-editor/svelte
```

This one package gives you the whole editor API (`StarterKit`, `getUI`, types…): it re-exports everything from [`open-wysiwyg-editor`](https://www.npmjs.com/package/open-wysiwyg-editor).

## Usage

Import the styles once (in your root layout, or in the component), then use the action.

### Svelte 5

```svelte
<script lang="ts">
  import { richText } from "@open-wysiwyg-editor/svelte";
  import "@open-wysiwyg-editor/svelte/style.css";

  let html = $state("<p>Hello <strong>world</strong></p>");
</script>

<div
  use:richText={{
    content: html,
    placeholder: "Write something…",
    onUpdate: (editor) => (html = editor.getHTML()),
  }}
></div>

<pre>{html}</pre>
```

### Svelte 3 and 4

```svelte
<script lang="ts">
  import { richText } from "@open-wysiwyg-editor/svelte";
  import "@open-wysiwyg-editor/svelte/style.css";

  let html = "<p>Hello <strong>world</strong></p>";
</script>

<div use:richText={{ content: html, onUpdate: (editor) => (html = editor.getHTML()) }} />

<pre>{html}</pre>
```

### Two-way binding

The pattern above is the two-way binding: `content` goes in, `onUpdate` sends the HTML back.

- When `html` changes from outside (a reset button, a loaded record), the editor loads it.
- When `html` changed because the editor itself reported it, nothing is reloaded, so the cursor stays where it is.

### Options and language

Pass any [editor option](https://github.com/alhassan73/open-wysiwyg-editor#options) except `element` (the node the action is on is the element).

```svelte
<div
  use:richText={{
    content: html,
    language: "ar",
    dir: "rtl",
    contentLang: "ar",
    ariaLabel: "Article body",
    onUpdate: (e) => (html = e.getHTML()),
  }}
></div>
```

### Toolbar

```svelte
<div
  use:richText={{
    content: html,
    ui: { toolbar: ["bold", "italic", "|", "link", "bulletList", "orderedList"] },
    onUpdate: (e) => (html = e.getHTML()),
  }}
></div>
```

### Getting the editor

`onCreate` receives the editor instance.

```svelte
<script lang="ts">
  import { richText, type Editor } from "@open-wysiwyg-editor/svelte";

  let editor: Editor | undefined;
</script>

<div use:richText={{ onCreate: (e) => (editor = e) }}></div>
<button type="button" on:click={() => editor?.chain().focus().toggleBold().run()}>Bold</button>
```

(In Svelte 5 use `onclick` instead of `on:click`.)

### Forms

The editor does not submit by itself. Keep the HTML in a hidden input so a normal form post (or a SvelteKit form action) receives it.

```svelte
<form method="POST">
  <div use:richText={{ content: html, onUpdate: (e) => (html = e.getHTML()) }}></div>
  <input type="hidden" name="body" value={html} />
  <button>Save</button>
</form>
```

In `+page.server.ts`, read it with `(await request.formData()).get("body")`. Always sanitize or escape the HTML again on the server before you render it for other users.

### Updates after mount

| Changes after mount | What happens |
| --- | --- |
| `content` | Loaded into the editor (unless it is the editor's own HTML) |
| `editable`, `placeholder`, `ariaLabel`, `ariaLabelledBy`, `ariaDescribedBy`, `dir`, `contentLang` | Applied live |
| Callbacks (`onUpdate`, `onFocus`…) | The latest one is always called |
| Everything else (`extensions`, `ui`, `language`…) | Read once when the editor is created. Wrap the element in `{#key …}` to recreate it |

## Options

The action takes the same options as `createEditor()` (without `element`). See the [full list](https://github.com/alhassan73/open-wysiwyg-editor#options) in the core docs. Editor API, commands and extensions are documented there too.

## Styling

```ts
import "@open-wysiwyg-editor/svelte/style.css"; // editor UI + content (also style.min.css)
import "@open-wysiwyg-editor/svelte/content.css"; // only the content styles, to show saved HTML (also content.min.css)
```

Theme it with CSS variables; see [Styling](https://github.com/alhassan73/open-wysiwyg-editor#styling) in the core docs.

## SSR and SvelteKit

Actions only run in the browser. On the server the element is rendered empty, and the editor starts after hydration, so there is nothing to guard with `browser` checks. Import the CSS in `+layout.svelte` to avoid a flash of unstyled content.

## Links

- [Core docs](https://github.com/alhassan73/open-wysiwyg-editor#readme)
- [Live demo](https://alhassan73.github.io/open-wysiwyg-editor/)
- [Changelog](https://github.com/alhassan73/open-wysiwyg-editor/blob/main/CHANGELOG.md)
- [Report an issue](https://github.com/alhassan73/open-wysiwyg-editor/issues)

## License

[MIT](https://github.com/alhassan73/open-wysiwyg-editor/blob/main/LICENSE) © alhassan-ahmed
