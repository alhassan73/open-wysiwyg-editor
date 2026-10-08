<p align="center"><a href="https://alhassan73.github.io/open-wysiwyg-editor/"><img src="https://raw.githubusercontent.com/alhassan73/open-wysiwyg-editor/main/.github/assets/banner.png" alt="Open WYSIWYG Editor — accessible, RTL-first rich text editor for every framework" width="100%"></a></p>

# @open-wysiwyg-editor/nuxt

[![npm version](https://img.shields.io/npm/v/@open-wysiwyg-editor/nuxt)](https://www.npmjs.com/package/@open-wysiwyg-editor/nuxt)
[![license](https://img.shields.io/npm/l/@open-wysiwyg-editor/nuxt)](https://github.com/alhassan73/open-wysiwyg-editor/blob/main/LICENSE)

**[Live demo →](https://alhassan73.github.io/open-wysiwyg-editor/)** · [GitHub](https://github.com/alhassan73/open-wysiwyg-editor) · [npm](https://www.npmjs.com/package/@open-wysiwyg-editor/nuxt)

A Nuxt module for [open-wysiwyg-editor](https://github.com/alhassan73/open-wysiwyg-editor#readme): an accessible (WCAG 2.2 AA), RTL-first, CSP-safe rich text editor. It auto-imports `<RichTextEditor>` and adds the stylesheet. Works with Nuxt 3 and 4.

## Install

```bash
npm install @open-wysiwyg-editor/nuxt
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@open-wysiwyg-editor/nuxt"],
});
```

The component comes from [`@open-wysiwyg-editor/vue`](https://www.npmjs.com/package/@open-wysiwyg-editor/vue), which is installed with this module. Its props, events and options are documented there.

## Module options

Set them under `wysiwygEditor` in `nuxt.config.ts`. All are optional.

```ts
export default defineNuxtConfig({
  modules: ["@open-wysiwyg-editor/nuxt"],
  wysiwygEditor: {
    css: true,
    componentName: "RichTextEditor",
  },
});
```

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `css` | `boolean` | `true` | Add the editor stylesheet to every page. Set `false` to import it yourself. |
| `componentName` | `string` | `"RichTextEditor"` | Name of the auto-imported component. |

## Usage

```vue
<!-- pages/post.vue -->
<script setup lang="ts">
const html = useState("post-html", () => "<p>Start writing…</p>");

async function save() {
  await $fetch("/api/posts", { method: "POST", body: { html: html.value } });
}
</script>

<template>
  <form @submit.prevent="save">
    <RichTextEditor v-model="html" placeholder="Write something…" :options="{ language: 'ar' }" />
    <button type="submit">Save</button>
  </form>
</template>
```

No `<ClientOnly>` needed. The server renders an empty container and the editor starts in the browser.

For a plain form post, add `name="body"` to the component. A hidden input with the HTML is submitted with the form.

## Sanitize on the server

The editor cleans pasted and loaded HTML in the browser, but that is not a security boundary: a client can post anything to your API. Sanitize the HTML again on the server before you store it, with a library you trust (for example `sanitize-html`).

## Show saved HTML

Load the content stylesheet and wrap the stored HTML in `owe-content-root`, so it looks like it did in the editor:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  css: ["@open-wysiwyg-editor/vue/content.css"],
});
```

```vue
<div class="owe-content-root" v-html="post.html" />
```

Only do this with HTML you sanitized on the server.

## Links

- [Core docs and options](https://github.com/alhassan73/open-wysiwyg-editor#readme)
- [Vue component docs](https://www.npmjs.com/package/@open-wysiwyg-editor/vue)
- [Website and live demo](https://alhassan73.github.io/open-wysiwyg-editor/)
- [Issues](https://github.com/alhassan73/open-wysiwyg-editor/issues)

## License

MIT © alhassan-ahmed
