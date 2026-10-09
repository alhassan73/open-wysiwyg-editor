import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { CodeBlock } from "@/components/code/CodeBlock";
import { CodeTabs } from "@/components/code/CodeTabs";
import { CDN_CSS_TAG, CDN_JS_TAG } from "@/content/frameworks";
import { DocSection } from "@/components/layout/DocSection";
import { Link } from "@/i18n/navigation";
import { Callout } from "./Callout";
import { rich } from "./Rich";

// Indexes into `Install.steps` in the messages, with the id of each step's heading.
const STEPS = [
  { i: 0, id: "install" },
  { i: 1, id: "styles" },
  { i: 2, id: "create" },
] as const;
const CORE = "open-wysiwyg-editor";

/** Body of the Getting started page (the page header is rendered by the page). */
export function Install() {
  const t = useTranslations("Install");

  const step1 = [
    { label: "npm", lang: "bash" as const, code: `npm install ${CORE}` },
    { label: "pnpm", lang: "bash" as const, code: `pnpm add ${CORE}` },
    { label: "yarn", lang: "bash" as const, code: `yarn add ${CORE}` },
    { label: "bun", lang: "bash" as const, code: `bun add ${CORE}` },
    { label: "CDN", lang: "html" as const, code: CDN_JS_TAG },
  ];
  const step2 = [
    {
      label: t("tabs.bundler"),
      lang: "ts" as const,
      code: `import "${CORE}/style.css"; // or style.min.css`,
    },
    {
      label: t("tabs.cdn"),
      lang: "html" as const,
      code: CDN_CSS_TAG,
    },
  ];
  const step3 = [
    {
      label: t("tabs.js"),
      lang: "ts" as const,
      code: `import { createEditor } from "${CORE}";

const editor = createEditor({
  element: "#editor", // a selector, or an HTMLElement
  placeholder: "Write something…",
  onUpdate: (editor) => console.log(editor.getHTML()),
});`,
    },
    {
      label: t("tabs.cdn"),
      lang: "html" as const,
      code: `<div id="editor"><p>Hello <strong>world</strong></p></div>

<script>
  const editor = OpenWysiwygEditor.createEditor({ element: "#editor" });
</script>`,
    },
    {
      label: t("tabs.element"),
      lang: "html" as const,
      code: `<!-- import "${CORE}/element"; (or the CDN script above) -->
<owe-editor name="body" placeholder="Write something…">
  <template><p>Hello <strong>world</strong></p></template>
</owe-editor>`,
    },
  ];
  const stepCode = [step1, step2, step3];

  return (
    <>
      {STEPS.map(({ i, id }) => (
        <DocSection key={id} id={id} step={i + 1} title={t(`steps.${i}.title`)}>
          <p>{t.rich(`steps.${i}.text`, rich)}</p>
          <CodeTabs items={stepCode[i]!} />
        </DocSection>
      ))}

      <DocSection id="save" title={t("saveTitle")}>
        <p>{t.rich("saveText", rich)}</p>
        <CodeBlock
          lang="ts"
          code={`editor.getHTML();              // clean, sanitized HTML: save this
editor.getJSON();              // or ProseMirror JSON
editor.setContent("<p>…</p>"); // load saved content back`}
        />
      </DocSection>

      <DocSection id="display" title={t("showTitle")}>
        <p>{t.rich("showText", rich)}</p>
        <CodeBlock
          lang="html"
          code={`<!-- import "${CORE}/content.css" -->
<div class="owe-content-root">
  <!-- your sanitized, saved HTML -->
</div>`}
        />
      </DocSection>

      <div className="mt-12 space-y-4">
        <Callout tone="security" title={t("serverTitle")}>
          {t("serverNote")}
        </Callout>
        <Callout title={t("frameworkTitle")}>
          {t.rich("frameworkText", {
            link: (chunks) => (
              <Link
                href="/frameworks/"
                className="inline-flex items-center gap-1 font-bold text-link underline underline-offset-4 hover:text-foreground"
              >
                {chunks}
                <ArrowRight aria-hidden="true" className="size-3.5 rtl:-scale-x-100" />
              </Link>
            ),
          })}
        </Callout>
      </div>
    </>
  );
}
