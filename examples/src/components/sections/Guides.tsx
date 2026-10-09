import {
  Accessibility,
  ArrowRight,
  Languages,
  Paintbrush,
  Palette,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { CodeBlock } from "@/components/code/CodeBlock";
import { CodeTabs } from "@/components/code/CodeTabs";
import { DocSection } from "@/components/layout/DocSection";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GUIDES } from "@/content/guides";
import { Link } from "@/i18n/navigation";
import { REPO } from "@/lib/site";
import type { Guide, GuideSlug } from "@/types";
import { Callout } from "./Callout";
import { rich } from "./Rich";

// Language-neutral columns of the tables. The description of row `i` is `Guides.<guide>.<rows>.<i>` in the messages.
const TOKEN_ROWS: [token: string, kind: string][] = [
  ["--owe-font", "font stack"],
  ["--owe-font-size, --owe-line-height", "length"],
  ["--owe-radius, --owe-radius-sm", "length"],
  ["--owe-bg, --owe-chrome, --owe-surface", "color"],
  ["--owe-text, --owe-muted", "color"],
  ["--owe-border, --owe-border-subtle", "color"],
  ["--owe-brand, --owe-brand-2, --owe-on-brand", "color"],
  ["--owe-accent, --owe-primary, --owe-focus", "color"],
];

const DERIVED_ROWS: string[] = [
  "--owe-primary",
  "--owe-primary-hover",
  "--owe-accent",
  "--owe-focus, --owe-caret",
  "--owe-selection",
  "--owe-gradient",
];

const BUTTON_ROWS: [token: string, fallback: string][] = [
  ["--owe-btn-color", "--owe-icon"],
  ["--owe-btn-bg", "transparent"],
  ["--owe-btn-hover-color, --owe-btn-hover-bg", "--owe-text, --owe-surface-2"],
  ["--owe-btn-active-color, --owe-btn-active-bg", "--owe-on-accent, --owe-primary"],
  ["--owe-btn-primary-bg, --owe-btn-primary-color", "--owe-primary, --owe-on-accent"],
  ["--owe-btn-radius", "--owe-radius-sm"],
  ["--owe-toolbar-bg, --owe-toolbar-border", "--owe-chrome, --owe-border-subtle"],
  ["--owe-editor-border, --owe-editor-radius", "--owe-border-subtle, --owe-radius"],
];

// Indexes into the message arrays `Guides.a11y.patterns` and `Guides.security.layers`.
const PATTERNS = [0, 1, 2, 3, 4, 5] as const;
const LAYERS = [0, 1, 2, 3, 4, 5] as const;

const SHORTCUT_KEYS: string[][] = [
  ["Alt", "F10"],
  ["Esc"],
  ["Alt", "0"],
  ["Ctrl/⌘", "K"],
  ["Ctrl/⌘", "F"],
  ["Ctrl/⌘", "B / I / U"],
  ["Ctrl/⌘", "Shift", "H"],
  ["Ctrl/⌘", "Alt", "1…6 / 0"],
  ["Ctrl/⌘", "Shift", "7 / 8 / 9"],
];

const CSP_HEADER = `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self';
  img-src 'self' https: data:; require-trusted-types-for 'script';
  trusted-types open-wysiwyg-editor ProseMirrorClipboard`;

const SANITIZE_SNIPPET = `import sanitizeHtml from "sanitize-html"; // or isomorphic-dompurify

export async function savePost(formData: FormData) {
  const body = sanitizeHtml(String(formData.get("body") ?? ""));
  // store \`body\`
}`;

const TOKENS_SNIPPET = `.owe {
  --owe-brand: #0066ff;
  --owe-font: "Cairo", system-ui, sans-serif;
  --owe-radius: 24px;
}`;

const ONE_COLOR_TABS = [
  {
    label: "JavaScript",
    lang: "ts" as const,
    code: `createEditor({ element, ui: { brand: "#e11d48" } });`,
  },
  {
    label: "<owe-editor>",
    lang: "html" as const,
    code: `<owe-editor brand="#e11d48" theme="dark"></owe-editor>`,
  },
  {
    label: "CSS",
    lang: "css" as const,
    code: `.owe {
  --owe-brand: #e11d48;
  --owe-on-brand: #ffffff; /* text on brand buttons */
}`,
  },
];

