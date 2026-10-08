import { CodeBlock } from "../components/CodeBlock";
import { Layout } from "../components/Layout";
import { PackageCard } from "../components/PackageCard";
import { PageHead, Section } from "../components/ui";
import { FRAMEWORKS } from "../content/site";
import { mount } from "../mount";

function Index() {
  return (
    <Layout path="frameworks/index.html" docs>
      <PageHead
        eyebrow="Frameworks"
        title="Pick your framework"
        lead="The core package works everywhere. Each framework also has its own small package that re-exports the whole core API, ships the stylesheets, and handles mounting, cleanup, server-side rendering and two-way binding for you."
      />
      <ul className="grid grid-2 plain-list">
        {FRAMEWORKS.map((fw) => (
          <PackageCard key={fw.slug} fw={fw} href={`${fw.slug}.html`} />
        ))}
      </ul>
      <Section id="own" title="Not on the list?">
        <p>
          The framework packages are thin wrappers around a few helpers the core exports (<code className="ic">forwardCallbacks</code>, <code className="ic">pickRuntimeOptions</code>, <code className="ic">sameRuntimeOptions</code>, <code className="ic">syncContent</code>). You can wrap the editor for any other framework the same way:
        </p>
        <CodeBlock
          lang="ts"
          code={`import {
  createEditor, forwardCallbacks, pickRuntimeOptions, sameRuntimeOptions, syncContent,
  type Editor, type EditorOptions,
} from "open-wysiwyg-editor";

function mount(element: HTMLElement, initial: Omit<EditorOptions, "element">) {
  let options = initial;
  let runtime = pickRuntimeOptions(options);
  const editor: Editor = createEditor({ ...options, element, ...forwardCallbacks(() => options) });

  return {
    update(next: Omit<EditorOptions, "element">) {
      options = next; // callbacks pick this up through forwardCallbacks
      if (next.content !== undefined) syncContent(editor, next.content);
      const nextRuntime = pickRuntimeOptions(next);
      if (!sameRuntimeOptions(runtime, nextRuntime)) editor.setOptions((runtime = nextRuntime));
    },
    destroy: () => editor.destroy(),
  };
}`}
        />
        <p>
          Or use the <a href="web-component.html">web component</a>, which already works in anything that can write HTML.
        </p>
      </Section>
    </Layout>
  );
}

mount(<Index />);
