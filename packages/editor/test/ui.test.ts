import { afterEach, describe, expect, it } from "vitest";
import { createEditor, getSearchState, getUI, type Editor, type EditorOptions } from "../src";
import { selectText } from "./helpers";

const live: Editor[] = [];
function ui(options: EditorOptions = {}): Editor {
  const element = document.createElement("div");
  document.body.append(element);
  const editor = createEditor({ element, ...options });
  live.push(editor);
  return editor;
}
afterEach(() => {
  while (live.length) live.pop()!.destroy();
  document.body.replaceChildren();
});

const key = (el: Element, k: string, init: KeyboardEventInit = {}) => {
  const e = new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init });
  el.dispatchEvent(e);
  return e;
};
const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));
const toolbarOf = (editor: Editor) => editor.root.querySelector<HTMLElement>('[role="toolbar"]')!;
const button = (editor: Editor, name: string) =>
  [...editor.root.querySelectorAll<HTMLElement>(".owe-toolbar-item")].find((b) => b.getAttribute("aria-label") === name)!;

describe("toolbar (APG toolbar pattern)", () => {
  it("renders a labelled toolbar with a single tab stop", () => {
    const editor = ui();
    const tb = toolbarOf(editor);
    expect(tb.getAttribute("aria-label")).toBe("Formatting");
    const items = [...tb.querySelectorAll<HTMLElement>(".owe-toolbar-item")];
    expect(items.length).toBeGreaterThan(15);
    expect(items.filter((i) => i.tabIndex === 0)).toHaveLength(1);
    for (const item of items) expect(item.getAttribute("aria-label")).toBeTruthy();
  });

  it("moves with arrow keys (mirrored in RTL), Home/End, and wraps", () => {
    const editor = ui();
    const items = [...toolbarOf(editor).querySelectorAll<HTMLElement>(".owe-toolbar-item")];
    items[0]!.focus();
    key(items[0]!, "ArrowRight");
    expect(document.activeElement).toBe(items[1]);
    key(items[1]!, "End");
    expect(document.activeElement).toBe(items[items.length - 1]);
    key(items[items.length - 1]!, "ArrowRight");
    expect(document.activeElement).toBe(items[0]);
    expect(items[0]!.tabIndex).toBe(0);

    const rtl = ui({ language: "ar" });
    const rItems = [...toolbarOf(rtl).querySelectorAll<HTMLElement>(".owe-toolbar-item")];
    rItems[1]!.focus();
    key(rItems[1]!, "ArrowRight"); // visually "back" in RTL
    expect(document.activeElement).toBe(rItems[0]);
  });

  it("Alt+F10 moves focus to the toolbar and Escape returns to the text", () => {
    const editor = ui({ content: "<p>hello</p>" });
    editor.focus("end");
    key(editor.view.dom, "F10", { altKey: true });
    expect(toolbarOf(editor).contains(document.activeElement)).toBe(true);
    key(document.activeElement!, "Escape");
    expect(editor.view.dom.contains(document.activeElement) || document.activeElement === editor.view.dom).toBe(true);
  });

  it("reflects formatting state with aria-pressed and runs commands", async () => {
    const editor = ui({ content: "<p>hello world</p>" });
    selectText(editor, "world");
    const bold = button(editor, "Bold");
    expect(bold.getAttribute("aria-pressed")).toBe("false");
    expect(bold.getAttribute("aria-keyshortcuts")).toMatch(/^(Control|Meta)\+B$/);
    bold.click();
    await frame();
    expect(bold.getAttribute("aria-pressed")).toBe("true");
    expect(editor.getHTML()).toContain("<strong>world</strong>");
  });

  it("uses aria-disabled (not disabled) so items stay discoverable", async () => {
    const editor = ui({ content: "<p>x</p>" });
    await frame();
    const undo = button(editor, "Undo");
    expect(undo.getAttribute("aria-disabled")).toBe("true");
    expect(undo.hasAttribute("disabled")).toBe(false);
  });

  it("disables everything in read-only mode", async () => {
    const editor = ui({ content: "<p>x</p>", editable: false });
    await frame();
    expect(button(editor, "Bold").getAttribute("aria-disabled")).toBe("true");
  });

  it("supports custom layouts and custom items", async () => {
    let ran = 0;
    const editor = ui({
      ui: {
        toolbar: ["bold", "|", "|", "shout", "|", "doesNotExist"],
        items: { shout: { label: "Shout", icon: "bold", run: () => ran++ } },
      },
    });
    const items = toolbarOf(editor).querySelectorAll(".owe-toolbar-item");
    expect(items).toHaveLength(2);
    expect(toolbarOf(editor).querySelectorAll(".owe-separator")).toHaveLength(1); // collapsed, no trailing
    (items[1] as HTMLElement).click();
    expect(ran).toBe(1);
  });

  it("can be fully headless", () => {
    const editor = ui({ ui: false });
    expect(editor.root.querySelector('[role="toolbar"]')).toBeNull();
    expect(getUI(editor)).toBeUndefined();
  });
});

