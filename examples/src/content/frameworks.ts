// Framework data for the "Frameworks" section. Code stays English. The name, blurb, notes and most tab labels are translated and live in the messages,
// as `Frameworks.items.<slug>`.
// Every snippet was ported from the package READMEs and checked against packages/*/src.
import type { Framework } from "@/types";

// CDN snippets pin an exact published version with Subresource Integrity, so a later release (or a
// compromised CDN) can't change what runs on a page. The hashes are sha384 of the files in the npm
// tarball for CDN_VERSION, which jsDelivr serves unchanged. Update all three on each release.
const CDN_VERSION = "1.0.2";
const CDN_BASE = `https://cdn.jsdelivr.net/npm/open-wysiwyg-editor@${CDN_VERSION}/dist`;
export const CDN_CSS_TAG = `<link rel="stylesheet" href="${CDN_BASE}/style.min.css"
  integrity="sha384-M7pJYu9d/6az43r7DEu11V2wYVSim/wfYwQjrNdn2lOz7ZEiPSh4lW4jwhjKC4RP" crossorigin="anonymous" />`;
export const CDN_JS_TAG = `<script src="${CDN_BASE}/open-wysiwyg-editor.global.js"
  integrity="sha384-nj2QvSEBeAy8VfG/L3M7Hq+IbVQVrj5RyDnuO0Hy3p7EJrIaMo2Dku4YJoqUiK89" crossorigin="anonymous"></script>`;
export const CDN_TAGS = `${CDN_CSS_TAG}
${CDN_JS_TAG}`;

