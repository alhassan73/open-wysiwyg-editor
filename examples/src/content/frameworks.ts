// Content for every framework page. Code is checked against packages/*/README.md and src.
import { DOCS_B } from "./frameworks-b";

export interface Code {
  lang: string; // prism language: tsx, ts, markup, bash, css, json
  label?: string; // file name or caption shown above the block
  code: string;
}
export interface PropRow {
  name: string;
  type: string;
  def?: string;
  desc: string;
}
export interface PropsSpec {
  title: string;
  kind: "props" | "inputs" | "outputs" | "events" | "options" | "attributes" | "properties" | "members";
  rows: PropRow[];
}
export interface Section {
  id: string;
  title: string;
  text?: string[]; // paragraphs; `code` between backticks becomes inline code
  code?: Code[];
  props?: PropsSpec;
  callout?: { tone: "info" | "warn" | "security"; title: string; text: string };
}
export interface FrameworkDoc {
  slug: string;
  lead: string;
  requires?: string;
  sections: Section[];
  ssr: string[];
  styling: { text: string[]; code?: Code[] };
  links?: { label: string; href: string }[];
}

const reactRows = (cls: "className" | "class"): PropRow[] => [
  { name: "value", type: "string", def: "none", desc: "Controlled HTML." },
  { name: "defaultValue", type: "string | JSON", def: "none", desc: "Initial content (HTML or ProseMirror JSON) for an uncontrolled editor." },
  { name: "onChange", type: "(html: string, editor: Editor) => void", def: "none", desc: "Called with the new HTML on every change." },
  { name: "name", type: "string", def: "none", desc: "Form field name. Adds a hidden <input> that holds the HTML." },
  { name: cls, type: "string", def: "none", desc: "Class on the wrapper <div>." },
  { name: "id", type: "string", def: "none", desc: "id on the wrapper <div>." },
  { name: "extensions", type: "AnyExtension[]", def: "[StarterKit]", desc: "Feature set. Read at mount." },
  { name: "ui", type: "UIOptions | false", def: "built-in UI", desc: "Toolbar, items, status bar, theme, shortcuts. false = headless. Read at mount." },
  { name: "editable", type: "boolean", def: "true", desc: "Allow editing. Updates live." },
  { name: "autofocus", type: 'boolean | "start" | "end"', def: "false", desc: "Focus on mount." },
  { name: "placeholder", type: "string | false", def: "none", desc: "Text shown when empty. Updates live." },
  { name: "ariaLabel", type: "string", def: '"Rich text editor"', desc: "Accessible name of the editing area. Updates live." },
  { name: "ariaLabelledBy", type: "string", def: "none", desc: "id of an element that labels the editor. Updates live." },
  { name: "ariaDescribedBy", type: "string", def: "none", desc: "id of an element that describes the editor. Updates live." },
  { name: "language", type: "string", def: "<html lang>, then first language", desc: 'UI language code ("en", "ar"). Read at mount.' },
  { name: "languages", type: "EditorLanguage[]", def: "en, ar", desc: "Languages available to the UI. Read at mount." },
  { name: "labels", type: "Partial<Labels>", def: "none", desc: "Override UI strings. Read at mount." },
  { name: "dir", type: '"ltr" | "rtl" | "auto"', def: "auto per block", desc: "Base direction of the content. Updates live." },
  { name: "contentLang", type: "string", def: "none", desc: "lang of the editing area (spellcheck, screen readers). Updates live." },
  { name: "urlPolicy", type: "UrlPolicy", def: "http, https, mailto, tel; relative allowed", desc: "Allowed link and image URLs. Read at mount." },
  { name: "inputRules", type: "boolean", def: "true", desc: "Markdown-style typing shortcuts. Read at mount." },
  { name: "onCreate onUpdate onSelectionUpdate onFocus onBlur onDestroy onContentError", type: "callbacks", def: "none", desc: "Editor events. Always call the latest function." },
];

const RUNTIME_NOTE =
  "Callbacks and the runtime options (`editable`, `placeholder`, `aria*`, `dir`, `contentLang`) follow every render. Everything else is read once at mount. To change those, give the component a new `key`.";

