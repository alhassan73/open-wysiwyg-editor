import { useCallback, useId, useState } from "react";
import { RichTextEditor, type Editor } from "@open-wysiwyg-editor/react";
import { Tabs } from "../components/Tabs";
import { useResolvedTheme } from "../theme";

const SAMPLE_EN = `<h2>Write for everyone</h2>
<p>Format with <strong>bold</strong>, <em>italic</em>, <u>underline</u>, <s>strike</s>, <code>code</code>, H<sub>2</sub>O, E = mc<sup>2</sup>, <mark>highlight</mark> and <a href="https://github.com/alhassan73/open-wysiwyg-editor">links</a>.</p>
<h3>Markdown-style shortcuts</h3>
<ol><li><p>Type <code>## </code> for a heading, <code>- </code> or <code>1. </code> for a list.</p></li><li><p>Type <code>**bold**</code> or <code>*italic*</code> inline.</p></li></ol>
<ul data-type="taskList"><li data-type="taskItem" data-checked="true"><p>Images ask for alternative text</p></li><li data-type="taskItem" data-checked="false"><p>Press Alt+0 for every keyboard shortcut</p></li></ul>
<blockquote><p>Accessibility is a feature, not a follow-up.</p></blockquote>
<table><caption>Tables have a caption and header row by default</caption><tr><th>Keys</th><th>Action</th></tr><tr><td><p>Alt+F10 / Escape</p></td><td><p>Go to the toolbar / back to the text</p></td></tr><tr><td><p>Escape, then Tab</p></td><td><p>Leave the editor, no keyboard trap</p></td></tr></table>
<p dir="rtl">ويدعم الكتابة من اليمين إلى اليسار في نفس المستند.</p>`;

const SAMPLE_AR = `<h2>اكتب لكل الناس</h2>
<p>هذا محرر نصوص يدعم <strong>العربية</strong> بالكامل: الواجهة، والاتجاه، والاختصارات. يمكنك استخدام <em>الخط المائل</em> و<u>التسطير</u> و<mark>التمييز</mark> و<a href="https://github.com/alhassan73/open-wysiwyg-editor">الروابط</a>.</p>
<ul><li><p>اضغط Alt+0 لعرض اختصارات لوحة المفاتيح.</p></li><li><p>English words mix in correctly.</p></li></ul>
<blockquote><p>إمكانية الوصول ميزة أساسية، وليست إضافة لاحقة.</p></blockquote>
<p dir="ltr">And Latin text keeps its own direction in the same document.</p>`;

const MINIMAL = ["undo", "redo", "|", "bold", "italic", "link", "|", "bulletList", "orderedList", "|", "textColor", "highlight", "|", "help"];
const BASIC = ["bold", "italic", "underline", "|", "link", "|", "bulletList", "orderedList"];

type Lang = "en" | "ar";
type ThemeOpt = "site" | "light" | "dark" | "auto";
type ToolbarOpt = "full" | "minimal" | "basic" | "none";

interface Snapshot {
  html: string;
  json: string;
  text: string;
  words: number;
  chars: number;
}

const measure = (editor: Editor): Omit<Snapshot, "html"> => {
  const text = editor.getText();
  return {
    json: JSON.stringify(editor.getJSON(), null, 2),
    text,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    chars: [...text.replace(/\s/g, "")].length,
  };
};

export function Playground() {
  const id = useId();
  const site = useResolvedTheme();
  const [lang, setLang] = useState<Lang>("en");
  const [theme, setTheme] = useState<ThemeOpt>("site");
  const [toolbar, setToolbar] = useState<ToolbarOpt>("full");
  const [readonly, setReadonly] = useState(false);
  const [reset, setReset] = useState(0);
  const [snap, setSnap] = useState<Snapshot>({ html: SAMPLE_EN, json: "", text: "", words: 0, chars: 0 });

  const editorTheme = theme === "site" ? site : theme;
  const ui = {
    theme: editorTheme,
    ...(toolbar === "minimal" ? { toolbar: MINIMAL } : toolbar === "basic" ? { toolbar: BASIC } : toolbar === "none" ? { toolbar: false as const } : {}),
  };

  const update = useCallback((html: string, editor: Editor) => setSnap({ html, ...measure(editor) }), []);

  const changeLang = (next: Lang) => {
    setLang(next);
    setSnap((s) => ({ ...s, html: next === "ar" ? SAMPLE_AR : SAMPLE_EN }));
  };

  const output = (value: string) => (
    <pre className="code-pre out" tabIndex={0} aria-label="Editor output" data-testid="output">
      <code>{value}</code>
    </pre>
  );

  return (
    <div className="playground">
      <fieldset className="controls">
        <legend>Playground options</legend>
        <div className="control">
          <label htmlFor={`${id}-lang`}>Interface language</label>
          <select id={`${id}-lang`} value={lang} onChange={(e) => changeLang(e.target.value as Lang)}>
            <option value="en">English (LTR)</option>
            <option value="ar">العربية (RTL)</option>
          </select>
        </div>
        <div className="control">
          <label htmlFor={`${id}-theme`}>Editor theme</label>
          <select id={`${id}-theme`} value={theme} onChange={(e) => setTheme(e.target.value as ThemeOpt)}>
            <option value="site">Match site</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto (system)</option>
          </select>
        </div>
        <div className="control">
          <label htmlFor={`${id}-toolbar`}>Toolbar</label>
          <select id={`${id}-toolbar`} value={toolbar} onChange={(e) => setToolbar(e.target.value as ToolbarOpt)}>
            <option value="full">Full (default)</option>
            <option value="minimal">Minimal</option>
            <option value="basic">Basic formatting</option>
            <option value="none">No toolbar</option>
          </select>
        </div>
        <div className="control control-check">
          <input id={`${id}-ro`} type="checkbox" checked={readonly} onChange={(e) => setReadonly(e.target.checked)} />
          <label htmlFor={`${id}-ro`}>Read-only</label>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => {
            setSnap((s) => ({ ...s, html: lang === "ar" ? SAMPLE_AR : SAMPLE_EN }));
            setReset((n) => n + 1);
          }}
        >
          Reset sample
        </button>
      </fieldset>

      <div className="demo-editor" data-testid="demo-editor">
        <RichTextEditor
          key={`${lang}|${editorTheme}|${toolbar}|${reset}`}
          value={snap.html}
          onChange={update}
          onCreate={(editor) => setSnap((s) => ({ ...s, ...measure(editor) }))}
          editable={!readonly}
          language={lang}
          dir={lang === "ar" ? "rtl" : undefined}
          contentLang={lang}
          ariaLabel={lang === "ar" ? "محرر النص" : "Playground editor"}
          ui={ui}
        />
      </div>

      <div className="demo-meta">
        <p className="counts" role="status" aria-live="off">
          <span data-testid="words">{snap.words} words</span>
          <span aria-hidden="true">·</span>
          <span>{snap.chars} characters</span>
        </p>
      </div>

      <Tabs
        label="Output format"
        className="out-tabs"
        tabs={[
          { id: "html", label: "HTML", panel: output(snap.html) },
          { id: "json", label: "JSON", panel: output(snap.json) },
          { id: "text", label: "Text", panel: output(snap.text) },
        ]}
      />
    </div>
  );
}
