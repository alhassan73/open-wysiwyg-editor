<p align="center"><a href="https://alhassan73.github.io/open-wysiwyg-editor/"><img src="https://raw.githubusercontent.com/alhassan73/open-wysiwyg-editor/main/.github/assets/banner.png" alt="Open WYSIWYG Editor — accessible, RTL-first rich text editor for every framework" width="100%"></a></p>

# @open-wysiwyg-editor/react

[![npm version](https://img.shields.io/npm/v/@open-wysiwyg-editor/react)](https://www.npmjs.com/package/@open-wysiwyg-editor/react)
[![license](https://img.shields.io/npm/l/@open-wysiwyg-editor/react)](https://github.com/alhassan73/open-wysiwyg-editor/blob/main/LICENSE)

**[Live demo →](https://alhassan73.github.io/open-wysiwyg-editor/)** · [GitHub](https://github.com/alhassan73/open-wysiwyg-editor) · [npm](https://www.npmjs.com/package/@open-wysiwyg-editor/react)

React component for [open-wysiwyg-editor](https://github.com/alhassan73/open-wysiwyg-editor), an accessible (WCAG 2.2 AA), RTL-first, CSP-safe rich text editor. It gives you `<RichTextEditor>` (toolbar, dialogs, status bar) and a `useEditor()` hook for custom UIs. Works with React 18+, Vite, Remix and Gatsby. For Next.js use [`@open-wysiwyg-editor/next`](https://www.npmjs.com/package/@open-wysiwyg-editor/next).

## Install

```bash
npm install @open-wysiwyg-editor/react
```

One install is enough: this package re-exports the whole core API (`createEditor`, `StarterKit`, `getUI`, the types…), and ships the stylesheets.

## Usage

Import the styles once, in your entry file:

```tsx
import "@open-wysiwyg-editor/react/style.css";
```

### Basic

```tsx
import { RichTextEditor } from "@open-wysiwyg-editor/react";

export function Notes() {
  return <RichTextEditor defaultValue="<p>Hello</p>" onChange={(html) => console.log(html)} />;
}
```

### Controlled

```tsx
import { useState } from "react";
import { RichTextEditor } from "@open-wysiwyg-editor/react";

export function Article() {
  const [html, setHtml] = useState("<p>Hello</p>");
  return <RichTextEditor value={html} onChange={setHtml} />;
}
```

The editor loads `value` only when it differs from the HTML it last produced, so typing never resets the cursor.

### In a form

`name` keeps a hidden `<input>` in sync with the HTML, so the editor works in plain form posts and React 19 form actions:

```tsx
<form action={save}>
  <RichTextEditor name="body" defaultValue={post.body} />
  <button type="submit">Save</button>
</form>
```

### Custom toolbar

`ui` takes the toolbar layout (item names and `"|"` separators), custom items, status bar, theme and more:

```tsx
<RichTextEditor
  ui={{
    toolbar: ["bold", "italic", "link", "|", "bulletList", "orderedList", "|", "clear"],
    items: {
      clear: { label: "Clear", text: "Clear", run: (editor) => editor.clearContent() },
    },
    statusbar: false,
  }}
/>
```

### Headless with `useEditor`

Build your own UI. `ui: false` turns the built-in toolbar off:

```tsx
import { useEditor } from "@open-wysiwyg-editor/react";

export function Minimal() {
  const { ref, editor } = useEditor({ ui: false, content: "<p>Hello</p>" });
  return (
    <>
      <button onClick={() => editor?.chain().focus().toggleBold().run()}>Bold</button>
      <div ref={ref} />
    </>
  );
}
```

`editor` is `null` before mount and during server rendering.

### Arabic / RTL

```tsx
<RichTextEditor language="ar" dir="rtl" contentLang="ar" />
```

`language` sets the UI language (built in: `en`, `ar`). Without `dir`, each block follows its own text direction.

## Props

`<RichTextEditor>` accepts every [`createEditor` option](https://github.com/alhassan73/open-wysiwyg-editor#readme) except `element` and `content`, plus these:

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | none | Controlled HTML. |
| `defaultValue` | `string \| JSON` | none | Initial content (HTML or ProseMirror JSON) for an uncontrolled editor. |
| `onChange` | `(html: string, editor: Editor) => void` | none | Called with the new HTML on every change. |
| `name` | `string` | none | Form field name. Adds a hidden `<input>` that holds the HTML. |
| `className` | `string` | none | Class on the wrapper `<div>`. |
| `id` | `string` | none | `id` on the wrapper `<div>`. |
| `extensions` | `AnyExtension[]` | `[StarterKit]` | Feature set. Read at mount. |
| `ui` | `UIOptions \| false` | built-in UI | Toolbar, items, status bar, theme, shortcuts. `false` = headless. Read at mount. |
| `editable` | `boolean` | `true` | Allow editing. Updates live. |
| `autofocus` | `boolean \| "start" \| "end"` | `false` | Focus on mount. |
| `placeholder` | `string \| false` | none | Text shown when empty. Updates live. |
| `ariaLabel` | `string` | `"Rich text editor"` | Accessible name of the editing area. Updates live. |
| `ariaLabelledBy` | `string` | none | `id` of an element that labels the editor. Updates live. |
| `ariaDescribedBy` | `string` | none | `id` of an element that describes the editor. Updates live. |
| `language` | `string` | `<html lang>`, then first language | UI language code (`"en"`, `"ar"`). Read at mount. |
| `languages` | `EditorLanguage[]` | `en`, `ar` | Languages available to the UI. Read at mount. |
| `labels` | `Partial<Labels>` | none | Override UI strings. Read at mount. |
| `dir` | `"ltr" \| "rtl" \| "auto"` | auto per block | Base direction of the content. Updates live. |
| `contentLang` | `string` | none | `lang` of the editing area (spellcheck, screen readers). Updates live. |
| `urlPolicy` | `UrlPolicy` | http, https, mailto, tel; relative URLs allowed | Allowed link and image URLs. Read at mount. |
| `inputRules` | `boolean` | `true` | Markdown-style typing shortcuts (`# `, `* `, `**bold**`). Read at mount. |
| `onCreate` `onUpdate` `onSelectionUpdate` `onFocus` `onBlur` `onDestroy` `onContentError` | callbacks | none | Editor events. Always call the latest function. |

Options marked "Read at mount" are applied once. Give the component a new `key` to apply a change.

`useEditor(options)` takes the same options (with `content` instead of `value`) and returns `{ ref, editor }`.

## Styling

```tsx
import "@open-wysiwyg-editor/react/style.css"; // editor UI + content (or style.min.css)
```

To show saved HTML outside the editor, use `@open-wysiwyg-editor/react/content.css` (or `content.min.css`) and put the HTML in an element with the class `owe-content-root`.

## Server-side rendering

The component is SSR-safe. On the server it renders an empty container and the hidden input; the editor starts in the browser after hydration. `useEditor` returns `editor: null` until then. `createEditor` itself needs a DOM, so call it only in effects.

## Documentation

- Full documentation, extensions and API: [GitHub README](https://github.com/alhassan73/open-wysiwyg-editor#readme)
- Live demo and website: [alhassan73.github.io/open-wysiwyg-editor](https://alhassan73.github.io/open-wysiwyg-editor/)
- Issues: [GitHub issues](https://github.com/alhassan73/open-wysiwyg-editor/issues)

## License

MIT © alhassan-ahmed
