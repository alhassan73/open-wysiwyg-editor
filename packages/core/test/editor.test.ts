import { describe, expect, it, vi } from "vitest";
import { createEditor, createI18n, builtInLanguages, StarterKit, defineExtension } from "../src";
import { cursorAfter, make, selectText } from "./helpers";

// Most output includes dir="auto" (TextDirection.autoDetect); strip it where it's not under test.
const plain = (html: string) => html.replace(/ dir="auto"/g, "");

describe("lifecycle & mounting", () => {
  it("mounts into an element, exposes an accessible textbox and cleans up on destroy", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const editor = createEditor({ element: host, extensions: [StarterKit], content: "<p>Hi</p>" });
    const box = editor.view.dom as HTMLElement;
    expect(host.contains(editor.root)).toBe(true);
    expect(box.getAttribute("role")).toBe("textbox");
    expect(box.getAttribute("aria-multiline")).toBe("true");
    expect(box.getAttribute("aria-label")).toBe("Rich text editor");
    expect(box.getAttribute("contenteditable")).toBe("true");
    expect(editor.root.querySelector('[role="status"]')).not.toBeNull();
    expect(editor.root.querySelector('[role="alert"]')).not.toBeNull();
    const onDestroy = vi.fn();
    editor.on("destroy", onDestroy);
    editor.destroy();
    expect(onDestroy).toHaveBeenCalledOnce();
    expect(host.contains(editor.root)).toBe(false);
    expect(editor.isDestroyed).toBe(true);
    editor.destroy(); // idempotent
  });

  it("uses an element's existing (sanitized) HTML as initial content", () => {
    const host = document.createElement("div");
    host.append(Object.assign(document.createElement("h2"), { textContent: "Title" }));
    document.body.append(host);
    const editor = createEditor({ element: host, extensions: [StarterKit] });
    expect(plain(editor.getHTML())).toBe("<h2>Title</h2>");
    editor.destroy();
  });

  it("enhances a <textarea>: hides it, labels from <label>, keeps the value in sync", async () => {
    const form = document.createElement("form");
    const label = Object.assign(document.createElement("label"), { htmlFor: "body", textContent: "Article" });
    const textarea = Object.assign(document.createElement("textarea"), { id: "body", value: "<p>One</p>" });
    form.append(label, textarea);
    document.body.append(form);
    const editor = createEditor({ element: textarea, extensions: [StarterKit] });
    expect(textarea.hidden).toBe(true);
    expect((editor.view.dom as HTMLElement).getAttribute("aria-labelledby")).toBe(label.id);
    editor.commands.focus("end");
    editor.view.dispatch(editor.state.tr.insertText(" two"));
    form.dispatchEvent(new Event("submit", { cancelable: true }));
    expect(plain(textarea.value)).toBe("<p>One two</p>");
    editor.destroy();
    expect(textarea.hidden).toBe(false);
  });

  it("throws a helpful error when called without a DOM (SSR)", () => {
    vi.stubGlobal("document", undefined);
    try {
      expect(() => createEditor({ extensions: [StarterKit] })).toThrow(/needs a browser DOM/);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("supports a detached editor (no element)", () => {
    const editor = createEditor({ extensions: [StarterKit], content: "<p>x</p>" });
    expect(editor.root.isConnected).toBe(false);
    document.body.append(editor.root);
    expect(plain(editor.getHTML())).toBe("<p>x</p>");
    editor.destroy();
  });
});

describe("content I/O", () => {
  it("round-trips a rich document through HTML and JSON without losing accessibility info", () => {
    const html = [
      `<h2>Heading</h2>`,
      `<p><strong>b</strong> <em>i</em> <u>u</u> <s>s</s> <code>c</code> x<sub>2</sub> y<sup>3</sup></p>`,
      `<p><a href="https://example.com" title="Example">link</a></p>`,
      `<blockquote><p>quote</p></blockquote>`,
      `<ul><li><p>one</p></li><li><p>two</p></li></ul>`,
      `<ol start="3"><li><p>three</p></li></ol>`,
      `<pre><code class="language-ts">const a = 1;</code></pre>`,
      `<hr>`,
      `<figure><img src="https://example.com/a.png" alt="A red bicycle" width="320" height="200" loading="lazy" decoding="async"><figcaption>My bike</figcaption></figure>`,
      `<img src="https://example.com/d.png" alt="" loading="lazy" decoding="async">`,
      `<table><caption>Sales</caption><tbody><tr><th scope="col"><p>Q</p></th><th scope="col"><p>Total</p></th></tr><tr><td><p>1</p></td><td><p>9</p></td></tr></tbody></table>`,
    ].join("");
    const editor = make({ content: html });
    const out = plain(editor.getHTML());
    expect(out).toBe(html);
    const again = make({ content: editor.getJSON() });
    expect(plain(again.getHTML())).toBe(html);
  });

  it("preserves dir on blocks and renders dir=auto only for non-empty blocks", () => {
    const editor = make({ content: `<p dir="rtl">مرحبا</p><p>hello</p><p></p>` });
    expect(editor.getHTML()).toBe(`<p dir="rtl">مرحبا</p><p dir="auto">hello</p><p></p>`);
  });

  it("maps physical alignment to logical using the surrounding direction", () => {
    const editor = make({
      content: `<p style="text-align:left">a</p><div dir="rtl"><p style="text-align:right">b</p></div><p style="text-align:center">c</p>`,
    });
    const json = editor.getJSON();
    const aligns = json.content!.map((n) => n.attrs?.textAlign ?? null);
    expect(aligns).toEqual([null, null, "center"]);
  });

  it("uses classes (not inline styles) for alignment in the live view — strict-CSP safe", () => {
    const editor = make({ content: `<p style="text-align:center">c</p>` });
    const p = (editor.view.dom as HTMLElement).querySelector("p")!;
    expect(p.getAttribute("style")).toBeNull();
    expect(p.className).toContain("owe-align-center");
    expect(editor.getHTML()).toContain(`style="text-align: center"`);
  });

  it("cleans Google Docs bold wrappers", () => {
    const editor = make({
      content: `<b style="font-weight:normal" id="docs-internal-guid-1"><p><span style="font-weight:700">Bold</span> normal</p></b>`,
    });
    expect(plain(editor.getHTML())).toBe(`<p><strong>Bold</strong> normal</p>`);
  });

  it("collapses heading levels that aren't enabled to the nearest allowed level", () => {
    const editor = make({
      extensions: [StarterKit.configure({ heading: { levels: [2, 3] } })],
      content: `<h1>a</h1><h4>b</h4>`,
    });
    expect(plain(editor.getHTML())).toBe(`<h2>a</h2><h3>b</h3>`);
  });

  it("getText joins blocks and renders hard breaks as newlines", () => {
    const editor = make({ content: `<p>a<br>b</p><p>c</p>` });
    expect(editor.getText()).toBe("a\nb\n\nc");
  });

  it("setContent does not emit update by default, and is not undoable by default", () => {
    const editor = make({ content: "<p>a</p>" });
    const onUpdate = vi.fn();
    editor.on("update", onUpdate);
    editor.setContent("<p>b</p>");
    expect(onUpdate).not.toHaveBeenCalled();
    expect(editor.can().undo()).toBe(false);
    editor.setContent("<p>c</p>", { emitUpdate: true, addToHistory: true });
    expect(onUpdate).toHaveBeenCalledOnce();
    expect(editor.can().undo()).toBe(true);
  });

  it("isEmpty reflects an empty document", () => {
    const editor = make();
    expect(editor.isEmpty).toBe(true);
    editor.setContent("<p>x</p>");
    expect(editor.isEmpty).toBe(false);
  });
});

describe("commands", () => {
  it("toggles marks and reports active state", () => {
    const editor = make({ content: "<p>hello world</p>" });
    selectText(editor, "world");
    expect(editor.isActive("bold")).toBe(false);
    editor.commands.toggleBold();
    expect(editor.isActive("bold")).toBe(true);
    expect(plain(editor.getHTML())).toBe("<p>hello <strong>world</strong></p>");
    editor.commands.toggleBold();
    expect(plain(editor.getHTML())).toBe("<p>hello world</p>");
  });

  it("chain() applies several commands as one undo step", () => {
    const editor = make({ content: "<p>hello</p>" });
    selectText(editor, "hello");
    expect(editor.chain().toggleBold().toggleItalic().setHeading(2).run()).toBe(true);
    expect(plain(editor.getHTML())).toBe("<h2><strong><em>hello</em></strong></h2>");
    editor.commands.undo();
    expect(plain(editor.getHTML())).toBe("<p>hello</p>");
  });

  it("chain() aborts without changes if any command fails", () => {
    const editor = make({ content: "<p>hello</p>" });
    selectText(editor, "hello");
    expect(editor.chain().toggleBold().setHeading(99).run()).toBe(false);
    expect(plain(editor.getHTML())).toBe("<p>hello</p>");
  });

  it("can() dry-runs without changing the document", () => {
    const editor = make({ content: "<p>hello</p>" });
    expect(editor.can().toggleHeading(2)).toBe(true);
    expect(editor.can().deleteTable()).toBe(false);
    expect(plain(editor.getHTML())).toBe("<p>hello</p>");
  });

  it("toggles and converts lists", () => {
    const editor = make({ content: "<p>item</p>" });
    editor.commands.toggleBulletList();
    expect(plain(editor.getHTML())).toBe("<ul><li><p>item</p></li></ul>");
    editor.commands.toggleOrderedList();
    expect(plain(editor.getHTML())).toBe("<ol><li><p>item</p></li></ol>");
    editor.commands.toggleTaskList();
    expect(plain(editor.getHTML())).toContain(`<ul data-type="taskList"><li data-type="taskItem" data-checked="false">`);
    editor.commands.toggleTaskList();
    expect(plain(editor.getHTML())).toBe("<p>item</p>");
  });

  it("task checkboxes in output are labelled and reflect state", () => {
    const editor = make({
      content: `<ul data-type="taskList"><li data-type="taskItem" data-checked="true"><p>done</p></li></ul>`,
    });
    expect(plain(editor.getHTML())).toBe(
      `<ul data-type="taskList"><li data-type="taskItem" data-checked="true"><input type="checkbox" disabled="" checked="" aria-label="Task"><div><p>done</p></div></li></ul>`,
    );
    const box = (editor.view.dom as HTMLElement).querySelector("input[type=checkbox]")!;
    expect(box.getAttribute("aria-label")).toBe("Mark task as done");
  });

  it("toggles blockquote and code block", () => {
    const editor = make({ content: "<p>q</p>" });
    editor.commands.toggleBlockquote();
    expect(plain(editor.getHTML())).toBe("<blockquote><p>q</p></blockquote>");
    editor.commands.toggleBlockquote();
    expect(plain(editor.getHTML())).toBe("<p>q</p>");
    editor.commands.toggleCodeBlock({ language: "js" });
    expect(editor.getHTML()).toBe(`<pre><code class="language-js">q</code></pre>`);
    editor.commands.toggleCodeBlock();
    expect(plain(editor.getHTML())).toBe("<p>q</p>");
  });

  it("rejects suspicious code block languages", () => {
    const editor = make({ content: "<p>q</p>" });
    editor.commands.toggleCodeBlock({ language: `x" onmouseover="alert(1)` });
    expect(editor.getHTML()).toBe(`<pre><code>q</code></pre>`);
  });

  it("inserts a table with a header row (accessible default) and a caption", () => {
    const editor = make({ content: "<p></p>" });
    editor.commands.insertTable({ rows: 2, cols: 2, caption: "Prices" });
    const html = plain(editor.getHTML());
    expect(html.startsWith(`<table><caption>Prices</caption><tbody><tr><th scope="col">`)).toBe(true);
    expect(editor.isActive("table")).toBe(true);
    editor.commands.toggleHeaderColumn();
    // first-column header cells below the header row get scope="row"
    expect(plain(editor.getHTML())).toContain(`<tr><th scope="row"><p></p></th><td>`);
  });

  it("sets and edits links in place", () => {
    const editor = make({ content: "<p>go here now</p>" });
    selectText(editor, "here");
    editor.commands.setLink({ href: "https://a.example" });
    cursorAfter(editor, "he");
    expect(editor.isActive("link")).toBe(true);
    expect(editor.getAttributes("link").href).toBe("https://a.example");
    editor.commands.setLink({ href: "https://b.example", text: "there" });
    expect(plain(editor.getHTML())).toBe(`<p>go <a href="https://b.example">there</a> now</p>`);
    cursorAfter(editor, "th");
    editor.commands.unsetLink();
    expect(plain(editor.getHTML())).toBe(`<p>go there now</p>`);
  });

  it("inserts an image and treats alt=null vs alt='' distinctly", () => {
    const editor = make({ content: "<p></p>" });
    editor.commands.setImage({ src: "https://x.example/a.png", alt: null });
    expect(editor.getHTML()).toContain(`<img src="https://x.example/a.png" loading="lazy"`);
    editor.setContent("<p></p>");
    editor.commands.setImage({ src: "https://x.example/a.png", alt: "" });
    expect(editor.getHTML()).toContain(`alt=""`);
  });

  it("sets alignment and direction on selected blocks", () => {
    const editor = make({ content: "<p>a</p><p>b</p>" });
    editor.commands.selectAll();
    editor.commands.setTextAlign("center");
    editor.commands.setTextDirection("rtl");
    expect(editor.getHTML()).toBe(
      `<p style="text-align: center" dir="rtl">a</p><p style="text-align: center" dir="rtl">b</p>`,
    );
    editor.commands.unsetTextDirection();
    editor.commands.unsetTextAlign();
    expect(editor.getHTML()).toBe(`<p dir="auto">a</p><p dir="auto">b</p>`);
  });

  it("clearNodes lifts lists/quotes and turns blocks into paragraphs; unsetAllMarks clears marks", () => {
    const editor = make({ content: "<blockquote><h2><strong>t</strong></h2></blockquote><ul><li><p>i</p></li></ul>" });
    editor.commands.selectAll();
    editor.chain().clearNodes().unsetAllMarks().run();
    expect(plain(editor.getHTML())).toBe("<p>t</p><p>i</p>");
  });
});

describe("input rules (markdown shortcuts)", () => {
  function type(editor: ReturnType<typeof make>, text: string) {
    for (const ch of text) {
      const { from, to } = editor.state.selection;
      const handled = editor.view.someProp("handleTextInput", (f) => f(editor.view, from, to, ch, () => editor.state.tr.insertText(ch, from, to)));
      if (!handled) editor.view.dispatch(editor.state.tr.insertText(ch, from, to));
    }
  }

  it.each([
    ["## ", "<h2></h2>"],
    ["> ", "<blockquote><p></p></blockquote>"],
    ["- ", "<ul><li><p></p></li></ul>"],
    ["1. ", "<ol><li><p></p></li></ol>"],
    ["``` ", "<pre><code></code></pre>"],
  ])("%j", (typed, html) => {
    const editor = make({ content: "<p></p>" });
    editor.commands.focus("start");
    type(editor, typed);
    expect(plain(editor.getHTML())).toBe(html);
  });

  it("formats **bold** and *italic* inline", () => {
    const editor = make({ content: "<p></p>" });
    editor.commands.focus("start");
    type(editor, "a **b** *c* `d`");
    expect(plain(editor.getHTML())).toBe("<p>a <strong>b</strong> <em>c</em> <code>d</code></p>");
  });

  it("can be disabled (WCAG 2.1.4 / user preference)", () => {
    const editor = make({ content: "<p></p>", inputRules: false });
    editor.commands.focus("start");
    type(editor, "## ");
    expect(plain(editor.getHTML())).toBe("<p>## </p>");
  });
});

describe("keyboard & accessibility", () => {
  it("Escape then Tab is not intercepted by the editor (no keyboard trap)", () => {
    const editor = make({ content: "<ul><li><p>a</p></li><li><p>b</p></li></ul>" });
    cursorAfter(editor, "b");
    const dom = editor.view.dom as HTMLElement;
    dom.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    const tab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    dom.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(false);
    expect(plain(editor.getHTML())).toBe("<ul><li><p>a</p></li><li><p>b</p></li></ul>");
  });

  it("Tab indents inside lists but is released at the first item", () => {
    const editor = make({ content: "<ul><li><p>a</p></li><li><p>b</p></li></ul>" });
    cursorAfter(editor, "a");
    const first = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    editor.view.dom.dispatchEvent(first);
    expect(first.defaultPrevented).toBe(false); // can't sink the first item → focus may leave
    cursorAfter(editor, "b");
    const second = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    editor.view.dom.dispatchEvent(second);
    expect(second.defaultPrevented).toBe(true);
    expect(plain(editor.getHTML())).toBe("<ul><li><p>a</p><ul><li><p>b</p></li></ul></li></ul>");
  });

  it("reflects read-only state in ARIA and contenteditable", () => {
    const editor = make({ content: "<p>x</p>", editable: false });
    const dom = editor.view.dom as HTMLElement;
    expect(dom.getAttribute("aria-readonly")).toBe("true");
    expect(dom.getAttribute("contenteditable")).toBe("false");
    editor.setEditable(true);
    expect(dom.getAttribute("aria-readonly")).toBe("false");
    expect(dom.getAttribute("contenteditable")).toBe("true");
  });

  it("shows a placeholder decoration and aria-placeholder on an empty doc", () => {
    const editor = make({ placeholder: "Write here" });
    const dom = editor.view.dom as HTMLElement;
    expect(dom.getAttribute("aria-placeholder")).toBe("Write here");
    expect(dom.querySelector(".owe-placeholder")?.getAttribute("data-placeholder")).toBe("Write here");
    editor.setContent("<p>x</p>");
    expect(dom.querySelector(".owe-placeholder")).toBeNull();
  });

  it("announces through the polite live region", async () => {
    const editor = make();
    editor.announce("Link inserted");
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(editor.root.querySelector('[role="status"]')!.textContent).toBe("Link inserted");
  });

  it("sets content dir/lang and UI lang/dir", () => {
    const editor = make({ language: "ar", dir: "rtl", contentLang: "ar-EG" });
    expect(editor.root.getAttribute("dir")).toBe("rtl");
    expect(editor.root.getAttribute("lang")).toBe("ar");
    const dom = editor.view.dom as HTMLElement;
    expect(dom.getAttribute("dir")).toBe("rtl");
    expect(dom.getAttribute("lang")).toBe("ar-EG");
    expect(dom.getAttribute("aria-label")).toBe("محرر النصوص");
  });
});

describe("i18n", () => {
  it("selects Arabic plural forms (zero/one/two/few/many/other)", () => {
    const { t } = createI18n(builtInLanguages[1]!);
    expect(t("wordCount", { n: 0 })).toBe("لا كلمات");
    expect(t("wordCount", { n: 1 })).toBe("كلمة واحدة");
    expect(t("wordCount", { n: 2 })).toBe("كلمتان");
    expect(t("wordCount", { n: 5 })).toMatch(/كلمات$/);
    expect(t("wordCount", { n: 11 })).toMatch(/كلمة$/);
  });

  it("falls back to English labels and accepts overrides", () => {
    const { t } = createI18n({ code: "fr", name: "Français", labels: { bold: "Gras" } }, { italic: "Italique" });
    expect(t("bold")).toBe("Gras");
    expect(t("italic")).toBe("Italique");
    expect(t("underline")).toBe("Underline");
    expect(t("heading", { level: 2 })).toBe("Heading 2");
  });
});

describe("extensions", () => {
  it("supports custom extensions with commands, keymaps and options", () => {
    const Shout = defineExtension<{ suffix: string }>({
      name: "shout",
      defaultOptions: { suffix: "!" },
      commands: ({ options }) => ({
        shout: () => (state, dispatch) => {
          if (dispatch) dispatch(state.tr.insertText(options.suffix));
          return true;
        },
      }),
    });
    const editor = make({ extensions: [StarterKit, Shout.configure({ suffix: "!!" })], content: "<p>hi</p>" });
    editor.commands.focus("end");
    (editor.commands as unknown as Record<string, () => boolean>).shout!();
    expect(plain(editor.getHTML())).toBe("<p>hi!!</p>");
  });

  it("lets StarterKit parts be disabled", () => {
    const editor = make({ extensions: [StarterKit.configure({ table: false, image: false })], content: "<table><tr><td>a</td></tr></table>" });
    expect(editor.schema.nodes.table).toBeUndefined();
    expect(plain(editor.getHTML())).toBe("<p>a</p>");
  });

  it("isolates listener errors", () => {
    const editor = make({ content: "<p>a</p>" });
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const ok = vi.fn();
    editor.on("update", () => {
      throw new Error("boom");
    });
    editor.on("update", ok);
    editor.commands.focus("end");
    editor.view.dispatch(editor.state.tr.insertText("b"));
    expect(ok).toHaveBeenCalled();
    err.mockRestore();
  });
});