export const FRAMEWORKS: Framework[] = [
  {
    slug: "react",
    name: "React",
    pkg: "@open-wysiwyg-editor/react",
    install: "npm install @open-wysiwyg-editor/react",
    requires: "React 18+",
    snippets: [
      {
        id: "basicUsage",
        lang: "tsx",
        code: `import { useState } from "react";
import { RichTextEditor } from "@open-wysiwyg-editor/react";
import "@open-wysiwyg-editor/react/style.css";

export function Article() {
  const [html, setHtml] = useState("<p>Hello <strong>world</strong></p>");
  return <RichTextEditor value={html} onChange={setHtml} placeholder="Write something…" />;
}`,
      },
      {
        id: "forms",
        lang: "tsx",
        code: `<form action={save}>
  <RichTextEditor name="body" defaultValue={post.body} />
  <button type="submit">Save</button>
</form>`,
      },
      {
        id: "customToolbar",
        lang: "tsx",
        code: `<RichTextEditor
  ui={{
    toolbar: ["bold", "italic", "link", "|", "bulletList", "orderedList", "|", "clear"],
    items: {
      clear: { label: "Clear", text: "Clear", run: (editor) => editor.clearContent() },
    },
    statusbar: false,
  }}
/>`,
      },
      {
        id: "headless",
        lang: "tsx",
        code: `import { useEditor } from "@open-wysiwyg-editor/react";

export function Minimal() {
  const { ref, editor } = useEditor({ ui: false, content: "<p>Hello</p>" });
  return (
    <>
      <button onClick={() => editor?.chain().focus().toggleBold().run()}>Bold</button>
      <div ref={ref} />
    </>
  );
}`,
      },
    ],
  },

  {
    slug: "next",
    name: "Next.js",
    pkg: "@open-wysiwyg-editor/next",
    install: "npm install @open-wysiwyg-editor/next",
    requires: "Next.js 13.4+",
    snippets: [
      {
        id: "appLayoutTsx",
        label: "app/layout.tsx",
        lang: "tsx",
        code: `import "@open-wysiwyg-editor/next/style.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}`,
      },
      {
        id: "appWritePageTsx",
        label: "app/write/page.tsx",
        lang: "tsx",
        code: `import { RichTextEditor } from "@open-wysiwyg-editor/next";
import { savePost } from "./actions";

// A Server Component: no "use client" needed.
export default function Write() {
  return (
    <form action={savePost}>
      <RichTextEditor name="body" placeholder="Write your post…" />
      <button type="submit">Save</button>
    </form>
  );
}`,
      },
      {
        id: "appWriteActionsTs",
        label: "app/write/actions.ts",
        lang: "ts",
        code: `"use server";

import sanitizeHtml from "sanitize-html"; // or isomorphic-dompurify

export async function savePost(formData: FormData) {
  const body = sanitizeHtml(String(formData.get("body") ?? ""));
  // await db.post.create({ data: { body } });
}`,
      },
      {
        id: "controlled",
        lang: "tsx",
        code: `"use client";

import { useState } from "react";
import { RichTextEditor } from "@open-wysiwyg-editor/next";

export function ArticleEditor({ initial }: { initial: string }) {
  const [html, setHtml] = useState(initial);
  return <RichTextEditor value={html} onChange={setHtml} />;
}`,
      },
    ],
  },

  {
    slug: "preact",
    name: "Preact",
    pkg: "@open-wysiwyg-editor/preact",
    install: "npm install @open-wysiwyg-editor/preact",
    requires: "Preact 10+",
    snippets: [
      {
        id: "basicUsage",
        lang: "tsx",
        code: `import { useState } from "preact/hooks";
import { RichTextEditor } from "@open-wysiwyg-editor/preact";
import "@open-wysiwyg-editor/preact/style.css";

export function Article() {
  const [html, setHtml] = useState("<p>Hello</p>");
  return <RichTextEditor value={html} onChange={setHtml} class="article-editor" />;
}`,
      },
      {
        id: "forms",
        lang: "tsx",
        code: `<form method="post" action="/save">
  <RichTextEditor name="body" defaultValue={post.body} />
  <button type="submit">Save</button>
</form>`,
      },
      {
        id: "headless",
        lang: "tsx",
        code: `import { useEditor } from "@open-wysiwyg-editor/preact";

export function Minimal() {
  const { ref, editor } = useEditor({ ui: false, content: "<p>Hello</p>" });
  return (
    <>
      <button onClick={() => editor?.chain().focus().toggleBold().run()}>Bold</button>
      <div ref={ref} />
    </>
  );
}`,
      },
    ],
  },

  {
    slug: "vue",
    name: "Vue",
    pkg: "@open-wysiwyg-editor/vue",
    install: "npm install @open-wysiwyg-editor/vue",
    requires: "Vue 3.3+",
    snippets: [
      {
        id: "articleVue",
        label: "Article.vue",
        lang: "vue",
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
      {
        id: "options",
        lang: "vue",
        code: `<RichTextEditor
  v-model="html"
  :options="{
    language: 'ar',
    ui: { toolbar: ['bold', 'italic', '|', 'link', '|', 'undo', 'redo'] },
  }"
/>`,
      },
      {
        id: "forms",
        lang: "vue",
        code: `<form method="post" action="/save">
  <RichTextEditor v-model="html" name="body" />
  <button type="submit">Save</button>
</form>`,
      },
      {
        id: "editorAccess",
        lang: "vue",
        code: `<script setup lang="ts">
import { ref } from "vue";
import { RichTextEditor, type Editor } from "@open-wysiwyg-editor/vue";

const html = ref("");
const field = ref<{ editor: Editor | null } | null>(null);

const onReady = (editor: Editor) => editor.focus();
const bold = () => field.value?.editor?.commands.toggleBold();
</script>

<template>
  <button type="button" @click="bold">Bold</button>
  <RichTextEditor ref="field" v-model="html" @ready="onReady" />
</template>`,
      },
    ],
  },

  {
    slug: "nuxt",
    name: "Nuxt",
    pkg: "@open-wysiwyg-editor/nuxt",
    install: "npm install @open-wysiwyg-editor/nuxt",
    requires: "Nuxt 3+",
    snippets: [
      {
        id: "nuxtConfigTs",
        label: "nuxt.config.ts",
        lang: "ts",
        code: `export default defineNuxtConfig({
  modules: ["@open-wysiwyg-editor/nuxt"],
});`,
      },
      {
        id: "pagesPostVue",
        label: "pages/post.vue",
        lang: "vue",
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
      {
        id: "moduleOptions",
        lang: "ts",
        code: `export default defineNuxtConfig({
  modules: ["@open-wysiwyg-editor/nuxt"],
  wysiwygEditor: {
    css: true, // add the stylesheet to every page
    componentName: "RichTextEditor",
  },
});`,
      },
    ],
  },

  {
    slug: "angular",
    name: "Angular",
    pkg: "@open-wysiwyg-editor/angular",
    install: "npm install @open-wysiwyg-editor/angular",
    requires: "Angular 21+",
    snippets: [
      {
        id: "angularJson",
        label: "angular.json",
        lang: "json",
        code: `"styles": [
  "node_modules/@open-wysiwyg-editor/angular/style.css",
  "src/styles.css"
]`,
      },
      {
        id: "ngModel",
        label: "ngModel",
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
      {
        id: "reactiveForms",
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
      {
        id: "optionsAndEvents",
        lang: "html",
        code: `<owe-rich-text-editor
  [(value)]="html"
  [options]="{ language: 'ar', dir: 'rtl', autofocus: true }"
  placeholder="اكتب هنا…"
  (ready)="onReady($event)"
/>`,
      },
    ],
  },

  {
    slug: "svelte",
    name: "Svelte",
    pkg: "@open-wysiwyg-editor/svelte",
    install: "npm install @open-wysiwyg-editor/svelte",
    requires: "Svelte 3, 4 or 5",
    snippets: [
      {
        id: "svelte5",
        label: "Svelte 5",
        lang: "svelte",
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
      {
        id: "svelte3And4",
        lang: "svelte",
        code: `<script lang="ts">
  import { richText } from "@open-wysiwyg-editor/svelte";
  import "@open-wysiwyg-editor/svelte/style.css";

  let html = "<p>Hello <strong>world</strong></p>";
</script>

<div use:richText={{ content: html, onUpdate: (editor) => (html = editor.getHTML()) }} />

<pre>{html}</pre>`,
      },
      {
        id: "forms",
        lang: "svelte",
        code: `<form method="POST">
  <div use:richText={{ content: html, onUpdate: (e) => (html = e.getHTML()) }}></div>
  <input type="hidden" name="body" value={html} />
  <button>Save</button>
</form>`,
      },
    ],
  },

  {
    slug: "solid",
    name: "Solid",
    pkg: "@open-wysiwyg-editor/solid",
    install: "npm install @open-wysiwyg-editor/solid",
    requires: "Solid 1.6+",
    snippets: [
      {
        id: "basicUsage",
        lang: "tsx",
        code: `import { createSignal } from "solid-js";
import { richText } from "@open-wysiwyg-editor/solid";
import "@open-wysiwyg-editor/solid/style.css";

richText; // keeps the import from being tree-shaken

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
}`,
      },
      {
        id: "forms",
        lang: "tsx",
        code: `<form method="post">
  <div use:richText={{ content: html(), onUpdate: (e) => setHtml(e.getHTML()) }} />
  <input type="hidden" name="body" value={html()} />
  <button>Save</button>
</form>`,
      },
    ],
  },

  {
    slug: "astro",
    name: "Astro",
    pkg: "@open-wysiwyg-editor/astro",
    install: "npm install @open-wysiwyg-editor/astro",
    requires: "Astro 4+",
    snippets: [
      {
        id: "usage",
        lang: "astro",
        code: `---
import { RichTextEditor } from "@open-wysiwyg-editor/astro";
---

<form method="post" action="/api/save">
  <label for="body">Article</label>
  <RichTextEditor id="body" name="body" value="<p>Hello <strong>world</strong></p>" />
  <button>Save</button>
</form>`,
      },
      {
        id: "arabicAndToolbar",
        lang: "astro",
        code: `<RichTextEditor
  name="body"
  language="ar"
  dir="rtl"
  label="المحتوى"
  toolbar="bold italic underline | link bulletList orderedList"
/>`,
      },
      {
        id: "readTheValue",
        lang: "astro",
        code: `<RichTextEditor id="body" name="body" />

<script>
  const field = document.querySelector<HTMLElement & { value: string }>("#body")!;
  field.addEventListener("input", () => console.log(field.value));
</script>`,
      },
    ],
  },

  {
    slug: "web-component",
    name: "Web component",
    pkg: "open-wysiwyg-editor",
    install: "npm install open-wysiwyg-editor",
    requires: "Safari 16.4+ for forms",
    snippets: [
      {
        id: "cdnNoBuildStep",
        lang: "html",
        code: `${CDN_TAGS}

<owe-editor id="editor" placeholder="Write something…">
  <template><p>Hello <strong>world</strong></p></template>
</owe-editor>

<script>
  document.querySelector("#editor").addEventListener("input", (event) => {
    console.log(event.target.value); // '<p dir="auto">Hello <strong>world</strong></p>'
  });
</script>`,
      },
      {
        id: "bundler",
        lang: "ts",
        code: `import "open-wysiwyg-editor/element";
import "open-wysiwyg-editor/style.css";`,
      },
      {
        id: "inAForm",
        lang: "html",
        code: `<form method="post">
  <label for="body">Article</label>
  <owe-editor id="body" name="body">
    <template><p>Draft…</p></template>
  </owe-editor>
  <button>Save</button>
</form>`,
      },
      {
        id: "properties",
        lang: "ts",
        code: `const el = document.querySelector("owe-editor");
el.options = { language: "ar", ui: { stickyToolbar: false } }; // before it is added to the page
el.value = "<p>New content</p>";
el.editor?.commands.toggleBold();`,
      },
    ],
  },

  {
    slug: "vanilla",
    name: "Vanilla JS",
    pkg: "open-wysiwyg-editor",
    install: "npm install open-wysiwyg-editor",
    snippets: [
      {
        id: "bundler",
        lang: "ts",
        code: `import { createEditor } from "open-wysiwyg-editor";
import "open-wysiwyg-editor/style.css";

const editor = createEditor({
  element: "#editor", // or an HTMLElement
  onUpdate: (editor) => console.log(editor.getHTML()),
});`,
      },
      {
        id: "cdn",
        label: "CDN",
        lang: "html",
        code: `${CDN_TAGS}

<div id="editor"><p>Hello <strong>world</strong></p></div>

<script>
  const editor = OpenWysiwygEditor.createEditor({
    element: "#editor",
    placeholder: "Write something…",
  });
  // editor.getHTML() → '<p dir="auto">Hello <strong>world</strong></p>'
</script>`,
      },
      {
        id: "textarea",
        label: "Textarea",
        lang: "html",
        code: `<form method="post">
  <label for="body">Article</label>
  <textarea id="body" name="body"><p>Draft…</p></textarea>
  <button>Save</button>
</form>
<script>
  OpenWysiwygEditor.createEditor({ element: "#body" });
</script>`,
      },
      {
        id: "headless",
        lang: "ts",
        code: `import { createEditor, StarterKit } from "open-wysiwyg-editor/headless";

const editor = createEditor({ element, extensions: [StarterKit] });
boldButton.onclick = () => editor.chain().focus().toggleBold().run();
editor.subscribe(() => {
  boldButton.setAttribute("aria-pressed", String(editor.isActive("bold")));
});`,
      },
    ],
  },

  {
    slug: "others",
    name: "Lit, Alpine, htmx…",
    pkg: "open-wysiwyg-editor",
    install: "npm install open-wysiwyg-editor",
    snippets: [
      {
        id: "loadItOnce",
        lang: "html",
        code: CDN_TAGS,
      },
      {
        id: "alpineJs",
        label: "Alpine.js",
        lang: "html",
        code: `<owe-editor name="body" x-on:input="html = $event.target.value"></owe-editor>`,
      },
      {
        id: "htmx",
        label: "htmx",
        lang: "html",
        code: `<form hx-post="/articles" hx-swap="outerHTML">
  <owe-editor name="body" value="&lt;p&gt;Hello&lt;/p&gt;"></owe-editor>
  <button>Save</button>
</form>`,
      },
      {
        id: "lit",
        label: "Lit",
        lang: "ts",
        code: `import "open-wysiwyg-editor/element";
import "open-wysiwyg-editor/style.css";

// html\`<owe-editor .value=\${this.html} @input=\${(e) => (this.html = e.target.value)}></owe-editor>\``,
      },
      {
        id: "wordPressAndPHP",
        lang: "html",
        code: `<owe-editor name="body" value="<?php echo esc_attr( $html ); ?>"></owe-editor>`,
      },
    ],
  },
];