describe("menu buttons (APG menu button pattern)", () => {
  it("opens with ArrowDown, focuses the checked radio item, Escape returns focus", () => {
    const editor = ui({ content: "<h2>Title</h2>" });
    editor.focus("end");
    const trigger = toolbarOf(editor).querySelector<HTMLElement>('[aria-haspopup="menu"]')!;
    expect(trigger.getAttribute("aria-label")).toBe("Text style: Heading 2"); // visible text in name
    trigger.focus();
    key(trigger, "ArrowDown");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    const menu = document.getElementById(trigger.getAttribute("aria-controls")!)!;
    expect(menu.getAttribute("role")).toBe("menu");
    expect(document.activeElement?.getAttribute("role")).toBe("menuitemradio");
    expect(document.activeElement?.getAttribute("aria-checked")).toBe("true");
    expect(document.activeElement?.textContent).toContain("Heading 2");
    key(document.activeElement!, "Escape");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });

  it("activates items with Enter and applies the command", () => {
    const editor = ui({ content: "<p>Title</p>" });
    editor.focus("end");
    const trigger = toolbarOf(editor).querySelector<HTMLElement>('[aria-haspopup="menu"]')!;
    trigger.focus();
    key(trigger, "ArrowDown");
    key(document.activeElement!, "ArrowDown"); // Heading 1
    key(document.activeElement!, "Enter");
    expect(editor.getHTML()).toBe(`<h1 dir="auto">Title</h1>`);
    expect(document.activeElement).toBe(trigger);
  });
});

describe("dialogs", () => {
  it("link dialog validates the URL and inserts a safe link", () => {
    const editor = ui({ content: "<p>see docs</p>" });
    selectText(editor, "docs");
    getUI(editor)!.openDialog("link");
    const dialog = editor.root.querySelector("dialog")!;
    expect(dialog.getAttribute("aria-labelledby")).toBeTruthy();
    const url = dialog.querySelector<HTMLInputElement>("input")!;
    url.value = "javascript:alert(1)";
    dialog.querySelector("form")!.dispatchEvent(new Event("submit", { cancelable: true }));
    expect(url.getAttribute("aria-invalid")).toBe("true");
    expect(dialog.querySelector(".owe-field-error")!.textContent).toMatch(/not allowed/);
    url.value = "example.com/guide";
    dialog.querySelector("form")!.dispatchEvent(new Event("submit", { cancelable: true }));
    expect(editor.root.querySelector("dialog")).toBeNull();
    expect(editor.getHTML()).toBe(`<p dir="auto">see <a href="https://example.com/guide">docs</a></p>`);
  });

  it("image dialog requires alt text unless the image is decorative (ATAG B.2.3)", () => {
    const editor = ui({ content: "<p></p>" });
    getUI(editor)!.openDialog("image");
    const dialog = editor.root.querySelector("dialog")!;
    const [url] = dialog.querySelectorAll<HTMLInputElement>('input[type="text"]');
    url!.value = "https://example.com/cat.png";
    const form = dialog.querySelector("form")!;
    form.dispatchEvent(new Event("submit", { cancelable: true }));
    const alt = dialog.querySelector("textarea")!;
    expect(alt.getAttribute("aria-invalid")).toBe("true");
    const decorative = dialog.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    decorative.checked = true;
    decorative.dispatchEvent(new Event("change"));
    expect(alt.disabled).toBe(true);
    form.dispatchEvent(new Event("submit", { cancelable: true }));
    expect(editor.getHTML()).toContain(`<img src="https://example.com/cat.png" alt=""`);
  });

  it("table dialog inserts a table with a header row and caption", () => {
    const editor = ui({ content: "<p></p>" });
    getUI(editor)!.openDialog("table");
    const dialog = editor.root.querySelector("dialog")!;
    const [rows, cols] = dialog.querySelectorAll<HTMLInputElement>('input[type="number"]');
    rows!.value = "2";
    cols!.value = "4";
    dialog.querySelector<HTMLInputElement>('input[type="text"]')!.value = "Schedule";
    dialog.querySelector("form")!.dispatchEvent(new Event("submit", { cancelable: true }));
    const html = editor.getHTML();
    expect(html).toContain("<caption>Schedule</caption>");
    expect(html.match(/<th scope="col">/g)).toHaveLength(4);
  });

  it("help dialog lists shortcuts in accessible tables", () => {
    const editor = ui();
    key(editor.view.dom, "0", { altKey: true, code: "Digit0" });
    const dialog = editor.root.querySelector("dialog")!;
    expect(dialog.querySelectorAll("table caption").length).toBeGreaterThanOrEqual(3);
    expect(dialog.textContent).toContain("Bold");
    expect(dialog.querySelectorAll('th[scope="col"]').length).toBeGreaterThan(0);
  });
});

