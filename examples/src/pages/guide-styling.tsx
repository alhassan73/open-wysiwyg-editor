import { useCallback, useEffect, useId, useRef, useState } from "react";
import { RichTextEditor, contrastRatio, type Editor } from "@open-wysiwyg-editor/react";
import { Callout } from "../components/Callout";
import { CodeBlock } from "../components/CodeBlock";
import { Layout } from "../components/Layout";
import { PropsTable } from "../components/PropsTable";
import { PageHead, Section, P } from "../components/ui";
import { mount } from "../mount";
import { useResolvedTheme } from "../theme";

const FONTS: Record<string, string> = {
  almarai: '"Almarai", system-ui, sans-serif',
  system: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
};

const SAMPLE =
  "<h3>Theme me</h3><p>Change the accent, radius and font on the left. The editor reads <code>--owe-*</code> tokens, set here with <code>element.style.setProperty</code>.</p><p>وهذا نص عربي يتبع نفس الإعدادات.</p>";

function Customizer() {
  const id = useId();
  const site = useResolvedTheme();
  const holder = useRef<HTMLDivElement>(null);
  const [accent, setAccent] = useState("#0066ff");
  const [radius, setRadius] = useState(10);
  const [font, setFont] = useState("almarai");
  const [bg, setBg] = useState("#ffffff");

  const apply = useCallback(() => {
    const owe = holder.current?.querySelector<HTMLElement>(".owe");
    if (!owe) return;
    const onAccent = (contrastRatio("#ffffff", accent) ?? 0) >= (contrastRatio("#000000", accent) ?? 0) ? "#ffffff" : "#000000";
    owe.style.setProperty("--owe-accent", accent);
    owe.style.setProperty("--owe-focus", accent);
    owe.style.setProperty("--owe-on-accent", onAccent);
    owe.style.setProperty("--owe-radius", `${radius}px`);
    owe.style.setProperty("--owe-font", FONTS[font]!);
    owe.style.setProperty("--owe-bg", bg);
  }, [accent, radius, font, bg]);

  useEffect(apply, [apply, site]);

  const ratio = contrastRatio(accent, bg);
  const css = `.owe {
  --owe-accent: ${accent};
  --owe-radius: ${radius}px;
  --owe-font: ${FONTS[font]};
  --owe-bg: ${bg};
}`;

  return (
    <div className="customizer">
      <fieldset className="controls controls-col">
        <legend>Theme tokens</legend>
        <div className="control">
          <label htmlFor={`${id}-accent`}>Accent</label>
          <input id={`${id}-accent`} type="color" value={accent} onChange={(e) => setAccent(e.target.value)} />
        </div>
        <div className="control">
          <label htmlFor={`${id}-bg`}>Background</label>
          <input id={`${id}-bg`} type="color" value={bg} onChange={(e) => setBg(e.target.value)} />
        </div>
        <div className="control">
          <label htmlFor={`${id}-radius`}>Radius: {radius}px</label>
          <input id={`${id}-radius`} type="range" min={0} max={24} value={radius} onChange={(e) => setRadius(Number(e.target.value))} />
        </div>
        <div className="control">
          <label htmlFor={`${id}-font`}>Font</label>
          <select id={`${id}-font`} value={font} onChange={(e) => setFont(e.target.value)}>
            <option value="almarai">Almarai</option>
            <option value="system">System UI</option>
            <option value="serif">Serif</option>
            <option value="mono">Monospace</option>
          </select>
        </div>
        <p className="contrast" role="status">
          Accent on background: <strong>{ratio ? `${ratio.toFixed(2)}:1` : "n/a"}</strong>{" "}
          {ratio !== null && (ratio >= 4.5 ? "(AA for text)" : ratio >= 3 ? "(AA for UI parts only)" : "(below AA)")}
        </p>
      </fieldset>
      <div>
        <div ref={holder} className="demo-editor" data-testid="customizer-editor">
          <RichTextEditor
            value={SAMPLE}
            onCreate={(_editor: Editor) => apply()}
            ui={{ theme: site, statusbar: false }}
            ariaLabel="Theme customizer preview"
          />
        </div>
        <CodeBlock lang="css" code={css} label="Your CSS" />
      </div>
    </div>
  );
}

function Page() {
  return (
    <Layout path="guides/styling.html" docs>
      <PageHead
        eyebrow="Guides"
        title="Styling"
        lead="All editor rules live in `@layer owe`, so any CSS of your own outside a layer wins without `!important`. Theme it by setting design tokens."
      />

      <Section id="files" title="Stylesheets">
        <PropsTable
          title="Stylesheets"
          kind="options"
          rows={[
            { name: "open-wysiwyg-editor/style.css", type: "style.min.css", desc: "The editor, its UI and its content styles." },
            { name: "open-wysiwyg-editor/content.css", type: "content.min.css", desc: "Only the content styles, for published pages: wrap saved HTML in <div class=\"owe-content-root\">." },
          ]}
        />
        <P text="Each framework package ships the same files under its own name, for example `@open-wysiwyg-editor/vue/style.css`, because package managers like pnpm do not expose the core package to your app." />
      </Section>

      <Section id="tokens" title="Design tokens">
        <CodeBlock
          lang="css"
          code={`.owe {
  --owe-accent: #0b57d0;
  --owe-font: "IBM Plex Sans Arabic", system-ui, sans-serif;
  --owe-radius: 10px;
}`}
        />
        <PropsTable
          title="Common tokens"
          kind="options"
          rows={[
            { name: "--owe-font", type: "font stack", desc: "UI and content font." },
            { name: "--owe-font-size, --owe-line-height", type: "length", desc: "Base size of the content." },
            { name: "--owe-radius, --owe-radius-sm", type: "length", desc: "Corner radius of the editor and its controls." },
            { name: "--owe-bg, --owe-surface, --owe-surface-2", type: "color", desc: "Backgrounds of the content area and the toolbar." },
            { name: "--owe-text, --owe-muted", type: "color", desc: "Text colors." },
            { name: "--owe-border, --owe-border-subtle", type: "color", desc: "Borders. Keep --owe-border at 3:1 against the background." },
            { name: "--owe-accent, --owe-on-accent, --owe-focus", type: "color", desc: "Accent for pressed buttons and links, text on it, and the focus ring." },
          ]}
        />
        <Callout tone="info" title="Light and dark">
          The editor ships a light and a dark token set. Set <code className="ic">ui.theme</code> to <code className="ic">light</code>, <code className="ic">dark</code> or <code className="ic">auto</code>, and override tokens under <code className="ic">.owe[data-theme=&quot;dark&quot;]</code> if you want different values per theme.
        </Callout>
      </Section>

      <Section id="live" title="Live theme customizer">
        <P text={"This editor is themed with `element.style.setProperty(\"--owe-accent\", …)` on its `.owe` element. Setting styles through the CSSOM works under a strict CSP."} />
        <Customizer />
      </Section>
    </Layout>
  );
}

mount(<Page />);
