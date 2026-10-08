import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { CodeBlock } from "@/components/code/CodeBlock";
import { CodeTabs } from "@/components/code/CodeTabs";
import { CDN_CSS, CDN_JS } from "@/content/frameworks";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Callout } from "./Callout";
import { Reveal } from "./Reveal";
import { rich } from "./Rich";
import { CONTAINER } from "./SectionShell";

// Indexes into `Install.steps` in the messages.
const STEPS = [0, 1, 2] as const;
const CORE = "open-wysiwyg-editor";

/** Body of the Getting started page (the page header is rendered by the page). */
export function Install() {
  const t = useTranslations("Install");

  const step1 = [
    { label: "npm", lang: "bash" as const, code: `npm install ${CORE}` },
    { label: "pnpm", lang: "bash" as const, code: `pnpm add ${CORE}` },
    { label: "yarn", lang: "bash" as const, code: `yarn add ${CORE}` },
    { label: "bun", lang: "bash" as const, code: `bun add ${CORE}` },
    { label: "CDN", lang: "html" as const, code: `<script src="${CDN_JS}"></script>` },
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
      code: `<link rel="stylesheet" href="${CDN_CSS}" />`,
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
    <div className={cn(CONTAINER, "pt-12 pb-20 md:pt-16 md:pb-28")}>
      {/* Three columns on desktop. The columns share three grid rows (subgrid), so the numbers, the texts
          and the code blocks line up, and the code blocks stretch to one height. */}
      <ol
        role="list"
        className="grid gap-12 lg:grid-cols-3 lg:grid-rows-[auto_auto_1fr] lg:gap-x-6 lg:gap-y-0"
      >
        {STEPS.map((i) => (
          <Reveal
            as="li"
            key={i}
            delay={i * 40}
            className="grid min-w-0 gap-y-4 lg:row-span-3 lg:grid-rows-subgrid"
          >
            <div className="flex items-center gap-4">
              <span
                aria-hidden="true"
                className="grid size-11 shrink-0 place-items-center rounded-full bg-(image:--wm-grad) text-lg font-extrabold text-white tabular-nums"
              >
                {i + 1}
              </span>
              <h2 className="text-h3">{t(`steps.${i}.title`)}</h2>
            </div>
            <p className="text-muted-foreground">{t.rich(`steps.${i}.text`, rich)}</p>
            <CodeTabs items={stepCode[i]!} />
          </Reveal>
        ))}
      </ol>

      <Reveal className="mt-16 grid gap-8 md:grid-cols-2 md:gap-6">
        <div className="min-w-0 space-y-3">
          <h2 className="text-h3">{t("saveTitle")}</h2>
          <p className="text-small text-muted-foreground">{t.rich("saveText", rich)}</p>
          <CodeBlock
            lang="ts"
            code={`editor.getHTML();              // clean, sanitized HTML: save this
editor.getJSON();              // or ProseMirror JSON
editor.setContent("<p>…</p>"); // load saved content back`}
          />
        </div>
        <div className="min-w-0 space-y-3">
          <h2 className="text-h3">{t("showTitle")}</h2>
          <p className="text-small text-muted-foreground">{t.rich("showText", rich)}</p>
          <CodeBlock
            lang="html"
            code={`<!-- import "${CORE}/content.css" -->
<div class="owe-content-root">
  <!-- your sanitized, saved HTML -->
</div>`}
          />
        </div>
      </Reveal>

      <Reveal className="mt-8 space-y-4">
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
      </Reveal>
    </div>
  );
}
