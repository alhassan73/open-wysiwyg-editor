"use client";

import { getUI, RichTextEditor, type Editor } from "@open-wysiwyg-editor/next";
import { Check, RotateCcw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { CodeBlock } from "@/components/code/CodeBlock";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DIR } from "@/i18n/config";
import { onColor } from "@/lib/color";
import { cn } from "@/lib/utils";
import type { Locale, PlaygroundText } from "@/types";
import { rich } from "./Rich";
import { Section, SectionHeading } from "./SectionShell";

// Brand swatches. The first is the editor's own default, so choosing it clears the brand instead of setting one.
const SWATCHES = [
  { key: "blue", hex: "#0066ff" },
  { key: "teal", hex: "#0e9f8f" },
  { key: "emerald", hex: "#16a34a" },
  { key: "amber", hex: "#f59e0b" },
  { key: "rose", hex: "#e11d48" },
  { key: "slate", hex: "#334155" },
] as const;
const DEFAULT_BRAND: string = SWATCHES[0].hex;

interface Snapshot {
  html: string;
  json: string;
  text: string;
  words: number;
  chars: number;
}

const measure = (editor: Editor): Omit<Snapshot, "html"> => {
  const text = editor.getText();
  const trimmed = text.trim();
  return {
    json: JSON.stringify(editor.getJSON(), null, 2),
    text,
    words: trimmed ? trimmed.split(/\s+/).length : 0,
    chars: [...text.replace(/\s/g, "")].length,
  };
};

// Block elements that hold other blocks; everything else (p, h1-h6, pre…) stays on one line.
const CONTAINERS = new Set([
  "ul",
  "ol",
  "li",
  "table",
  "thead",
  "tbody",
  "tr",
  "td",
  "th",
  "blockquote",
  "figure",
]);

/** Puts the editor's one-line HTML on indented lines so the output panel is readable. */
function formatHtml(html: string): string {
  const lines: string[] = [];
  let depth = 0;
  let line = "";
  const flush = () => {
    if (line) lines.push("  ".repeat(depth) + line);
    line = "";
  };
  for (const [token] of html.matchAll(/<[^>]+>|[^<]+/g)) {
    const tag = /^<(\/?)([a-z][a-z0-9-]*)/i.exec(token);
    if (!tag) {
      line += token;
      continue;
    }
    const closing = tag[1] === "/";
    const name = tag[2]!.toLowerCase();
    if (CONTAINERS.has(name)) {
      flush();
      if (closing) depth = Math.max(0, depth - 1);
      line = token;
      flush();
      if (!closing) depth++;
    } else if (/^(p|h[1-6]|pre|caption|figcaption|hr)$/.test(name)) {
      if (closing) {
        line += token;
        flush();
      } else {
        flush();
        line = token;
        if (name === "hr") flush();
      }
    } else {
      line += token;
    }
  }
  flush();
  return lines.join("\n");
}

/** The site theme (`data-theme` on <html>), so the editor can match it. */
function useSiteTheme(): "light" | "dark" {
  return useSyncExternalStore(
    (onChange) => {
      const observer = new MutationObserver(onChange);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });
      return () => observer.disconnect();
    },
    () => (document.documentElement.dataset.theme === "light" ? "light" : "dark"),
    () => "dark",
  );
}

const noop = () => () => {};
/** false while rendering on the server and during hydration, true afterwards. */
const useMounted = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

/** The code that gives the editor the picked brand color (the Theme tab). */
const themeSnippet = (hex: string) => `// React, Next.js and the other framework packages
<RichTextEditor ui={{ brand: "${hex}" }} />

// Web component
<owe-editor brand="${hex}"></owe-editor>

/* Plain CSS */
.owe { --owe-brand: ${hex}; }`;

/**
 * The live playground. `text` holds the sample document and editor name of every language, because the
 * language picker can switch the editor to a language other than the page's.
 */
