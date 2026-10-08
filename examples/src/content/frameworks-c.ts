import type { FrameworkDoc } from "./frameworks";

const coreLinks = [{ label: "Core README", href: "https://github.com/alhassan73/open-wysiwyg-editor#readme" }];

export const DOCS_C: Record<string, FrameworkDoc> = {
  solid: {
    slug: "solid",
    lead: "A `use:richText` directive for Solid 1.6+ and SolidStart. The object you pass is read reactively.",
    requires: "Solid 1.6+",
    sections: [
      {
        id: "usage",
        title: "Minimal usage",
        text: ["Keep the `richText;` line. TypeScript and Babel drop imports that look unused, and `use:richText` is only a reference to the function. In TypeScript, `use:richText` is typed for you."],
        code: [
          {
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
        ],
      },
      {
        id: "binding",
        title: "Two-way binding",
        text: ["`content` goes in, `onUpdate` sends the HTML back. Outside changes load into the editor. The editor's own HTML is not reloaded, so the cursor stays."],
      },
      {
        id: "options",
        title: "Options, language and toolbar",
        code: [{ lang: "tsx", code: `<div\n  use:richText={{\n    content: html(),\n    language: "ar",\n    dir: "rtl",\n    contentLang: "ar",\n    ui: { toolbar: ["bold", "italic", "|", "link", "bulletList", "orderedList"] },\n    onUpdate: (e) => setHtml(e.getHTML()),\n  }}\n/>` }],
      },
      {
        id: "editor",
        title: "Getting the editor",
        code: [{ lang: "tsx", code: `import type { Editor } from "@open-wysiwyg-editor/solid";\n\nlet editor: Editor | undefined;\n\n<div use:richText={{ onCreate: (e) => (editor = e) }} />\n<button type="button" onClick={() => editor?.chain().focus().toggleBold().run()}>Bold</button>` }],
      },
      {
        id: "forms",
        title: "Forms and saving",
        text: ["Keep the HTML in a hidden input so a normal form post (or a SolidStart action) receives it."],
        code: [{ lang: "tsx", code: `<form method="post">\n  <div use:richText={{ content: html(), onUpdate: (e) => setHtml(e.getHTML()) }} />\n  <input type="hidden" name="body" value={html()} />\n  <button>Save</button>\n</form>` }],
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
            { name: "extensions, ui, language…", type: "everything else", desc: "Read once when the editor is created. Re-render it inside a keyed <Show> to recreate it." },
          ],
        },
      },
    ],
    ssr: ["Directives only run in the browser. On the server the element is rendered empty, and the editor starts when the page hydrates, so there is nothing to guard with `isServer`. Import the CSS in `root.tsx` or `entry-client.tsx` to avoid a flash of unstyled content."],
    styling: { text: ["Import `style.css` for the editor and `content.css` for pages that only show saved HTML."], code: [{ lang: "ts", code: `import "@open-wysiwyg-editor/solid/style.css";\nimport "@open-wysiwyg-editor/solid/content.css";` }] },
  },

  astro: {
    slug: "astro",
    lead: "An `.astro` component that renders `<owe-editor>`. It works with plain form posts and needs no UI framework.",
    requires: "Astro 4+",
    sections: [
      {
        id: "usage",
        title: "Usage",
        text: ["The component imports its own script and styles, so you do not add anything else. The HTML is submitted under `name` with the surrounding `<form>`, and `form.reset()` restores the field."],
        code: [
          {
            lang: "markup",
            code: `---
import { RichTextEditor } from "@open-wysiwyg-editor/astro";
---

<form method="post" action="/api/save">
  <label for="body">Article</label>
  <RichTextEditor id="body" name="body" value="<p>Hello <strong>world</strong></p>" />
  <button>Save</button>
</form>`,
          },
        ],
      },
      {
        id: "props",
        title: "Props",
        props: {
          title: "RichTextEditor props",
          kind: "props",
          rows: [
            { name: "name", type: "string", desc: "Form field name." },
            { name: "value", type: "string", desc: "Initial content as HTML." },
            { name: "placeholder", type: "string", desc: "Placeholder text." },
            { name: "label", type: "string", desc: "Accessible name. Or point a <label for> at the component's id." },
            { name: "readonly, disabled", type: "boolean", desc: "Read-only or disabled." },
            { name: "language", type: "string", desc: 'UI language, for example "ar". Defaults to <html lang>.' },
            { name: "dir", type: '"ltr" | "rtl" | "auto"', desc: "Base direction of the content." },
            { name: "toolbar", type: "string", desc: 'Toolbar items separated by spaces, for example "bold italic | link", or "none".' },
            { name: "other", type: "any", desc: "Any HTML attribute (id, class, data-*…) is passed to the element." },
          ],
        },
      },
      {
        id: "rtl",
        title: "Arabic and a custom toolbar",
        code: [{ lang: "markup", code: `<RichTextEditor\n  name="body"\n  language="ar"\n  dir="rtl"\n  label="المحتوى"\n  toolbar="bold italic underline | link bulletList orderedList"\n/>` }],
      },
      {
        id: "script",
        title: "Reading the value in a page script",
        text: ["The element fires `input` on every change and `change` when it loses focus after a change. `element.value` is the HTML, and `element.editor` is the editor instance once it has started."],
        code: [{ lang: "markup", code: `<RichTextEditor id="body" name="body" />\n\n<script>\n  const field = document.querySelector<HTMLElement & { value: string }>("#body")!;\n  field.addEventListener("input", () => console.log(field.value));\n</script>` }],
      },
      {
        id: "saving",
        title: "Saving: form post and API route",
        text: ["This route needs an adapter, or a prerender-off route."],
        code: [{ lang: "ts", label: "src/pages/api/save.ts", code: `import type { APIRoute } from "astro";\n\nexport const prerender = false;\n\nexport const POST: APIRoute = async ({ request }) => {\n  const form = await request.formData();\n  const body = String(form.get("body") ?? "");\n  // Sanitize again on the server before you store or render it for other users.\n  return Response.json({ length: body.length });\n};` }],
        callout: { tone: "security", title: "Sanitize on the server", text: "Never trust HTML that comes from the client." },
      },
    ],
    ssr: ["The server (or the static build) renders only the `<owe-editor>` element, with the initial HTML in its `value` attribute. Astro escapes that attribute, so content from users cannot run before the editor sanitizes it. The editor starts in the browser, and the field works with a plain form post in both `static` and `server` output."],
    styling: { text: ["The component already imports `open-wysiwyg-editor/style.css`, and Astro bundles it with your page. To show saved HTML elsewhere, import `open-wysiwyg-editor/content.css`."] },
  },

  "web-component": {
    slug: "web-component",
    lead: "`<owe-editor>` is the full editor as an HTML tag. It is a form-associated custom element that renders in the light DOM, so there is no Shadow DOM and it is CSP-safe.",
    requires: "a current browser (form participation needs Safari 16.4+)",
    sections: [
      {
        id: "usage",
        title: "From a CDN, no build step",
        text: ["The CDN script defines the tag, so one tag is enough."],
        code: [
          {
            lang: "markup",
            code: `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/open-wysiwyg-editor@1/dist/style.min.css" />
<script src="https://cdn.jsdelivr.net/npm/open-wysiwyg-editor@1/dist/open-wysiwyg-editor.global.js"></script>

<owe-editor id="editor" placeholder="Write something…">
  <template><p>Hello <strong>world</strong></p></template>
</owe-editor>

<script>
  document.querySelector("#editor").addEventListener("input", (event) => {
    console.log(event.target.value); // '<p dir="auto">Hello <strong>world</strong></p>'
  });
</script>`,
          },
        ],
      },
      {
        id: "bundler",
        title: "With a bundler",
        text: ["Import the element entry once. It defines the tag."],
        code: [{ lang: "ts", code: `import "open-wysiwyg-editor/element";\nimport "open-wysiwyg-editor/style.css";` }],
      },
      {
        id: "forms",
        title: "In a form",
        text: ["The form submits the editor's HTML under `name`, and `form.reset()` restores the starting content. A `<label for>` pointing at its `id` becomes the accessible name."],
        code: [{ lang: "markup", code: `<form method="post">\n  <label for="body">Article</label>\n  <owe-editor id="body" name="body">\n    <template><p>Draft…</p></template>\n  </owe-editor>\n  <button>Save</button>\n</form>` }],
      },
      {
        id: "attributes",
        title: "Attributes",
        text: ["`placeholder`, `readonly`, `disabled`, `dir`, `content-lang` and `label` follow later changes. `value`, `language` and `toolbar` are only read when the editor starts."],
        props: {
          title: "Attributes",
          kind: "attributes",
          rows: [
            { name: "name", type: "string", desc: "Form field name. The form submits the editor's HTML under it." },
            { name: "placeholder", type: "string", desc: "Placeholder text." },
            { name: "readonly", type: "boolean", desc: "Makes the content read-only." },
            { name: "disabled", type: "boolean", desc: "Disables the editor and leaves it out of the form." },
            { name: "dir", type: "ltr | rtl | auto", desc: "Base direction of the content." },
            { name: "content-lang", type: "string", desc: "lang of the content (spellcheck and screen readers)." },
            { name: "label", type: "string", desc: "Accessible name. Or point a <label for> at the element's id." },
            { name: "value", type: "HTML string", desc: "Initial content as HTML (read once, when the editor is created)." },
            { name: "language", type: "string", desc: "UI language, e.g. ar (read once). Defaults to <html lang>." },
            { name: "toolbar", type: "string", desc: 'Toolbar items separated by spaces ("bold italic | link"), or none (read once).' },
          ],
        },
      },
      {
        id: "properties",
        title: "Properties",
        props: {
          title: "Properties",
          kind: "properties",
          rows: [
            { name: "editor", type: "Editor | null", desc: "The live Editor, or null while the element is not in the document." },
            { name: "value", type: "string", desc: "The content as HTML. Setting it loads new content." },
            { name: "options", type: "EditorOptions", desc: "More createEditor() options (extensions, ui, labels, callbacks…). Set it before the element is added to the page. Attributes win over it." },
            { name: "form", type: "HTMLFormElement | null", desc: "The surrounding <form>, or null." },
          ],
        },
        code: [{ lang: "ts", code: `const el = document.querySelector("owe-editor");\nel.options = { language: "ar", ui: { stickyToolbar: false } };\nel.value = "<p>New content</p>";\nel.editor?.commands.toggleBold();` }],
      },
      {
        id: "events",
        title: "Events",
        props: {
          title: "Events",
          kind: "events",
          rows: [
            { name: "input", type: "Event", desc: "On every change. event.target.value has the HTML." },
            { name: "change", type: "Event", desc: "When the editor loses focus after a change." },
          ],
        },
        callout: { tone: "security", title: "Initial content from users", text: "Use the value attribute or a <template> child when the content comes from users: neither can run anything before the editor sanitizes it. Content placed directly as children is parsed by the browser first." },
      },
    ],
    ssr: ["The element only does work in the browser. A server can print the tag with an escaped `value` attribute (or a `<template>` child)."],
    styling: { text: ["The element renders in the light DOM, so `style.css` applies as usual and your own CSS can reach it."], code: [{ lang: "ts", code: `import "open-wysiwyg-editor/style.css"; // or the CDN <link>` }] },
    links: coreLinks,
  },

  vanilla: {
    slug: "vanilla",
    lead: "The core is one function, `createEditor(options)`. Use it with any bundler, or from a CDN with one script tag.",
    sections: [
      {
        id: "rules",
        title: "Three rules",
        text: [
          "1. Load the stylesheet once: `import \"open-wysiwyg-editor/style.css\"` (or the `<link>` from the CDN).",
          "2. Call `createEditor()` in the browser, after the element exists. It throws during server-side rendering.",
          "3. Call `editor.destroy()` when the element goes away.",
        ],
      },
      {
        id: "bundler",
        title: "Any bundler (Vite, Webpack, Parcel…)",
        code: [{ lang: "ts", code: `import { createEditor } from "open-wysiwyg-editor";\nimport "open-wysiwyg-editor/style.css";\n\nconst editor = createEditor({\n  element: "#editor", // or an HTMLElement\n  onUpdate: (editor) => console.log(editor.getHTML()),\n});` }],
      },
      {
        id: "cdn",
        title: "From a CDN",
        text: ["The script exposes `window.OpenWysiwygEditor`. This also works in WordPress, Shopify, Webflow, PHP, Django and Rails templates."],
        code: [
          {
            lang: "markup",
            code: `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/open-wysiwyg-editor@1/dist/style.min.css" />
<script src="https://cdn.jsdelivr.net/npm/open-wysiwyg-editor@1/dist/open-wysiwyg-editor.global.js"></script>

<div id="editor"><p>Hello <strong>world</strong></p></div>

<script>
  const editor = OpenWysiwygEditor.createEditor({
    element: "#editor", // a selector, or document.querySelector("#editor")
    placeholder: "Write something…",
  });
  // editor.getHTML() → '<p dir="auto">Hello <strong>world</strong></p>'
</script>`,
          },
        ],
      },
      {
        id: "textarea",
        title: "Mount on a textarea",
        text: ["The editor hides the textarea and keeps its value in sync, so the form submits the HTML. The textarea's `<label>` becomes the editor's accessible name."],
        code: [{ lang: "markup", code: `<form method="post">\n  <label for="body">Article</label>\n  <textarea id="body" name="body"><p>Draft…</p></textarea>\n  <button>Save</button>\n</form>\n<script>\n  OpenWysiwygEditor.createEditor({ element: "#body" });\n</script>` }],
      },
      {
        id: "headless",
        title: "Headless: bring your own UI",
        text: ["`open-wysiwyg-editor/headless` gives you the engine and every extension without the built-in UI. From the main entry, `createEditor({ ui: false })` does the same."],
        code: [{ lang: "ts", code: `import { createEditor, StarterKit } from "open-wysiwyg-editor/headless";\n\nconst editor = createEditor({ element, extensions: [StarterKit] });\nboldButton.onclick = () => editor.chain().focus().toggleBold().run();\neditor.subscribe(() => {\n  boldButton.setAttribute("aria-pressed", String(editor.isActive("bold")));\n});` }],
      },
      {
        id: "save",
        title: "Reading and saving content",
        code: [{ lang: "ts", code: `editor.getHTML();              // clean, sanitized HTML: save this\neditor.getJSON();              // or ProseMirror JSON\neditor.setContent("<p>…</p>"); // load new content` }],
        callout: { tone: "security", title: "Still sanitize on the server", text: "Never trust HTML that comes from the client." },
      },
    ],
    ssr: ["`createEditor()` needs a DOM and throws on the server. Call it in the browser after the element exists, for example in `DOMContentLoaded` or an effect."],
    styling: { text: ["`open-wysiwyg-editor/style.css` carries the editor, its UI and its content styles. `content.css` is only the content styles, for pages that show saved HTML."] },
    links: coreLinks,
  },

  others: {
    slug: "others",
    lead: "Anything that can write HTML can use the `<owe-editor>` tag from the core package. It dispatches `input` and `change` events and takes part in forms, so htmx, Turbo and plain form posts work without glue code.",
    sections: [
      {
        id: "setup",
        title: "Load it once",
        text: ["Load the CDN script and stylesheet (or `import \"open-wysiwyg-editor/element\"` and `style.css`), then put the tag in your markup."],
        code: [{ lang: "markup", code: `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/open-wysiwyg-editor@1/dist/style.min.css" />\n<script src="https://cdn.jsdelivr.net/npm/open-wysiwyg-editor@1/dist/open-wysiwyg-editor.global.js"></script>` }],
      },
      {
        id: "alpine",
        title: "Alpine.js",
        code: [{ lang: "markup", code: `<owe-editor name="body" x-on:input="html = $event.target.value"></owe-editor>` }],
      },
      {
        id: "htmx",
        title: "htmx",
        text: ["The form field is sent like any other input."],
        code: [{ lang: "markup", code: `<form hx-post="/articles" hx-swap="outerHTML">\n  <owe-editor name="body" value="&lt;p&gt;Hello&lt;/p&gt;"></owe-editor>\n  <button>Save</button>\n</form>` }],
      },
      {
        id: "lit",
        title: "Lit",
        code: [{ lang: "ts", code: `import "open-wysiwyg-editor/element";\nimport "open-wysiwyg-editor/style.css";\n// html\`<owe-editor .value=\${this.html} @input=\${(e) => (this.html = e.target.value)}></owe-editor>\`` }],
      },
      {
        id: "ember-qwik",
        title: "Ember and Qwik",
        text: ["Import the element entry once in the browser, then use the tag in a template. Listen for `input` to read `event.target.value`. In Qwik, import it inside a visible task so it never runs on the server."],
        code: [{ lang: "ts", label: "Qwik", code: `useVisibleTask$(async () => {\n  await import("open-wysiwyg-editor/element");\n});` }],
      },
      {
        id: "wordpress",
        title: "WordPress and PHP",
        text: ["Add the CDN `<link>` and `<script>` in the page head or footer, and print the tag with an escaped `value` attribute."],
        code: [{ lang: "markup", code: `<owe-editor name="body" value="<?php echo esc_attr( $html ); ?>"></owe-editor>` }],
        callout: { tone: "security", title: "Escape and sanitize", text: "esc_attr() keeps user content from breaking out of the attribute. Sanitize the posted HTML again on the server (for example with wp_kses_post())." },
      },
    ],
    ssr: ["The tag is plain HTML, so any server can print it. The editor starts in the browser."],
    styling: { text: ["The element renders in the light DOM, so `style.css` and your own CSS apply as usual."] },
    links: coreLinks,
  },
};