export const DOCS: Record<string, FrameworkDoc> = {
  react: {
    slug: "react",
    lead: "RichTextEditor and useEditor() for React 18 and newer, including Remix, Gatsby and Vite.",
    requires: "React 18+",
    sections: [
      {
        id: "usage",
        title: "Minimal usage",
        code: [
          {
            lang: "tsx",
            code: `import { RichTextEditor } from "@open-wysiwyg-editor/react";
import "@open-wysiwyg-editor/react/style.css";

export function Notes() {
  return <RichTextEditor defaultValue="<p>Hello</p>" onChange={(html) => console.log(html)} />;
}`,
          },
        ],
      },
      {
        id: "controlled",
        title: "Controlled",
        text: ["The editor loads `value` only when it differs from the HTML it last produced, so typing never resets the cursor."],
        code: [
          {
            lang: "tsx",
            code: `import { useState } from "react";
import { RichTextEditor } from "@open-wysiwyg-editor/react";

export function Article() {
  const [html, setHtml] = useState("<p>Hello</p>");
  return <RichTextEditor value={html} onChange={setHtml} />;
}`,
          },
        ],
      },
      {
        id: "forms",
        title: "Forms and saving",
        text: ["`name` keeps a hidden `<input>` in sync with the HTML, so the editor works in plain form posts and React 19 form actions."],
        code: [
          {
            lang: "tsx",
            code: `<form action={save}>
  <RichTextEditor name="body" defaultValue={post.body} />
  <button type="submit">Save</button>
</form>`,
          },
        ],
        callout: { tone: "security", title: "Sanitize on the server", text: "The editor sanitizes what it loads and produces, but anyone can post any string to your endpoint. Sanitize again before you store or render it." },
      },
      {
        id: "toolbar",
        title: "Custom toolbar",
        text: ["`ui` takes the toolbar layout (item names and `\"|\"` separators), custom items, status bar, theme and more."],
        code: [
          {
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
        ],
      },
      {
        id: "headless",
        title: "Headless with useEditor",
        text: ["Build your own UI. `ui: false` turns the built-in toolbar off. `editor` is `null` before mount and during server rendering."],
        code: [
          {
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
        id: "rtl",
        title: "Arabic and RTL",
        text: ["`language` sets the UI language (built in: `en`, `ar`). Without `dir`, each block follows its own text direction."],
        code: [{ lang: "tsx", code: `<RichTextEditor language="ar" dir="rtl" contentLang="ar" />` }],
      },
      { id: "props", title: "Props", text: [RUNTIME_NOTE], props: { title: "RichTextEditor props", kind: "props", rows: reactRows("className") } },
    ],
    ssr: [
      "The component is SSR-safe. On the server it renders an empty container and the hidden input. The editor starts in the browser after hydration. `useEditor` returns `editor: null` until then.",
      "`createEditor` itself needs a DOM, so call it only in effects.",
    ],
    styling: {
      text: ["Import the stylesheet once. To show saved HTML outside the editor, use `content.css` and put the HTML in an element with the class `owe-content-root`."],
      code: [{ lang: "ts", code: `import "@open-wysiwyg-editor/react/style.css"; // editor UI + content (or style.min.css)\nimport "@open-wysiwyg-editor/react/content.css"; // content only, for pages that show saved HTML` }],
    },
  },

  next: {
    slug: "next",
    lead: "The React package with a \"use client\" banner. Use it straight from Server Components and wire it to Server Actions with `name`.",
    requires: "Next.js App Router or Pages Router",
    sections: [
      {
        id: "app-router",
        title: "App Router",
        text: ["Import the styles once, in the root layout, then use the editor in any Server Component, with no `\"use client\"` in your file."],
        code: [
          {
            lang: "tsx",
            label: "app/layout.tsx",
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
            lang: "tsx",
            label: "app/page.tsx (a Server Component)",
            code: `import { RichTextEditor } from "@open-wysiwyg-editor/next";

export default function Page() {
  return <RichTextEditor defaultValue="<p>Hello</p>" placeholder="Write something…" />;
}`,
          },
        ],
        callout: { tone: "info", title: "Callbacks need a client component", text: "A Server Component cannot pass functions such as onChange. Use a client component for those, or use name with a Server Action." },
      },
      {
        id: "controlled",
        title: "Controlled, in a client component",
        code: [
          {
            lang: "tsx",
            label: "app/editor.tsx",
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
        id: "server-actions",
        title: "Server Actions",
        text: ["Give the editor a `name`. It keeps a hidden `<input>` in sync with the HTML, so the form posts it like any field."],
        code: [
          {
            lang: "tsx",
            label: "app/write/page.tsx (a Server Component)",
            code: `import { RichTextEditor } from "@open-wysiwyg-editor/next";
import { savePost } from "./actions";

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
            lang: "ts",
            label: "app/write/actions.ts",
            code: `"use server";

import sanitizeHtml from "sanitize-html"; // or isomorphic-dompurify

export async function savePost(formData: FormData) {
  const body = sanitizeHtml(String(formData.get("body") ?? ""));
  // await db.post.create({ data: { body } });
}`,
          },
        ],
        callout: { tone: "security", title: "Always sanitize on the server", text: "The editor sanitizes what it loads and produces, but anyone can post any string to your action." },
      },
      {
        id: "pages-router",
        title: "Pages Router",
        code: [
          {
            lang: "tsx",
            label: "pages/_app.tsx",
            code: `import type { AppProps } from "next/app";
import "@open-wysiwyg-editor/next/style.css";

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}`,
          },
          {
            lang: "tsx",
            label: "pages/write.tsx",
            code: `import { useState } from "react";
import { RichTextEditor } from "@open-wysiwyg-editor/next";

export default function Write() {
  const [html, setHtml] = useState("<p>Hello</p>");
  return <RichTextEditor value={html} onChange={setHtml} name="body" />;
}`,
          },
        ],
      },
      {
        id: "display",
        title: "Displaying saved HTML",
        text: ["Use the content stylesheet and wrap the HTML in an element with the class `owe-content-root`."],
        code: [
          {
            lang: "tsx",
            label: "app/post/page.tsx",
            code: `import "@open-wysiwyg-editor/next/content.css";

export default async function Post() {
  const html = await getSanitizedPostHtml(); // your own function; sanitize on the server
  return <div className="owe-content-root" dangerouslySetInnerHTML={{ __html: html }} />;
}`,
          },
        ],
        callout: { tone: "warn", title: "dangerouslySetInnerHTML sanitizes nothing", text: "Sanitize the HTML on the server, when you save it or before you render it." },
      },
      { id: "props", title: "Props", text: ["Same props as the React package. " + RUNTIME_NOTE], props: { title: "RichTextEditor props", kind: "props", rows: reactRows("className") } },
    ],
    ssr: [
      "You do not need `dynamic(() => …, { ssr: false })`. On the server the component renders an empty container and the hidden input, and creates the editor in an effect after hydration, so nothing touches `window` or `document` while rendering.",
      "`useEditor` returns `editor: null` until then.",
    ],
    styling: {
      text: ["Import `style.css` once in `app/layout.tsx` or `pages/_app.tsx`. Pages that only show saved HTML use `content.css`."],
      code: [{ lang: "ts", code: `import "@open-wysiwyg-editor/next/style.css";\nimport "@open-wysiwyg-editor/next/content.css";` }],
    },
  },

  preact: {
    slug: "preact",
    lead: "The same API as the React package, on preact/hooks. Use `class` instead of `className`.",
    requires: "Preact 10+",
    sections: [
      {
        id: "usage",
        title: "Minimal usage",
        code: [
          {
            lang: "tsx",
            code: `import { useState } from "preact/hooks";
import { RichTextEditor } from "@open-wysiwyg-editor/preact";
import "@open-wysiwyg-editor/preact/style.css";

export function Article() {
  const [html, setHtml] = useState("<p>Hello</p>");
  return <RichTextEditor value={html} onChange={setHtml} class="article-editor" />;
}`,
          },
        ],
      },
      {
        id: "forms",
        title: "Forms and saving",
        text: ["`name` keeps a hidden `<input>` in sync with the HTML, so a plain form post receives it."],
        code: [
          {
            lang: "tsx",
            code: `<form method="post" action="/save">
  <RichTextEditor name="body" defaultValue={post.body} />
  <button type="submit">Save</button>
</form>`,
          },
        ],
        callout: { tone: "security", title: "Sanitize on the server", text: "Treat the posted HTML as untrusted and sanitize it again before you store or render it." },
      },
      {
        id: "headless",
        title: "Headless with useEditor",
        code: [
          {
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
      { id: "props", title: "Props", text: [RUNTIME_NOTE], props: { title: "RichTextEditor props", kind: "props", rows: reactRows("class") } },
    ],
    ssr: ["The component is SSR-safe. On the server it renders an empty container and the hidden input. The editor starts in the browser after hydration."],
    styling: {
      text: ["Import the stylesheet once. Use `content.css` to show saved HTML inside `owe-content-root`."],
      code: [{ lang: "ts", code: `import "@open-wysiwyg-editor/preact/style.css";` }],
    },
  },

  ...DOCS_B,
};
