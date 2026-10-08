<p align="center"><a href="https://alhassan73.github.io/open-wysiwyg-editor/"><img src="https://raw.githubusercontent.com/alhassan73/open-wysiwyg-editor/main/.github/assets/banner.png" alt="Open WYSIWYG Editor — accessible, RTL-first rich text editor for every framework" width="100%"></a></p>

# @open-wysiwyg-editor/solid

[![npm version](https://img.shields.io/npm/v/@open-wysiwyg-editor/solid)](https://www.npmjs.com/package/@open-wysiwyg-editor/solid)
[![license](https://img.shields.io/npm/l/@open-wysiwyg-editor/solid)](https://github.com/alhassan73/open-wysiwyg-editor/blob/main/LICENSE)

**[Live demo →](https://alhassan73.github.io/open-wysiwyg-editor/)** · [GitHub](https://github.com/alhassan73/open-wysiwyg-editor) · [npm](https://www.npmjs.com/package/@open-wysiwyg-editor/solid)

A SolidJS directive that turns any element into the [Open WYSIWYG Editor](https://github.com/alhassan73/open-wysiwyg-editor#readme): an accessible (WCAG 2.2 AA), RTL-first rich text editor that runs under a strict Content Security Policy. It works with Solid 1.6+ and SolidStart, and ships its own TypeScript types.

```tsx
<div use:richText={{ content: html(), onUpdate: (e) => setHtml(e.getHTML()) }} />
```

## Install

```bash
npm install @open-wysiwyg-editor/solid
```

This one package gives you the whole editor API (`StarterKit`, `getUI`, types…): it re-exports everything from [`open-wysiwyg-editor`](https://www.npmjs.com/package/open-wysiwyg-editor).

## Usage

```tsx
import { createSignal } from "solid-js";
import { richText } from "@open-wysiwyg-editor/solid";
import "@open-wysiwyg-editor/solid/style.css";

// Keep this line. TypeScript and Babel drop imports that look unused,
// and `use:richText` is only a reference to the function.
richText;

export default function App() {
  const [html, setHtml] = createSignal("<p>Hello <strong>world</strong></p>");

  return (
    <>
      <div
        use:richText={{
          content: html(),
          placeholder: "Write something…",
          onUpdate: (editor) => setHtml(editor.getHTML()),
        }}
      />
      <pre>{html()}</pre>
    </>
  );
}
```

The directive creates the editor when the element mounts and destroys it when its owner is disposed. The object you pass is read reactively, so signals used inside it (like `html()` above) are tracked.

In TypeScript, `use:richText` is typed for you: this package augments `JSX.Directives` in `solid-js`.

### Two-way binding

`content` goes in, `onUpdate` sends the HTML back.

- When the signal changes from outside (a reset button, a loaded record), the editor loads it.
- When it changed because the editor itself reported it, nothing is reloaded, so the cursor stays where it is.

### Options and language

Pass any [editor option](https://github.com/alhassan73/open-wysiwyg-editor#options) except `element`.

```tsx
<div
  use:richText={{
    content: html(),
    language: "ar",
    dir: "rtl",
    contentLang: "ar",
    ariaLabel: "Article body",
    onUpdate: (e) => setHtml(e.getHTML()),
  }}
/>
```

### Toolbar

```tsx
<div
  use:richText={{
    content: html(),
    ui: { toolbar: ["bold", "italic", "|", "link", "bulletList", "orderedList"] },
    onUpdate: (e) => setHtml(e.getHTML()),
  }}
/>
```

### Getting the editor

`onCreate` receives the editor instance.

```tsx
import type { Editor } from "@open-wysiwyg-editor/solid";

let editor: Editor | undefined;

<div use:richText={{ onCreate: (e) => (editor = e) }} />
<button type="button" onClick={() => editor?.chain().focus().toggleBold().run()}>Bold</button>
```

### Forms

The editor does not submit by itself. Keep the HTML in a hidden input so a normal form post (or a SolidStart action) receives it.

```tsx
<form method="post">
  <div use:richText={{ content: html(), onUpdate: (e) => setHtml(e.getHTML()) }} />
  <input type="hidden" name="body" value={html()} />
  <button>Save</button>
</form>
```

Always sanitize or escape the HTML again on the server before you render it for other users.

### Updates after mount

| Changes after mount | What happens |
| --- | --- |
| `content` | Loaded into the editor (unless it is the editor's own HTML) |
| `editable`, `placeholder`, `ariaLabel`, `ariaLabelledBy`, `ariaDescribedBy`, `dir`, `contentLang` | Applied live |
| Callbacks (`onUpdate`, `onFocus`…) | The latest one is always called |
| Everything else (`extensions`, `ui`, `language`…) | Read once when the editor is created. Re-render it inside a keyed `<Show>` to recreate it |

## Options

The directive takes the same options as `createEditor()` (without `element`). See the [full list](https://github.com/alhassan73/open-wysiwyg-editor#options) in the core docs. The editor API, commands and extensions are documented there too.

## Styling

```ts
import "@open-wysiwyg-editor/solid/style.css"; // editor UI + content (also style.min.css)
import "@open-wysiwyg-editor/solid/content.css"; // only the content styles, to show saved HTML (also content.min.css)
```

Theme it with CSS variables; see [Styling](https://github.com/alhassan73/open-wysiwyg-editor#styling) in the core docs.

## SSR and SolidStart

Directives only run in the browser. On the server the element is rendered empty, and the editor starts when the page hydrates, so there is nothing to guard with `isServer`. Import the CSS in `root.tsx` or `entry-client.tsx` to avoid a flash of unstyled content.

## Links

- [Core docs](https://github.com/alhassan73/open-wysiwyg-editor#readme)
- [Live demo](https://alhassan73.github.io/open-wysiwyg-editor/)
- [Changelog](https://github.com/alhassan73/open-wysiwyg-editor/blob/main/CHANGELOG.md)
- [Report an issue](https://github.com/alhassan73/open-wysiwyg-editor/issues)

## License

[MIT](https://github.com/alhassan73/open-wysiwyg-editor/blob/main/LICENSE) © alhassan-ahmed
