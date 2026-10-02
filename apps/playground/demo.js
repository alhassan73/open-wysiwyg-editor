/* global OpenWysiwygEditor */
// Playground — plain script against the global (CDN) build. External file: the page's CSP blocks inline scripts.
const { createEditor, StarterKit, HtmlSupport } = OpenWysiwygEditor;
const $ = (id) => document.getElementById(id);

const SAMPLE = `
<h2>Write for everyone</h2>
<p>Format with <strong>bold</strong>, <em>italic</em>, <u>underline</u>, <s>strike</s>, <code>code</code>,
H<sub>2</sub>O, E = mc<sup>2</sup>, <span style="color:#b3261e">text color</span>, <mark>highlight</mark>
and <a href="https://github.com/alhassan73/open-wysiwyg-editor">links</a>.</p>
<h3>Markdown-style shortcuts</h3>
<ol><li><p>Type <code>## </code> for a heading, <code>- </code> or <code>1. </code> for a list.</p></li>
<li><p>Type <code>**bold**</code>, <code>*italic*</code> or <code>\`code\`</code> inline.</p></li></ol>
<ul data-type="taskList"><li data-type="taskItem" data-checked="true"><p>Images ask for alternative text</p></li>
<li data-type="taskItem" data-checked="false"><p>Run the accessibility checker (coming soon)</p></li></ul>
<figure><img src="sample.svg" alt="Editor logo: a pen over three text lines" width="240" height="96">
<figcaption>Images keep their alt text and caption.</figcaption></figure>
<table><caption>Tables have a caption and header row by default</caption>
<tr><th>Keys</th><th>Action</th></tr>
<tr><td><p>Alt+F10 / Escape</p></td><td><p>Go to the toolbar / back to the text</p></td></tr>
<tr><td><p>Escape, then Tab</p></td><td><p>Leave the editor — no keyboard trap</p></td></tr></table>
<blockquote><p>Accessibility is a feature, not a follow-up.</p></blockquote>
<pre><code class="language-js">createEditor({ element: document.querySelector("#editor") });</code></pre>
<hr>
<p style="text-align:center">Centered text.</p>
<p dir="rtl">ويدعم الكتابة من اليمين إلى اليسار في نفس المستند.</p>`;

// Everything dangerous here is removed on the way in; the output tab shows what survived.
const UNSAFE = `
<p>This HTML came from an untrusted source.</p>
<img src="sample.svg" alt="Kept image (its onerror handler is gone)" onerror="window.__xss = 1">
<p><a href="javascript:alert(1)">javascript: link (made plain text)</a> and
<a href="https://example.com" onclick="alert(1)">normal link (onclick removed)</a>.</p>
<script>window.__xss = 1</script><iframe src="https://example.com"></iframe>
<p><span style="color:#0b57d0; position:fixed; background:url(javascript:alert(1))">Safe color kept, other styles dropped.</span></p>
<section class="card" data-id="7"><p>A &lt;section class="card"&gt; wrapper — kept only with “Keep extra HTML”.</p></section>
<details><summary>A &lt;details&gt; element</summary><p>Also kept only with “Keep extra HTML”.</p></details>`;

// ---- full editor ---------------------------------------------------------------------------
const opt = (id) => $(`opt-${id}`);
const MINIMAL = ["undo", "redo", "|", "bold", "italic", "link", "|", "bulletList", "orderedList", "|", "textColor", "highlight", "|", "insertDate", "help"];
const insertDate = {
  label: "Insert today's date",
  text: "Date",
  run: (editor) => {
    editor.view.dispatch(editor.state.tr.insertText(new Date().toLocaleDateString(editor.i18n.lang)));
    editor.focus();
  },
  isEnabled: (editor) => editor.isEditable,
};

const out = $("out");
let format = "html";
let editor;

function render() {
  if (!editor) return;
  out.textContent =
    format === "json" ? JSON.stringify(editor.getJSON(), null, 2) : format === "text" ? editor.getText() : editor.getHTML();
}