export function PlaygroundClient({ text }: { text: Record<Locale, PlaygroundText> }) {
  const locale = useLocale();
  const t = useTranslations("Playground");
  const names = useTranslations("LanguageSwitch");
  const id = useId();
  const theme = useSiteTheme();
  const mounted = useMounted();
  const [lang, setLang] = useState<Locale>(locale);
  const [readonly, setReadonly] = useState(false);
  const [resets, setResets] = useState(0);
  const [brand, setBrand] = useState(DEFAULT_BRAND);
  const [snap, setSnap] = useState<Snapshot>({
    html: text[locale].sample,
    json: "",
    text: "",
    words: 0,
    chars: 0,
  });
  const shown = useDeferredValue(snap);
  const editorRef = useRef<Editor | null>(null);

  // The editor reads `ui` when it starts. Later changes of the site theme or the brand go through setTheme
  // (it replaces the whole theme), so the user's content stays. The default blue is the editor's own: no brand.
  const ui = { theme, brand: brand === DEFAULT_BRAND ? undefined : brand };
  useEffect(() => {
    if (editorRef.current)
      getUI(editorRef.current)?.setTheme({
        theme,
        brand: brand === DEFAULT_BRAND ? undefined : brand,
      });
  }, [theme, brand]);

  const onCreate = useCallback((editor: Editor) => {
    editorRef.current = editor;
    setSnap({ html: editor.getHTML(), ...measure(editor) });
  }, []);
  const onChange = useCallback(
    (html: string, editor: Editor) => setSnap({ html, ...measure(editor) }),
    [],
  );

  const changeLang = (next: Locale) => {
    setLang(next);
    setSnap((s) => ({ ...s, html: text[next].sample }));
  };
  const reset = () => {
    setSnap((s) => ({ ...s, html: text[lang].sample }));
    setResets((n) => n + 1);
  };

  const codeWrap = "rounded-xl";

  return (
    <Section labelledBy={`${id}-title`}>
      <SectionHeading
        id={id}
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t.rich("description", rich)}
      />

      <div className="rounded-3xl border bg-card p-3 shadow-elevated sm:p-5">
        <div className="mb-4 grid gap-x-8 gap-y-5 rounded-2xl border bg-background/40 p-4 sm:p-5 lg:grid-cols-[auto_1fr] lg:items-start">
          <fieldset className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <legend className="sr-only">{t("options")}</legend>
            <div className="flex items-center gap-2.5">
              <label htmlFor={`${id}-lang`} className="text-small text-muted-foreground">
                {t("language")}
              </label>
              <Select value={lang} onValueChange={(value) => changeLang(value as Locale)}>
                <SelectTrigger id={`${id}-lang`} className="min-w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{names("names.en")} (LTR)</SelectItem>
                  <SelectItem value="ar">{names("names.ar")} (RTL)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex min-h-11 items-center gap-2.5">
              <input
                id={`${id}-ro`}
                type="checkbox"
                checked={readonly}
                onChange={(e) => setReadonly(e.target.checked)}
                className="size-5 rounded accent-primary"
              />
              <label htmlFor={`${id}-ro`} className="text-small text-muted-foreground">
                {t("readonly")}
              </label>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={reset}>
              <RotateCcw aria-hidden="true" className="rtl:-scale-x-100" />
              {t("reset")}
            </Button>
          </fieldset>

          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p id={`${id}-brand`} className="text-small font-bold text-foreground">
                {t("brand")}
              </p>
              <p className="text-caption text-muted-foreground">{t("brandHint")}</p>
            </div>
            <div
              role="radiogroup"
              aria-labelledby={`${id}-brand`}
              className="mt-1 flex flex-wrap items-center"
            >
              {SWATCHES.map(({ key, hex }) => (
                <label
                  key={key}
                  className="relative grid size-11 cursor-pointer place-items-center"
                >
                  <input
                    type="radio"
                    name={`${id}-brand`}
                    value={hex}
                    checked={brand === hex}
                    onChange={() => setBrand(hex)}
                    aria-label={t(`colors.${key}`)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    style={{ backgroundColor: hex, color: onColor(hex) }}
                    className="grid size-8 place-items-center rounded-full border border-foreground/25 transition-[transform,box-shadow] duration-160 ease-out peer-checked:ring-2 peer-checked:ring-foreground peer-checked:ring-offset-2 peer-checked:ring-offset-card peer-hover:scale-110 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-ring motion-reduce:peer-hover:scale-100 [&>svg]:size-4 [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100"
                  >
                    <Check />
                  </span>
                </label>
              ))}
              <label className="relative ms-1 grid size-11 cursor-pointer place-items-center">
                <span className="sr-only">{t("custom")}</span>
                <input
                  type="color"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="size-8 cursor-pointer rounded-full border border-foreground/25 bg-transparent p-0 [&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
                />
              </label>
              <output
                dir="ltr"
                data-testid="brand-value"
                className="ms-2 font-mono text-small text-muted-foreground uppercase tabular-nums"
              >
                {brand}
              </output>
            </div>
          </div>
        </div>

        <div data-testid="demo-editor" className="min-h-[26rem]" aria-busy={!mounted}>
          {mounted ? (
            <RichTextEditor
              key={`${lang}|${resets}`}
              // Each mount (language change, reset) starts from the sample. Not bound to snap.html: echoing
              // the output back lags fast typing and would reload stale HTML, moving the caret.
              value={text[lang].sample}
              onCreate={onCreate}
              onChange={onChange}
              editable={!readonly}
              language={lang}
              dir={lang === "ar" ? "rtl" : undefined}
              contentLang={lang}
              ariaLabel={text[lang].editorLabel}
              ui={ui}
            />
          ) : (
            <div
              aria-hidden="true"
              className="h-[26rem] rounded-3xl border bg-muted/40 motion-safe:animate-pulse"
            />
          )}
        </div>

        <p
          role="status"
          aria-live="off"
          className="mt-3 flex items-center gap-2 px-1 text-small text-muted-foreground tabular-nums"
        >
          <span data-testid="words">{t("words", { count: snap.words })}</span>
          <span aria-hidden="true">·</span>
          <span>{t("characters", { count: snap.chars })}</span>
        </p>

        <Tabs defaultValue="html" dir={DIR[locale]} className="mt-4 gap-3">
          <TabsList aria-label={t("outputLabel")}>
            <TabsTrigger value="html">{t("tabs.html")}</TabsTrigger>
            <TabsTrigger value="json">{t("tabs.json")}</TabsTrigger>
            <TabsTrigger value="text">{t("tabs.text")}</TabsTrigger>
            <TabsTrigger value="theme">{t("tabs.theme")}</TabsTrigger>
          </TabsList>
          <TabsContent value="html">
            <div data-testid="output" dir="ltr" className={codeWrap}>
              <CodeBlock code={formatHtml(shown.html)} lang="html" maxHeight />
            </div>
          </TabsContent>
          <TabsContent value="json">
            <div data-testid="output" dir="ltr" className={codeWrap}>
              <CodeBlock code={shown.json || "{}"} lang="json" maxHeight />
            </div>
          </TabsContent>
          <TabsContent value="text">
            <pre
              data-testid="output"
              tabIndex={0}
              aria-label={t("tabs.text")}
              className={cn(
                codeWrap,
                "max-h-72 overflow-auto border bg-code p-4 text-mono whitespace-pre-wrap text-code-foreground",
              )}
            >
              {shown.text}
            </pre>
          </TabsContent>
          <TabsContent value="theme">
            <div dir="ltr" className={codeWrap}>
              <CodeBlock code={themeSnippet(brand)} lang="tsx" maxHeight />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Section>
  );
}