describe("find & replace", () => {
  it("finds, announces counts, replaces and closes back to the text", async () => {
    const editor = ui({ content: "<p>cat dog cat</p><p>Cat</p>" });
    getUI(editor)!.openFind();
    const bar = editor.root.querySelector<HTMLElement>(".owe-findbar")!;
    expect(bar.hidden).toBe(false);
    expect(bar.getAttribute("role")).toBe("dialog");
    const [find, replace] = bar.querySelectorAll<HTMLInputElement>("input.owe-input");
    find!.value = "cat";
    find!.dispatchEvent(new Event("input"));
    expect(bar.querySelector(".owe-find-status")!.textContent).toBe("1 of 3 matches");
    replace!.value = "fox";
    [...bar.querySelectorAll("button")].find((b) => b.textContent === "Replace all")!.click();
    expect(editor.getText()).toBe("fox dog fox\n\nfox");
    key(find!, "Escape");
    expect(bar.hidden).toBe(true);
  });

  it("whole-word matching is Unicode aware (Arabic)", () => {
    const editor = ui({ content: "<p>كتب الكتاب كتب</p>" });
    editor.commands.setSearch({ query: "كتب", wholeWord: true });
    expect(getSearchState(editor.state).matches).toHaveLength(2);
  });
});

describe("source code view", () => {
  it("toggles to formatted HTML, applies edits through the sanitizer, and is undoable", async () => {
    const editor = ui({ content: "<h2>Title</h2><p>Body</p>" });
    const toggle = button(editor, "Source code");
    toggle.click();
    await frame();
    const source = editor.root.querySelector<HTMLTextAreaElement>("textarea.owe-source")!;
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(source.hidden).toBe(false);
    expect((editor.view.dom as HTMLElement).hidden).toBe(true);
    expect(source.getAttribute("aria-label")).toBe("Source code");
    expect(source.value).toBe(`<h2 dir="auto">Title</h2>\n<p dir="auto">Body</p>`);
    // Formatting controls are disabled in source mode.
    expect(button(editor, "Bold").getAttribute("aria-disabled")).toBe("true");

    source.value = `<h2>Title</h2><p>Body <script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:x">link</a></p>`;
    toggle.click();
    await frame();
    expect(source.hidden).toBe(true);
    const applied = editor.getHTML();
    expect(applied).not.toMatch(/<script|onerror|javascript:/i);
    expect(applied).toContain(`<p dir="auto">Body</p>`);
    expect(applied).toContain(`<p dir="auto">link</p>`); // unsafe link dropped, its text kept
    await frame();
    expect(editor.root.querySelector('[role="alert"]')!.textContent).toMatch(/isn't supported/);
    editor.commands.undo();
    expect(editor.getHTML()).toBe(`<h2 dir="auto">Title</h2><p dir="auto">Body</p>`);
  });
});

describe("status bar", () => {
  it("shows the element path and selects ancestors on click", async () => {
    const editor = ui({ content: "<ul><li><p>item</p></li></ul>" });
    selectText(editor, "item");
    await frame();
    const nav = editor.root.querySelector('nav[aria-label="Element path"]')!;
    const items = [...nav.querySelectorAll("button")];
    expect(items.map((b) => b.textContent)).toEqual(["Bulleted list", "List item", "Paragraph"]);
    expect(items[2]!.getAttribute("aria-current")).toBe("location");
    items[0]!.click();
    expect(editor.state.selection.constructor.name).toBe("NodeSelection");
  });

  it("counts words and characters with plural rules", async () => {
    const editor = ui({ content: "<p>one two three</p>" });
    expect(editor.root.querySelector(".owe-counts")!.textContent).toBe("3 words · 13 characters");
    const ar = ui({ content: "<p>مرحبا بالعالم</p>", language: "ar" });
    expect(ar.root.querySelector(".owe-counts")!.textContent).toMatch(/^كلمتان · /);
  });
});

