<p align="center"><a href="https://alhassan73.github.io/open-wysiwyg-editor/"><img src="https://raw.githubusercontent.com/alhassan73/open-wysiwyg-editor/main/.github/assets/banner.png" alt="Open WYSIWYG Editor — accessible, RTL-first rich text editor for every framework" width="100%"></a></p>

# @open-wysiwyg-editor/astro

[![npm version](https://img.shields.io/npm/v/@open-wysiwyg-editor/astro)](https://www.npmjs.com/package/@open-wysiwyg-editor/astro)
[![license](https://img.shields.io/npm/l/@open-wysiwyg-editor/astro)](https://github.com/alhassan73/open-wysiwyg-editor/blob/main/LICENSE)

**[Live demo →](https://alhassan73.github.io/open-wysiwyg-editor/)** · [GitHub](https://github.com/alhassan73/open-wysiwyg-editor) · [npm](https://www.npmjs.com/package/@open-wysiwyg-editor/astro)

An Astro component for the [Open WYSIWYG Editor](https://github.com/alhassan73/open-wysiwyg-editor#readme): an accessible (WCAG 2.2 AA), RTL-first rich text editor that runs under a strict Content Security Policy. It renders an `<owe-editor>` form field, so it works with plain form posts and needs no UI framework or client island.

```astro
<RichTextEditor name="body" value="<p>Hello</p>" />
```

## Install

```bash
npm install @open-wysiwyg-editor/astro
```

Requires Astro 4 or newer.

## Usage

The component imports its own script and styles, so you don't add anything else.

```astro
---
import { RichTextEditor } from "@open-wysiwyg-editor/astro";
---

<form method="post" action="/api/save">
  <label for="body">Article</label>
  <RichTextEditor id="body" name="body" value="<p>Hello <strong>world</strong></p>" />
  <button>Save</button>
</form>
```

The editor is form-associated: the HTML is submitted under `name` with the surrounding `<form>`, and `form.reset()` restores the field.

### Props

| Prop | Type | Notes |
| --- | --- | --- |
| `name` | `string` | Form field name |
| `value` | `string` | Initial content as HTML |
| `placeholder` | `string` | |
| `label` | `string` | Accessible name. Or point a `<label for>` at the component's `id` |
| `readonly`, `disabled` | `boolean` | |
| `language` | `string` | UI language, for example `"ar"`. Defaults to `<html lang>` |
| `dir` | `"ltr"`, `"rtl"` or `"auto"` | Base direction of the content |
| `toolbar` | `string` | Toolbar items separated by spaces, for example `"bold italic \| link"`, or `"none"` |
| other | | Any HTML attribute (`id`, `class`, `data-*`…) is passed to the element |

`language` and `toolbar` are read when the editor is created. The rest follow later changes.

### Arabic and a custom toolbar

```astro
<RichTextEditor
  name="body"
  language="ar"
  dir="rtl"
  label="المحتوى"
  toolbar="bold italic underline | link bulletList orderedList"
/>
```

### Reading the value in a page script

The element fires `input` on every change and `change` when it loses focus after a change. `element.value` is the HTML, and `element.editor` is the editor instance once it has started.

```astro
<RichTextEditor id="body" name="body" />

<script>
  const field = document.querySelector<HTMLElement & { value: string }>("#body")!;
  field.addEventListener("input", () => console.log(field.value));
</script>
```

For the full editor API (`getHTML()`, `commands`, `on()`…), use `field.editor`. For extra `createEditor` options, set `field.options = { … }` before the element connects. See the [HTML forms](https://github.com/alhassan73/open-wysiwyg-editor#html-forms) and [options](https://github.com/alhassan73/open-wysiwyg-editor#options) sections of the core docs.

### Saving: form post and API route

`src/pages/api/save.ts` (needs an adapter, or a prerender-off route):

```ts
import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const body = String(form.get("body") ?? "");
  // Sanitize again on the server before you store or render it for other users.
  return Response.json({ length: body.length });
};
```

In an Astro page (server output), read the same field with `await Astro.request.formData()` when `Astro.request.method === "POST"`.

## Styling

The component already imports `open-wysiwyg-editor/style.css`, and Astro bundles it with your page. Theme it with CSS variables; see [Styling](https://github.com/alhassan73/open-wysiwyg-editor#styling) in the core docs. To show saved HTML elsewhere, import `open-wysiwyg-editor/content.css`.

## SSR and static builds

The server (or the static build) renders only the `<owe-editor>` element, with the initial HTML in its `value` attribute. Astro escapes that attribute, so content from users can't run before the editor sanitizes it. The editor starts in the browser, and the field works with a plain form post in both `static` and `server` output.

## Links

- [Core docs](https://github.com/alhassan73/open-wysiwyg-editor#readme)
- [Live demo](https://alhassan73.github.io/open-wysiwyg-editor/)
- [Changelog](https://github.com/alhassan73/open-wysiwyg-editor/blob/main/CHANGELOG.md)
- [Report an issue](https://github.com/alhassan73/open-wysiwyg-editor/issues)

## License

[MIT](https://github.com/alhassan73/open-wysiwyg-editor/blob/main/LICENSE) © alhassan-ahmed
