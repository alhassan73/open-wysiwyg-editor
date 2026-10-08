<p align="center"><a href="https://alhassan73.github.io/open-wysiwyg-editor/"><img src="https://raw.githubusercontent.com/alhassan73/open-wysiwyg-editor/main/.github/assets/banner.png" alt="Open WYSIWYG Editor — accessible, RTL-first rich text editor for every framework" width="100%"></a></p>

# @open-wysiwyg-editor/next

[![npm version](https://img.shields.io/npm/v/@open-wysiwyg-editor/next)](https://www.npmjs.com/package/@open-wysiwyg-editor/next)
[![license](https://img.shields.io/npm/l/@open-wysiwyg-editor/next)](https://github.com/alhassan73/open-wysiwyg-editor/blob/main/LICENSE)

**[Live demo →](https://alhassan73.github.io/open-wysiwyg-editor/)** · [GitHub](https://github.com/alhassan73/open-wysiwyg-editor) · [npm](https://www.npmjs.com/package/@open-wysiwyg-editor/next)

Next.js rich text editor for [open-wysiwyg-editor](https://github.com/alhassan73/open-wysiwyg-editor), an accessible (WCAG 2.2 AA), RTL-first, CSP-safe editor. It is the [React package](https://www.npmjs.com/package/@open-wysiwyg-editor/react) built as a `"use client"` module, so you can render `<RichTextEditor>` straight from a Server Component, and a plain `<form action={serverAction}>` receives its HTML through `name`. It works with the App Router and the Pages Router (Next.js 13.4+, React 18+).

## Install

```bash
npm install @open-wysiwyg-editor/next
```

One install is enough: this package re-exports the whole React package and the core API (`createEditor`, `StarterKit`, `useEditor`, the types…), and ships the stylesheets.

## App Router

Import the styles once, in the root layout:

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

Then use the editor in any Server Component, with no `"use client"` in your file:

```tsx
// app/page.tsx (a Server Component)
import { RichTextEditor } from "@open-wysiwyg-editor/next";

export default function Page() {
  return <RichTextEditor defaultValue="<p>Hello</p>" placeholder="Write something…" />;
}
```

Callbacks such as `onChange` are functions, so a Server Component cannot pass them. Use a client component for those (next section), or use `name` with a Server Action.

### Controlled, in a client component

```tsx
// app/editor.tsx
"use client";

import { useState } from "react";
import { RichTextEditor } from "@open-wysiwyg-editor/next";

export function ArticleEditor({ initial }: { initial: string }) {
  const [html, setHtml] = useState(initial);
  return <RichTextEditor value={html} onChange={setHtml} />;
}
```

The editor loads `value` only when it differs from the HTML it last produced, so typing never resets the cursor.

### Server Actions

Give the editor a `name`. It keeps a hidden `<input>` in sync with the HTML, so the form posts it like any field:

```tsx
// app/write/page.tsx (a Server Component)
import { RichTextEditor } from "@open-wysiwyg-editor/next";
import { savePost } from "./actions";

export default function Write() {
  return (
    <form action={savePost}>
      <RichTextEditor name="body" placeholder="Write your post…" />
      <button type="submit">Save</button>
    </form>
  );
}
```

```ts
// app/write/actions.ts
"use server";

import sanitizeHtml from "sanitize-html"; // or isomorphic-dompurify

export async function savePost(formData: FormData) {
  const body = sanitizeHtml(String(formData.get("body") ?? ""));
  // await db.post.create({ data: { body } });
}
```

Always sanitize on the server. The editor sanitizes what it loads and produces, but anyone can post any string to your action.

### `useActionState`

```tsx
// app/write/form.tsx
"use client";

import { useActionState } from "react";
import { RichTextEditor } from "@open-wysiwyg-editor/next";
import { savePost } from "./actions";

export function PostForm() {
  const [state, action, pending] = useActionState(savePost, { ok: false, html: "" });
  return (
    <form action={action}>
      <RichTextEditor name="body" defaultValue={state.html} />
      <button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
      {state.ok && <p role="status">Saved.</p>}
    </form>
  );
}
```

```ts
// app/write/actions.ts
"use server";

import sanitizeHtml from "sanitize-html";

export async function savePost(_prev: { ok: boolean; html: string }, formData: FormData) {
  const html = sanitizeHtml(String(formData.get("body") ?? ""));
  // await db.post.create({ data: { body: html } });
  return { ok: true, html };
}
```

`defaultValue` is read when the editor mounts, so returning the saved HTML does not change what is already on screen. To start empty after saving, change the editor's `key`.

## Pages Router

```tsx
// pages/_app.tsx
import type { AppProps } from "next/app";
import "@open-wysiwyg-editor/next/style.css";

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
```

```tsx
// pages/write.tsx
import { useState } from "react";
import { RichTextEditor } from "@open-wysiwyg-editor/next";

export default function Write() {
  const [html, setHtml] = useState("<p>Hello</p>");
  return <RichTextEditor value={html} onChange={setHtml} name="body" />;
}
```

## Why no `dynamic(() => …, { ssr: false })`?

You do not need it. The component is SSR-safe: on the server it renders an empty container and the hidden input, and it creates the editor in an effect after hydration, so nothing touches `window` or `document` while rendering. `useEditor` returns `editor: null` until then.

## Displaying saved HTML

Use the content stylesheet and wrap the HTML in an element with the class `owe-content-root`:

```tsx
// app/post/page.tsx
import "@open-wysiwyg-editor/next/content.css";

export default async function Post() {
  const html = await getSanitizedPostHtml(); // your own function; sanitize on the server
  return <div className="owe-content-root" dangerouslySetInnerHTML={{ __html: html }} />;
}
```

`dangerouslySetInnerHTML` does not sanitize anything. Sanitize the HTML on the server, when you save it or before you render it.

## More usage

`@open-wysiwyg-editor/next` has the same API as the React package, so custom toolbars, headless mode and RTL work the same way.

Custom toolbar:

```tsx
<RichTextEditor
  ui={{ toolbar: ["bold", "italic", "link", "|", "bulletList", "orderedList"], statusbar: false }}
/>
```

Arabic / RTL:

```tsx
<RichTextEditor language="ar" dir="rtl" contentLang="ar" />
```

Headless, in a client component:

```tsx
"use client";
import { useEditor } from "@open-wysiwyg-editor/next";

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

## Props

`<RichTextEditor>` accepts every [`createEditor` option](https://github.com/alhassan73/open-wysiwyg-editor#readme) except `element` and `content`, plus these. Function props (`onChange`, `onCreate`…) need a client component.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | none | Controlled HTML. |
| `defaultValue` | `string \| JSON` | none | Initial content (HTML or ProseMirror JSON) for an uncontrolled editor. |
| `onChange` | `(html: string, editor: Editor) => void` | none | Called with the new HTML on every change. |
| `name` | `string` | none | Form field name. Adds a hidden `<input>` that holds the HTML, so `<form action={serverAction}>` receives it. |
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

## Styling

| File | Use |
| --- | --- |
| `@open-wysiwyg-editor/next/style.css` | Editor UI and content (also `style.min.css`). Import once in `app/layout.tsx` or `pages/_app.tsx`. |
| `@open-wysiwyg-editor/next/content.css` | Content only (also `content.min.css`), for pages that show saved HTML. |

## Documentation

- Full documentation, extensions and API: [GitHub README](https://github.com/alhassan73/open-wysiwyg-editor#readme)
- Live demo and website: [alhassan73.github.io/open-wysiwyg-editor](https://alhassan73.github.io/open-wysiwyg-editor/)
- Issues: [GitHub issues](https://github.com/alhassan73/open-wysiwyg-editor/issues)

## License

MIT © alhassan-ahmed