const BUTTONS_SNIPPET = `.owe {
  --owe-toolbar-bg: #0f172a;
  --owe-toolbar-border: #0f172a;
  --owe-btn-color: #e2e8f0;
  --owe-btn-hover-bg: #1e293b;
  --owe-btn-hover-color: #ffffff;
  --owe-btn-radius: 6px;
  --owe-editor-radius: 8px;
}`;

const SHADCN_SNIPPET = `/* shadcn/ui (Tailwind v4 variables) */
.owe {
  --owe-brand: var(--primary);
  --owe-brand-2: var(--primary);
  --owe-on-brand: var(--primary-foreground);
  --owe-bg: var(--card);
  --owe-text: var(--card-foreground);
  --owe-body: var(--card-foreground);
  --owe-chrome: var(--muted);
  --owe-surface: var(--popover);
  --owe-surface-2: var(--accent);
  --owe-field-bg: var(--background);
  --owe-muted: var(--muted-foreground);
  --owe-icon: var(--foreground);
  --owe-border-subtle: var(--border);
  --owe-popup-border: var(--border);
  /* input outlines need 3:1; shadcn's --border is lighter */
  --owe-border: color-mix(in oklab, var(--foreground) 45%, var(--card));
  --owe-radius: var(--radius);
  --owe-radius-sm: calc(var(--radius) - 2px);
  --owe-font: inherit;
}`;

const SET_THEME_SNIPPET = `import { getUI } from "open-wysiwyg-editor";

getUI(editor)?.setTheme({ theme: "dark", brand: "#e11d48", tokens: { radius: "8px" } });`;

const ARABIC_SNIPPET = `import { createEditor } from "open-wysiwyg-editor";

createEditor({ element, language: "ar", dir: "rtl", contentLang: "ar" }); // built in: en, ar`;

const CUSTOM_LANGUAGE_SNIPPET = `createEditor({
  element,
  language: "fr",
  languages: [{ code: "fr", name: "Français", dir: "ltr", labels: { bold: "Gras" /* … */ } }],
});

createEditor({ element, labels: { bold: "Strong" } }); // override a few strings`;

const DISPLAY_SNIPPET = `<div class="owe-content-root" lang="ar" dir="auto">
  <!-- sanitized saved HTML -->
</div>`;

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd
      dir="ltr"
      className="inline-block rounded-md border bg-muted px-1.5 py-0.5 font-mono text-caption text-foreground"
    >
      {children}
    </kbd>
  );
}

/** An h2 section of a guide. `id` is the heading's anchor: short, English, never changes. */
function Block({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <DocSection id={id} title={title}>
      {children}
    </DocSection>
  );
}

function Prose({ children }: { children: ReactNode }) {
  return <p>{children}</p>;
}

