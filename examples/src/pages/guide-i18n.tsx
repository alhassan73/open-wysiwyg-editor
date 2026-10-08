import { RichTextEditor } from "@open-wysiwyg-editor/react";
import { CodeBlock } from "../components/CodeBlock";
import { Layout } from "../components/Layout";
import { PageHead, Section, P } from "../components/ui";
import { mount } from "../mount";
import { useResolvedTheme } from "../theme";

const AR =
  "<h3>مرحبًا بك</h3><p>هذا محرر نصوص يدعم <strong>العربية</strong> بالكامل: الواجهة، والاتجاه، والاختصارات.</p><ul><li><p>اضغط Alt+0 لعرض اختصارات لوحة المفاتيح.</p></li><li><p>English words mix in correctly.</p></li></ul>";

function Page() {
  const theme = useResolvedTheme();
  return (
    <Layout path="guides/i18n.html" docs>
      <PageHead
        eyebrow="Guides"
        title="Languages and RTL"
        lead="English and Arabic are built in. The UI mirrors itself in RTL languages, and every block in the content picks its own direction."
      />

      <Section id="arabic" title="Arabic and RTL">
        <P text={"Set `language` for the interface and `dir` for the base direction of the content. Without `dir`, each text block gets `dir=\"auto\"`, so Arabic and English paragraphs each display correctly in the same document. The direction button sets a block's direction explicitly."} />
        <CodeBlock
          lang="ts"
          code={`import { createEditor } from "open-wysiwyg-editor";

createEditor({ element, language: "ar", dir: "rtl", contentLang: "ar" }); // built in: en, ar`}
        />
        <div className="demo-editor" lang="ar" dir="rtl">
          <RichTextEditor
            value={AR}
            language="ar"
            dir="rtl"
            contentLang="ar"
            ariaLabel="محرر عربي"
            ui={{ theme, toolbar: ["undo", "redo", "|", "blockType", "|", "bold", "italic", "textColor", "highlight", "|", "link", "bulletList", "orderedList", "|", "align", "direction", "|", "help"] }}
          />
        </div>
        <P text="Word and character counts segment words correctly in Arabic and CJK, and find and replace respects word boundaries in both." />
      </Section>

      <Section id="custom" title="Add your own language">
        <P text="Pass `languages` to add or replace UI languages. Untranslated labels fall back to English, and plurals use `Intl.PluralRules`." />
        <CodeBlock
          lang="ts"
          code={`createEditor({
  element,
  language: "fr",
  languages: [{ code: "fr", name: "Français", dir: "ltr", labels: { bold: "Gras" /* … */ } }],
});`}
        />
        <P text="Override a few strings of an existing language with `labels`:" />
        <CodeBlock lang="ts" code={`createEditor({ element, labels: { bold: "Strong" } });`} />
        <P text="The Arabic labels are exported as `arabicLabels`, which is a good starting point for translating another RTL language." />
      </Section>

      <Section id="display" title="Displaying RTL content">
        <P text="When you show saved HTML, keep the `dir` attributes the editor wrote and wrap it in `owe-content-root`. Set `lang` on the container for content in another language so screen readers use the right voice." />
        <CodeBlock lang="markup" code={`<div class="owe-content-root" lang="ar" dir="auto">\n  <!-- sanitized saved HTML -->\n</div>`} />
      </Section>
    </Layout>
  );
}

mount(<Page />);
