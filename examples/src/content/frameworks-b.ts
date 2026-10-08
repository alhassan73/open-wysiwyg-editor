import type { FrameworkDoc } from "./frameworks";
import { DOCS_C } from "./frameworks-c";

export const DOCS_B: Record<string, FrameworkDoc> = {
  vue: {
    slug: "vue",
    lead: "A `v-model` component for Vue 3.3 and newer. Server-side rendering safe.",
    requires: "Vue 3.3+",
    sections: [
      {
        id: "usage",
        title: "Minimal usage",
        text: ["`v-model` is HTML. Typing updates your ref without resetting the cursor. Assigning a new value to the ref loads it into the editor."],
        code: [
          {
            lang: "markup",
            label: "Article.vue",
            code: `<script setup lang="ts">
import { ref } from "vue";
import { RichTextEditor } from "@open-wysiwyg-editor/vue";
import "@open-wysiwyg-editor/vue/style.css";

const html = ref("<p>Hello <strong>world</strong></p>");
</script>

<template>
  <RichTextEditor v-model="html" placeholder="Write something…" />
</template>`,
          },
        ],
      },
      {
        id: "options",
        title: "Options",
        text: [
          "`options` takes everything `createEditor()` accepts, except `element`. Callbacks and the runtime options follow changes. Everything else is read once when the component mounts, so remount it with a new `:key` to change those.",
        ],
        code: [
          { lang: "markup", code: `<RichTextEditor v-model="html" :options="{ language: 'ar' }" />` },
          { lang: "markup", label: "Custom toolbar", code: `<RichTextEditor\n  v-model="html"\n  :options="{ ui: { toolbar: ['bold', 'italic', '|', 'link', '|', 'undo', 'redo'] } }"\n/>` },
        ],
      },
      {
        id: "forms",
        title: "Forms and saving",
        text: ["Set `name` and the HTML is kept in a hidden `<input>`, so a plain form post (or `FormData`) receives it."],
        code: [{ lang: "markup", code: `<form method="post" action="/save">\n  <RichTextEditor v-model="html" name="body" />\n  <button type="submit">Save</button>\n</form>` }],
        callout: { tone: "security", title: "Sanitize on the server", text: "Treat posted HTML as untrusted input." },
      },
      {
        id: "editor",
        title: "Access the editor",
        text: ["Use `@ready` or a template ref. Both give you the core `Editor`."],
        code: [
          {
            lang: "markup",
            code: `<script setup lang="ts">
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
</template>`,
          },
        ],
      },
      {
        id: "headless",
        title: "Headless",
        text: ["Set `options.ui` to `false` for the engine only, then build your own controls with the editor from `@ready`."],
        code: [{ lang: "markup", code: `<RichTextEditor v-model="html" :options="{ ui: false }" @ready="(e) => (editor = e)" />` }],
      },
      {
        id: "props",
        title: "Props",
        props: {
          title: "Props",
          kind: "props",
          rows: [
            { name: "modelValue", type: "string", def: "none", desc: "The content as HTML (v-model). Falls back to options.content when not set." },
            { name: "options", type: 'Omit<EditorOptions, "element">', def: "{}", desc: "Everything createEditor() accepts." },
            { name: "editable", type: "boolean", def: "true", desc: "Also off when options.editable is false." },
            { name: "placeholder", type: "string", def: "none", desc: "Overrides options.placeholder." },
            { name: "name", type: "string", def: "none", desc: "Form field name. Adds a hidden input with the HTML." },
          ],
        },
      },
      {
        id: "events",
        title: "Events",
        props: {
          title: "Events",
          kind: "events",
          rows: [
            { name: "update:modelValue", type: "html: string", desc: "Every content change." },
            { name: "ready", type: "editor: Editor", desc: "The editor was created (in the browser, after mount)." },
          ],
        },
      },
      {
        id: "exposed",
        title: "Exposed through a template ref",
        props: { title: "Members", kind: "members", rows: [{ name: "editor", type: "Editor | null", desc: "null until mounted and after unmount." }] },
      },
    ],
    ssr: ["The editor starts in `onMounted`, which never runs on the server. The component renders an empty container (and the hidden input when `name` is set), so it works in Nuxt and Vite SSR without `<ClientOnly>`."],
    styling: {
      text: ["Import the stylesheet once, in your app entry or in the component. To show saved HTML, import `content.css` and wrap the HTML in `<div class=\"owe-content-root\">`."],
      code: [{ lang: "ts", code: `import "@open-wysiwyg-editor/vue/style.css"; // or style.min.css` }],
    },
  },

  nuxt: {
    slug: "nuxt",
    lead: "A Nuxt module. It auto-imports `<RichTextEditor>` and adds the stylesheet. The component itself comes from the Vue package.",
    requires: "Nuxt 3+",
    sections: [
      {
        id: "setup",
        title: "Setup",
        code: [{ lang: "ts", label: "nuxt.config.ts", code: `export default defineNuxtConfig({\n  modules: ["@open-wysiwyg-editor/nuxt"],\n});` }],
      },
      {
        id: "usage",
        title: "Usage",
        text: ["No import and no `<ClientOnly>`. The server renders an empty container and the editor starts in the browser. For a plain form post, add `name=\"body\"` to the component."],
        code: [
          {
            lang: "markup",
            label: "pages/post.vue",
            code: `<script setup lang="ts">
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
</template>`,
          },
        ],
      },
      {
        id: "module-options",
        title: "Module options",
        text: ["Set them under `wysiwygEditor` in `nuxt.config.ts`. All are optional."],
        code: [{ lang: "ts", code: `export default defineNuxtConfig({\n  modules: ["@open-wysiwyg-editor/nuxt"],\n  wysiwygEditor: {\n    css: true,\n    componentName: "RichTextEditor",\n  },\n});` }],
        props: {
          title: "Module options",
          kind: "options",
          rows: [
            { name: "css", type: "boolean", def: "true", desc: "Add the editor stylesheet to every page. Set false to import it yourself." },
            { name: "componentName", type: "string", def: '"RichTextEditor"', desc: "Name of the auto-imported component." },
          ],
        },
      },
      {
        id: "sanitize",
        title: "Sanitize on the server",
        callout: { tone: "security", title: "The browser is not a security boundary", text: "A client can post anything to your API. Sanitize the HTML again on the server before you store it, with a library you trust (for example sanitize-html)." },
      },
      {
        id: "display",
        title: "Show saved HTML",
        text: ["Load the content stylesheet and wrap the stored HTML in `owe-content-root`. Only do this with HTML you sanitized on the server."],
        code: [
          { lang: "ts", label: "nuxt.config.ts", code: `export default defineNuxtConfig({\n  css: ["@open-wysiwyg-editor/vue/content.css"],\n});` },
          { lang: "markup", code: `<div class="owe-content-root" v-html="post.html" />` },
        ],
      },
    ],
    ssr: ["Nothing to configure. The Vue component renders an empty container on the server and starts the editor after mount. Props, events and options are documented on the Vue page."],
    styling: { text: ["The module adds the stylesheet for you. Set `css: false` to import it yourself."] },
  },

  angular: {
    slug: "angular",
    lead: "A standalone component with `ngModel` and reactive forms support. It starts in the browser only and runs outside the zone.",
    requires: "Angular 21+",
    sections: [
      {
        id: "setup",
        title: "Setup",
        text: ["Add the stylesheet to `angular.json`, or import it in your global `styles.css`."],
        code: [
          { lang: "json", label: "angular.json", code: `"styles": [\n  "node_modules/@open-wysiwyg-editor/angular/style.css",\n  "src/styles.css"\n]` },
          { lang: "css", label: "styles.css", code: `@import "@open-wysiwyg-editor/angular/style.css";` },
        ],
      },
      {
        id: "ngmodel",
        title: "Standalone component with ngModel",
        code: [
          {
            lang: "ts",
            code: `import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RichTextEditorComponent } from "@open-wysiwyg-editor/angular";

@Component({
  selector: "app-post",
  imports: [FormsModule, RichTextEditorComponent],
  template: \`
    <owe-rich-text-editor [(ngModel)]="html" placeholder="Write something…" />
    <pre>{{ html }}</pre>
  \`,
})
export class PostComponent {
  html = "<p>Hello <strong>world</strong></p>";
}`,
          },
        ],
      },
      {
        id: "reactive",
        title: "Reactive forms",
        text: ["The control is marked touched when the editor loses focus. `form.controls.body.disable()` makes the editor read-only."],
        code: [
          {
            lang: "ts",
            code: `import { Component, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { RichTextEditorComponent } from "@open-wysiwyg-editor/angular";

@Component({
  selector: "app-compose",
  imports: [ReactiveFormsModule, RichTextEditorComponent],
  template: \`
    <form [formGroup]="form" (ngSubmit)="save()">
      <owe-rich-text-editor formControlName="body" />
      @if (form.controls.body.touched && form.controls.body.errors) {
        <p role="alert">Write something first.</p>
      }
      <button>Save</button>
    </form>
  \`,
})
export class ComposeComponent {
  form = inject(FormBuilder).nonNullable.group({
    body: ["", [Validators.required, Validators.minLength(10)]],
  });

  save() {
    console.log(this.form.getRawValue().body);
  }
}`,
          },
        ],
        callout: { tone: "security", title: "Sanitize on the server", text: "Validate and sanitize the HTML again in your API before you store it." },
      },
      {
        id: "value",
        title: "Two-way value and signals",
        text: ["Without forms, bind `[(value)]`. It works with a `signal()` or `model()` too."],
        code: [
          { lang: "markup", code: `<owe-rich-text-editor [(value)]="html" />` },
          {
            lang: "ts",
            code: `@Component({
  selector: "app-note",
  imports: [RichTextEditorComponent],
  template: \`
    <owe-rich-text-editor [(value)]="html" />
    <p>{{ html().length }} characters of HTML</p>
  \`,
})
export class NoteComponent {
  html = signal("<p>Start here</p>");
}`,
          },
        ],
      },
      {
        id: "options",
        title: "Options and the editor instance",
        text: ["`[options]` takes anything `createEditor()` accepts, except `element`. It is read once, when the editor starts. `placeholder` and `readonly` follow changes. Use `(ready)` to get the editor."],
        code: [
          { lang: "markup", code: `<owe-rich-text-editor\n  [(ngModel)]="html"\n  [options]="{ language: 'ar', dir: 'rtl', autofocus: true }"\n  placeholder="اكتب هنا…"\n  (ready)="onReady($event)"\n/>` },
          { lang: "ts", code: `import type { Editor } from "@open-wysiwyg-editor/angular";\n\nonReady(editor: Editor) {\n  editor.focus();\n  console.log(editor.getJSON());\n}` },
        ],
      },
      {
        id: "api",
        title: "Inputs",
        props: {
          title: "Inputs",
          kind: "inputs",
          rows: [
            { name: "value", type: "string", def: "undefined", desc: "HTML content. Two-way with [(value)]." },
            { name: "options", type: "RichTextEditorOptions", def: "{}", desc: "createEditor() options without element. Read once at start." },
            { name: "placeholder", type: "string", def: "undefined", desc: "Overrides options.placeholder. Updates live." },
            { name: "readonly", type: "boolean", def: "false", desc: "Disables editing. Updates live." },
          ],
        },
      },
      {
        id: "outputs",
        title: "Outputs",
        props: {
          title: "Outputs",
          kind: "outputs",
          rows: [
            { name: "valueChange", type: "string", desc: "The HTML after every change." },
            { name: "ready", type: "Editor", desc: "Emitted once, in the browser, after the editor starts." },
          ],
        },
      },
      {
        id: "wc",
        title: "Alternative: the web component",
        text: ["Prefer no Angular wrapper? Angular binds the core `<owe-editor>` element with `ngDefaultControl`."],
        code: [
          { lang: "ts", label: "main.ts", code: `import "open-wysiwyg-editor/element";` },
          {
            lang: "ts",
            code: `import { CUSTOM_ELEMENTS_SCHEMA, Component } from "@angular/core";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-post",
  imports: [FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: \`<owe-editor ngDefaultControl [(ngModel)]="html" language="ar"></owe-editor>\`,
})
export class PostComponent {
  html = "";
}`,
          },
        ],
      },
    ],
    ssr: ["Nothing to configure. The editor starts in `afterNextRender`, so it never runs on the server, and it works with Angular SSR and hydration. Its DOM listeners run outside the Angular zone, so typing does not trigger change detection except when the value changes."],
    styling: {
      text: ["`style.css` styles the toolbar and the editor. If you render saved HTML outside the editor, add `content.css` to that page. Minified `style.min.css` and `content.min.css` are included."],
    },
  },

  svelte: {
    slug: "svelte",
    lead: "A `use:richText` action for Svelte 3, 4 and 5. Actions never run on the server, so it is safe in SvelteKit.",
    requires: "Svelte 3, 4 or 5",
    sections: [
      {
        id: "svelte5",
        title: "Svelte 5",
        code: [
          {
            lang: "markup",
            code: `<script lang="ts">
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

<pre>{html}</pre>`,
          },
        ],
      },
      {
        id: "svelte4",
        title: "Svelte 3 and 4",
        code: [
          {
            lang: "markup",
            code: `<script lang="ts">
  import { richText } from "@open-wysiwyg-editor/svelte";
  import "@open-wysiwyg-editor/svelte/style.css";

  let html = "<p>Hello <strong>world</strong></p>";
</script>

<div use:richText={{ content: html, onUpdate: (editor) => (html = editor.getHTML()) }} />

<pre>{html}</pre>`,
          },
        ],
      },
      {
        id: "binding",
        title: "Two-way binding",
        text: [
          "`content` goes in, `onUpdate` sends the HTML back. When `html` changes from outside (a reset button, a loaded record), the editor loads it. When it changed because the editor reported it, nothing is reloaded, so the cursor stays where it is.",
        ],
      },
      {
        id: "options",
        title: "Options, language and toolbar",
        text: ["Pass any editor option except `element`. The node the action is on is the element."],
        code: [
          { lang: "markup", code: `<div\n  use:richText={{\n    content: html,\n    language: "ar",\n    dir: "rtl",\n    contentLang: "ar",\n    ariaLabel: "Article body",\n    ui: { toolbar: ["bold", "italic", "|", "link", "bulletList", "orderedList"] },\n    onUpdate: (e) => (html = e.getHTML()),\n  }}\n></div>` },
        ],
      },
      {
        id: "editor",
        title: "Getting the editor",
        text: ["`onCreate` receives the editor instance. In Svelte 5 use `onclick` instead of `on:click`."],
        code: [
          { lang: "markup", code: `<script lang="ts">\n  import { richText, type Editor } from "@open-wysiwyg-editor/svelte";\n\n  let editor: Editor | undefined;\n</script>\n\n<div use:richText={{ onCreate: (e) => (editor = e) }}></div>\n<button type="button" on:click={() => editor?.chain().focus().toggleBold().run()}>Bold</button>` },
        ],
      },
      {
        id: "forms",
        title: "Forms and saving",
        text: ["The editor does not submit by itself. Keep the HTML in a hidden input so a normal form post (or a SvelteKit form action) receives it. In `+page.server.ts`, read it with `(await request.formData()).get(\"body\")`."],
        code: [{ lang: "markup", code: `<form method="POST">\n  <div use:richText={{ content: html, onUpdate: (e) => (html = e.getHTML()) }}></div>\n  <input type="hidden" name="body" value={html} />\n  <button>Save</button>\n</form>` }],
        callout: { tone: "security", title: "Sanitize on the server", text: "Always sanitize or escape the HTML again on the server before you render it for other users." },
      },
      {
        id: "updates",
        title: "Updates after mount",
        props: {
          title: "What happens when options change",
          kind: "options",
          rows: [
            { name: "content", type: "string", desc: "Loaded into the editor (unless it is the editor's own HTML)." },
            { name: "editable, placeholder, ariaLabel, ariaLabelledBy, ariaDescribedBy, dir, contentLang", type: "runtime", desc: "Applied live." },
            { name: "onUpdate, onFocus…", type: "callbacks", desc: "The latest one is always called." },
            { name: "extensions, ui, language…", type: "everything else", desc: "Read once when the editor is created. Wrap the element in {#key …} to recreate it." },
          ],
        },
      },
    ],
    ssr: ["Actions only run in the browser. On the server the element is rendered empty, and the editor starts after hydration, so there is nothing to guard with `browser` checks. Import the CSS in `+layout.svelte` to avoid a flash of unstyled content."],
    styling: { text: ["Import `style.css` for the editor and `content.css` for pages that only show saved HTML."], code: [{ lang: "ts", code: `import "@open-wysiwyg-editor/svelte/style.css";\nimport "@open-wysiwyg-editor/svelte/content.css";` }] },
  },

  ...DOCS_C,
};