function mount(content = editor ? editor.getHTML() : SAMPLE) {
  editor?.destroy();
  const toolbar = opt("toolbar").value;
  editor = createEditor({
    element: $("editor"),
    content,
    language: opt("lang").value,
    editable: !opt("readonly").checked,
    extensions: [
      StarterKit.configure({ characterCount: { limit: opt("limit").checked ? 1000 : null } }),
      ...(opt("html").checked ? [HtmlSupport] : []),
    ],
    ui: {
      theme: opt("theme").value,
      toolbar: toolbar === "none" ? false : toolbar === "minimal" ? MINIMAL : undefined,
      items: { insertDate },
    },
    onUpdate: render,
  });
  window.editor = editor; // for poking around in devtools
  render();
}

for (const id of ["lang", "theme", "toolbar", "html", "limit"]) opt(id).addEventListener("change", () => mount());
opt("readonly").addEventListener("change", (e) => editor.setEditable(!e.target.checked));

const load = (html) => editor.setContent(html, { emitUpdate: true, addToHistory: true });
$("load-sample").addEventListener("click", () => load(SAMPLE));
$("load-unsafe").addEventListener("click", () => load(UNSAFE));
$("clear").addEventListener("click", () => {
  editor.clearContent({ emitUpdate: true, addToHistory: true });
  editor.focus();
});

// Roving tabindex for a horizontal widget (APG tabs/toolbar): arrows, Home and End move focus.
function roving(items, onMove) {
  for (const item of items) {
    item.addEventListener("keydown", (e) => {
      const i = items.indexOf(item);
      const step = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: items.length - 1 }[e.key];
      if (step === undefined) return;
      e.preventDefault();
      const next = items[(step + items.length) % items.length];
      for (const other of items) other.tabIndex = other === next ? 0 : -1;
      next.focus();
      onMove?.(next);
    });
  }
}

const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectTab(tab) {
  for (const t of tabs) {
    t.setAttribute("aria-selected", String(t === tab));
    t.tabIndex = t === tab ? 0 : -1;
  }
  out.setAttribute("aria-labelledby", tab.id);
  format = tab.id.replace("tab-", "");
  render();
}
for (const tab of tabs) tab.addEventListener("click", () => selectTab(tab));
roving(tabs, selectTab);

mount();

// ---- headless: the page's own buttons drive the editor ---------------------------------------
const headless = createEditor({
  element: $("headless-editor"),
  ui: false,
  ariaLabel: "Comment",
  placeholder: "Write a comment…",
  content: "<p>Built with <strong>your own</strong> buttons.</p>",
});
window.headless = headless;

const ACTIONS = {
  bold: { run: (c) => c.toggleBold(), active: () => headless.isActive("bold") },
  italic: { run: (c) => c.toggleItalic(), active: () => headless.isActive("italic") },
  bulletList: { run: (c) => c.toggleBulletList(), active: () => headless.isActive("bulletList") },
  undo: { run: (c) => c.undo(), enabled: () => headless.can().undo() },
};
const buttons = [...document.querySelectorAll("#headless-toolbar button")];
for (const button of buttons) {
  const action = ACTIONS[button.dataset.cmd];
  button.addEventListener("click", () => {
    if (button.getAttribute("aria-disabled") !== "true") action.run(headless.chain().focus()).run();
  });
}
roving(buttons);
const sync = () => {
  for (const button of buttons) {
    const action = ACTIONS[button.dataset.cmd];
    if (action.active) button.setAttribute("aria-pressed", String(action.active()));
    if (action.enabled) button.setAttribute("aria-disabled", String(!action.enabled()));
  }
};
headless.subscribe(sync);
sync();

// ---- Arabic ----------------------------------------------------------------------------------
createEditor({
  element: $("editor-ar"),
  language: "ar",
  dir: "rtl",
  contentLang: "ar",
  ui: { toolbar: ["undo", "redo", "|", "blockType", "|", "bold", "italic", "textColor", "highlight", "|", "link", "bulletList", "orderedList", "|", "align", "direction", "|", "help"] },
  content:
    "<h3>مرحبًا بك</h3><p>هذا محرر نصوص يدعم <strong>العربية</strong> بالكامل: الواجهة، والاتجاه، والاختصارات.</p><ul><li><p>اضغط Alt+0 لعرض اختصارات لوحة المفاتيح.</p></li><li><p>English words mix in correctly.</p></li></ul>",
});
