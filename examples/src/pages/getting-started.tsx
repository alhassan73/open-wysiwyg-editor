import { Callout } from "../components/Callout";
import { CodeBlock } from "../components/CodeBlock";
import { InstallTabs } from "../components/InstallTabs";
import { Layout } from "../components/Layout";
import { Tabs } from "../components/Tabs";
import { PageHead, Section, P } from "../components/ui";
import { mount } from "../mount";

const CDN = `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/open-wysiwyg-editor@1/dist/style.min.css" />
<script src="https://cdn.jsdelivr.net/npm/open-wysiwyg-editor@1/dist/open-wysiwyg-editor.global.js"></script>`;

function GettingStarted() {
  return (
    <Layout path="getting-started.html" docs>
      <PageHead
        eyebrow="Start"
        title="Getting started"
        lead="Install the core package, load the stylesheet and mount an editor. Using a framework? Each one has a small package that does these steps for you."
      />

      <Section id="install" title="Install">
        <Tabs
          label="Install method"
          tabs={[
            { id: "pm", label: "Package manager", panel: <InstallTabs pkg="open-wysiwyg-editor" /> },
            { id: "cdn", label: "CDN", panel: <CodeBlock lang="markup" code={CDN} /> },
          ]}
        />
        <Callout tone="info" title="Using a framework?">
          Install the framework package instead of the core. It brings the core with it. See the <a href="frameworks/index.html">frameworks overview</a>.
        </Callout>
      </Section>

      <Section id="styles" title="Load the styles">
        <P text="Load the stylesheet once. It styles the editor, its UI and its content. All rules live in `@layer owe`, so any CSS of your own outside a layer overrides them." />
        <CodeBlock lang="ts" code={`import "open-wysiwyg-editor/style.css"; // or style.min.css`} />
        <P text="With the CDN build, the `<link>` tag above does the same." />
      </Section>

      <Section id="first" title="Your first editor">
        <P text="`createEditor(options)` mounts the editor inside the element you pass and returns an `editor` instance." />
        <CodeBlock
          lang="markup"
          code={`<div id="editor"><p>Hello <strong>world</strong></p></div>

<script type="module">
  import { createEditor } from "open-wysiwyg-editor";
  import "open-wysiwyg-editor/style.css";

  const editor = createEditor({
    element: "#editor", // a selector, or an HTMLElement
    placeholder: "Write something…",
    onUpdate: (editor) => console.log(editor.getHTML()),
  });
</script>`}
        />
        <P text="Three rules apply in every framework: load the stylesheet, call `createEditor()` in the browser after the element exists (it throws during server-side rendering), and call `editor.destroy()` when the element goes away." />
      </Section>

      <Section id="forms" title="HTML forms">
        <P text="Use `<owe-editor name>`. It is a form-associated element, so the form submits the editor's HTML under that name and `form.reset()` restores the starting content." />
        <Tabs
          label="Form integration"
          tabs={[
            {
              id: "element",
              label: "<owe-editor>",
              panel: (
                <CodeBlock
                  lang="markup"
                  code={`${CDN}

<form method="post">
  <label for="body">Article</label>
  <owe-editor id="body" name="body">
    <template><p>Draft…</p></template>
  </owe-editor>
  <button>Save</button>
</form>`}
                />
              ),
            },
            {
              id: "textarea",
              label: "Textarea",
              panel: (
                <CodeBlock
                  lang="markup"
                  code={`<form method="post">
  <label for="body">Article</label>
  <textarea id="body" name="body"><p>Draft…</p></textarea>
  <button>Save</button>
</form>
<script>
  OpenWysiwygEditor.createEditor({ element: "#body" });
</script>`}
                />
              ),
            },
          ]}
        />
        <P text="With a `<textarea>`, the editor hides it and keeps its value in sync. The textarea's `<label>` becomes the editor's accessible name. The live form demo is on the web component page." />
        <p>
          <a className="btn btn-ghost" href="frameworks/web-component.html#demo-h">
            See the live form demo
          </a>
        </p>
      </Section>

      <Section id="saving" title="Saving content">
        <CodeBlock
          lang="ts"
          code={`editor.getHTML();               // clean, sanitized HTML: save this
editor.getJSON();               // or ProseMirror JSON
editor.setContent("<p>…</p>");  // load saved content back`}
        />
        <Callout tone="security" title="Sanitize on the server">
          The editor sanitizes everything it loads and produces, but that is not a security boundary. A client can post any string to your API. Sanitize the HTML again on the server, with a library you trust, before you store it.
        </Callout>
      </Section>

      <Section id="display" title="Displaying saved HTML">
        <P text="On a page that has no editor, load `content.css` and wrap the sanitized HTML in an element with the class `owe-content-root`. It looks the way it did in the editor." />
        <CodeBlock lang="ts" code={`import "open-wysiwyg-editor/content.css"; // or content.min.css`} />
        <CodeBlock lang="markup" code={`<div class="owe-content-root">\n  <!-- your sanitized, saved HTML -->\n</div>`} />
      </Section>

      <Section id="next" title="Next steps">
        <ul className="plain-list">
          <li><a href="frameworks/index.html">Pick your framework</a> and use its package.</li>
          <li><a href="api.html">API reference</a>: options, editor methods, commands and events.</li>
          <li><a href="guides/styling.html">Style the editor</a> with CSS variables.</li>
          <li><a href="guides/security.html">Security guide</a>: CSP, Trusted Types and sanitizing.</li>
        </ul>
      </Section>
    </Layout>
  );
}

mount(<GettingStarted />);