/** Two-column table with a leading code/name cell. */
function SimpleTable({
  caption,
  scroll,
  head,
  rows,
}: {
  caption: string;
  scroll: string;
  head: [string, string] | [string, string, string];
  rows: ReactNode[][];
}) {
  return (
    <Table scrollLabel={`${scroll} ${caption}`} className="min-w-120">
      <caption className="sr-only">{caption}</caption>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {head.map((h) => (
            <TableHead key={h} scope="col">
              {h}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((cells, i) => (
          <TableRow key={i}>
            {cells.map((cell, j) => (
              <TableCell
                key={j}
                className={j === 0 ? "font-bold text-foreground" : "text-muted-foreground"}
              >
                {cell}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Message helpers shared by the guide bodies. */
function useGuide() {
  const t = useTranslations("Guides");
  /** Rich message (inline code) at `key`. */
  const r = (key: string) => t.rich(key, rich);
  const tokenCell = (token: string) => (
    <code dir="ltr" className="inline-block font-mono text-mono wrap-break-word">
      {token}
    </code>
  );
  return { t, r, scroll: t("scroll"), tokenCell };
}

function AccessibilityGuide() {
  const { t, r, scroll } = useGuide();
  return (
    <>
      <Prose>{r("a11y.intro")}</Prose>
      <Block id="shortcuts" title={t("a11y.shortcutsTitle")}>
        <SimpleTable
          caption={t("a11y.shortcutsCaption")}
          scroll={scroll}
          head={[t("a11y.colShortcut"), t("a11y.colAction")]}
          rows={SHORTCUT_KEYS.map((keys, i) => [
            <span key="k" className="inline-flex flex-wrap items-center gap-1" dir="ltr">
              {keys.map((k, j) => (
                <span key={k} className="inline-flex items-center gap-1">
                  {j > 0 ? <span aria-hidden="true">+</span> : null}
                  <Kbd>{k}</Kbd>
                </span>
              ))}
            </span>,
            t(`a11y.shortcuts.${i}`),
          ])}
        />
      </Block>
      <Block id="patterns" title={t("a11y.patternsTitle")}>
        <ul className="space-y-3">
          {PATTERNS.map((i) => (
            <li key={i} className="flex gap-3">
              <span
                aria-hidden="true"
                className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand-teal"
              />
              <span className="min-w-0">
                <strong className="font-bold text-foreground">
                  {t(`a11y.patterns.${i}.lead`)}
                </strong>{" "}
                {r(`a11y.patterns.${i}.text`)}
              </span>
            </li>
          ))}
        </ul>
      </Block>
      <Callout title={t("a11y.tipTitle")}>{r("a11y.tip")}</Callout>
    </>
  );
}

function SecurityGuide() {
  const { t, r, scroll } = useGuide();
  return (
    <>
      <Prose>{r("security.intro")}</Prose>
      <Block id="layers" title={t("security.layersTitle")}>
        <SimpleTable
          caption={t("security.layersCaption")}
          scroll={scroll}
          head={[t("security.colLayer"), t("security.colWhat")]}
          rows={LAYERS.map((i) => [
            t(`security.layers.${i}.name`),
            <span key="t">{r(`security.layers.${i}.text`)}</span>,
          ])}
        />
      </Block>
      <Block id="csp" title={t("security.cspTitle")}>
        <Prose>{r("security.csp")}</Prose>
        <CodeBlock code={CSP_HEADER} lang="bash" />
      </Block>
      <Block id="trusted-types" title={t("security.ttTitle")}>
        <Prose>{r("security.tt")}</Prose>
      </Block>
      <Callout tone="security" title={t("security.serverTitle")}>
        {r("security.server")}
      </Callout>
      <CodeBlock code={SANITIZE_SNIPPET} lang="ts" />
      <Prose>{r("security.serverNote")}</Prose>
      <p className="text-small text-muted-foreground">
        {t.rich("security.report", {
          link: (chunks) => (
            <a
              href={`${REPO}/blob/main/SECURITY.md`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-link underline underline-offset-4 hover:text-foreground"
            >
              {chunks}
            </a>
          ),
        })}
      </p>
    </>
  );
}

function StylingGuide() {
  const { t, r, scroll, tokenCell } = useGuide();
  return (
    <>
      <Prose>{r("styling.intro")}</Prose>
      <Block id="files" title={t("styling.filesTitle")}>
        <Prose>{r("styling.files")}</Prose>
      </Block>
      <Block id="tokens" title={t("styling.tokensTitle")}>
        <Prose>{r("styling.tokens")}</Prose>
        <CodeBlock code={TOKENS_SNIPPET} lang="css" />
        <SimpleTable
          caption={t("styling.tokensCaption")}
          scroll={scroll}
          head={[t("styling.colToken"), t("styling.colKind"), t("styling.colWhat")]}
          rows={TOKEN_ROWS.map(([token, kind], i) => [
            <span key="c">{tokenCell(token)}</span>,
            <bdi key="k" dir="ltr">
              {kind}
            </bdi>,
            <span key="w">{r(`styling.tokenRows.${i}`)}</span>,
          ])}
        />
      </Block>
      <Block id="theme" title={t("styling.themeTitle")}>
        <Prose>{r("styling.theme")}</Prose>
      </Block>
    </>
  );
}

function ThemingGuide() {
  const { t, r, scroll, tokenCell } = useGuide();
  return (
    <>
      <Prose>{r("theming.intro")}</Prose>
      <Block id="one-color" title={t("theming.oneTitle")}>
        <Prose>{r("theming.one")}</Prose>
        <CodeTabs items={ONE_COLOR_TABS} />
      </Block>
      <Block id="derived" title={t("theming.derivedTitle")}>
        <Prose>{r("theming.derived")}</Prose>
        <SimpleTable
          caption={t("theming.derivedCaption")}
          scroll={scroll}
          head={[t("theming.colToken"), t("theming.colDerived")]}
          rows={DERIVED_ROWS.map((token, i) => [
            <span key="c">{tokenCell(token)}</span>,
            <span key="w">{r(`theming.derivedRows.${i}`)}</span>,
          ])}
        />
      </Block>
      <Block id="buttons" title={t("theming.buttonsTitle")}>
        <Prose>{r("theming.buttons")}</Prose>
        <SimpleTable
          caption={t("theming.buttonsCaption")}
          scroll={scroll}
          head={[t("theming.colToken"), t("theming.colDefault"), t("theming.colStyles")]}
          rows={BUTTON_ROWS.map(([token, fallback], i) => [
            <span key="c">{tokenCell(token)}</span>,
            <span key="d">{tokenCell(fallback)}</span>,
            <span key="w">{r(`theming.buttonRows.${i}`)}</span>,
          ])}
        />
        <Prose>{t("theming.buttonsExample")}</Prose>
        <CodeBlock code={BUTTONS_SNIPPET} lang="css" />
      </Block>
      <Block id="dashboard" title={t("theming.dashboardTitle")}>
        <Prose>{r("theming.dashboard")}</Prose>
        <CodeBlock code={SHADCN_SNIPPET} lang="css" />
      </Block>
      <Block id="later" title={t("theming.laterTitle")}>
        <Prose>{r("theming.later")}</Prose>
        <CodeBlock code={SET_THEME_SNIPPET} lang="ts" />
      </Block>
      <Callout title={t("theming.contrastTitle")}>{r("theming.contrast")}</Callout>
    </>
  );
}

function LanguagesGuide() {
  const { t, r } = useGuide();
  return (
    <>
      <Prose>{r("languages.intro")}</Prose>
      <Block id="arabic" title={t("languages.arabicTitle")}>
        <Prose>{r("languages.arabic")}</Prose>
        <CodeBlock code={ARABIC_SNIPPET} lang="ts" />
      </Block>
      <Block id="custom" title={t("languages.customTitle")}>
        <Prose>{r("languages.custom")}</Prose>
        <CodeBlock code={CUSTOM_LANGUAGE_SNIPPET} lang="ts" />
      </Block>
      <Block id="display" title={t("languages.displayTitle")}>
        <Prose>{r("languages.display")}</Prose>
        <CodeBlock code={DISPLAY_SNIPPET} lang="html" />
      </Block>
    </>
  );
}

const BODIES: Record<GuideSlug, () => ReactNode> = {
  theming: ThemingGuide,
  styling: StylingGuide,
  accessibility: AccessibilityGuide,
  security: SecurityGuide,
  i18n: LanguagesGuide,
};

const ICONS: Record<GuideSlug, LucideIcon> = {
  theming: Paintbrush,
  styling: Palette,
  accessibility: Accessibility,
  security: ShieldCheck,
  i18n: Languages,
};

/** Guides page: a card for every guide. */
export function GuideCards() {
  const t = useTranslations("Guides");
  return (
    <ul role="list" className="grid gap-4 sm:grid-cols-2 md:gap-6">
      {GUIDES.map((g) => {
        const Icon = ICONS[g.slug];
        return (
          <li key={g.slug} className="flex">
            <Link
              href={`/guides/${g.slug}/`}
              className="group flex h-full w-full flex-col gap-4 rounded-3xl border bg-card p-6 transition-colors duration-150 hover:border-primary/40 hover:bg-accent/40"
            >
              <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-link ring-1 ring-primary/20">
                <Icon aria-hidden="true" className="size-6" strokeWidth={1.75} />
              </span>
              <h2 className="text-h3">{t(`${g.key}.title`)}</h2>
              <span className="text-small text-muted-foreground">{t(`${g.key}.summary`)}</span>
              <span className="mt-auto inline-flex items-center gap-1.5 text-small font-bold text-link">
                {t("read")}
                <ArrowRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** One guide's sections. Block-level siblings are 24px apart; each h2 section brings its own 48px. */
export function GuidePage({ guide }: { guide: Guide }) {
  const Body = BODIES[guide.slug];
  return (
    <div className="space-y-6">
      <Body />
    </div>
  );
}
