<p align="center"><a href="https://alhassan73.github.io/open-wysiwyg-editor/"><img src="https://raw.githubusercontent.com/alhassan73/open-wysiwyg-editor/main/.github/assets/banner.png" alt="Open WYSIWYG Editor — accessible, RTL-first rich text editor for every framework" width="100%"></a></p>

# @open-wysiwyg-editor/vue

[![npm version](https://img.shields.io/npm/v/@open-wysiwyg-editor/vue)](https://www.npmjs.com/package/@open-wysiwyg-editor/vue)
[![license](https://img.shields.io/npm/l/@open-wysiwyg-editor/vue)](https://github.com/alhassan73/open-wysiwyg-editor/blob/main/LICENSE)

**[Live demo →](https://alhassan73.github.io/open-wysiwyg-editor/)** · [GitHub](https://github.com/alhassan73/open-wysiwyg-editor) · [npm](https://www.npmjs.com/package/@open-wysiwyg-editor/vue)

A Vue 3 component for [open-wysiwyg-editor](https://github.com/alhassan73/open-wysiwyg-editor#readme): an accessible (WCAG 2.2 AA), RTL-first, CSP-safe rich text editor. `<RichTextEditor v-model="html" />` gives you the full editor with a toolbar, dialogs and a status bar. Needs Vue 3.3+.

## Install

```bash
npm install @open-wysiwyg-editor/vue
```

One install is enough. The package depends on the core editor and re-exports its whole API (`createEditor`, `StarterKit`, types…).

Using Nuxt? Use [`@open-wysiwyg-editor/nuxt`](https://www.npmjs.com/package/@open-wysiwyg-editor/nuxt) instead.

## Usage

```vue
<script setup lang="ts">
import { ref } from "vue";
import { RichTextEditor } from "@open-wysiwyg-editor/vue";
import "@open-wysiwyg-editor/vue/style.css";

const html = ref("<p>Hello <strong>world</strong></p>");
</script>

<template>
  <RichTextEditor v-model="html" placeholder="Write something…" />
</template>
```

`v-model` is HTML. Typing updates your ref without resetting the cursor. Assigning a new value to the ref loads it into the editor.

### Options

`options` takes everything `createEditor()` accepts, except `element`. See the [core docs](https://github.com/alhassan73/open-wysiwyg-editor#readme) for the full list.

```vue
<RichTextEditor v-model="html" :options="{ language: 'ar' }" />
```

Callbacks (`onUpdate`, `onFocus`…) and the runtime options (`editable`, `placeholder`, `aria*`, `dir`, `contentLang`) follow changes. Everything else is read once when the component mounts. To change those, remount the component with a new `:key`.

You can write the `options` object inline. The editor only calls `setOptions` when a runtime option really changed.

### Custom toolbar

```vue
<RichTextEditor
  v-model="html"
  :options="{ ui: { toolbar: ['bold', 'italic', '|', 'link', '|', 'undo', 'redo'] } }"
/>
```

### Forms

Set `name` and the HTML is kept in a hidden `<input>`, so a plain form post (or `FormData`) receives it.

```vue
<form method="post" action="/save">
  <RichTextEditor v-model="html" name="body" />
  <button type="submit">Save</button>
</form>
```

### Access the editor

Use `@ready` or a template ref. Both give you the core `Editor` (`getHTML()`, `getJSON()`, `commands`, `focus()`…).

```vue
<script setup lang="ts">
import { ref } from "vue";
import { RichTextEditor, type Editor } from "@open-wysiwyg-editor/vue";

const html = ref("");
const field = ref<{ editor: Editor | null } | null>(null);

function onReady(editor: Editor) {
  editor.focus();
}
function bold() {
  field.value?.editor?.commands.toggleBold();
}
</script>

<template>
  <button type="button" @click="bold">Bold</button>
  <RichTextEditor ref="field" v-model="html" @ready="onReady" />
</template>
```

### Headless

Set `options.ui` to `false` for the engine only, without toolbar or status bar. Build your own controls with the editor you get from `@ready`.

```vue
<RichTextEditor v-model="html" :options="{ ui: false }" @ready="(e) => (editor = e)" />
```

## API

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `modelValue` | `string` | none | The content as HTML (`v-model`). Falls back to `options.content` when not set. |
| `options` | `Omit<EditorOptions, "element">` | `{}` | Everything `createEditor()` accepts. |
| `editable` | `boolean` | `true` | Also off when `options.editable` is `false`. |
| `placeholder` | `string` | none | Overrides `options.placeholder`. |
| `name` | `string` | none | Form field name. Adds a hidden input with the HTML. |

### Events

| Event | Payload | When |
| --- | --- | --- |
| `update:modelValue` | `html: string` | Every content change. |
| `ready` | `editor: Editor` | The editor was created (in the browser, after mount). |

### Exposed (template ref)

| Name | Type | Notes |
| --- | --- | --- |
| `editor` | `Editor \| null` | `null` until mounted and after unmount. |

## Styling

Import the stylesheet once, in your app entry or in the component:

```ts
import "@open-wysiwyg-editor/vue/style.css"; // or style.min.css
```

To show saved HTML on a page without an editor, import `@open-wysiwyg-editor/vue/content.css` (or `content.min.css`) and wrap the HTML in `<div class="owe-content-root">`.

## Server-side rendering

The editor starts in `onMounted`, which never runs on the server. The component renders an empty container (and the hidden input when `name` is set), so it works in Nuxt and Vite SSR without `<ClientOnly>`.

## Links

- [Core docs and options](https://github.com/alhassan73/open-wysiwyg-editor#readme)
- [Website and live demo](https://alhassan73.github.io/open-wysiwyg-editor/)
- [Issues](https://github.com/alhassan73/open-wysiwyg-editor/issues)

## License

MIT © alhassan-ahmed
