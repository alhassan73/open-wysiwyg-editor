import { afterEach, describe, expect, it } from "vitest";
import {
  contrastRatio,
  createEditor,
  getUI,
  HIGHLIGHT_PALETTE,
  normalizeColor,
  TEXT_PALETTE,
  type Editor,
} from "../src";
import { make, selectText } from "./helpers";

const plain = (html: string) => html.replace(/ dir="auto"/g, "");

describe("color utilities", () => {
  it.each([
    ["#C00", "#cc0000"],
    ["#b3261e", "#b3261e"],
    ["rgb(179, 38, 30)", "#b3261e"],
    ["rgba(0 0 255 / 50%)", "#0000ff"],
    ["hsl(0, 100%, 50%)", "#ff0000"],
    ["DarkRed", "#8b0000"],
  ])("normalizes %s", (input, out) => expect(normalizeColor(input)).toBe(out));

  it.each(["red; background:url(x)", "expression(alert(1))", "url(javascript:x)", "#12", "rgb(300,0,0)", "var(--x)", ""])(
    "rejects %s",
    (input) => expect(normalizeColor(input)).toBeNull(),
  );

  it("computes WCAG contrast", () => {
    expect(contrastRatio("#000", "#fff")).toBeCloseTo(21, 0);
    expect(contrastRatio("#777", "#fff")!).toBeLessThan(4.5);
  });

  it("built-in palettes meet WCAG AA (4.5:1)", () => {
    for (const c of TEXT_PALETTE) expect(contrastRatio(c.value, "#ffffff")!, c.name).toBeGreaterThanOrEqual(4.5);
    for (const c of HIGHLIGHT_PALETTE) expect(contrastRatio("#1b1f24", c.value)!, c.name).toBeGreaterThanOrEqual(4.5);
  });
});

describe("TextColor & Highlight", () => {
  it("applies, replaces and removes colors; output uses inline styles", () => {
    const editor = make({ content: "<p>hello world</p>" });
    selectText(editor, "world");
    editor.commands.setTextColor("#b3261e");
    editor.commands.setHighlight("#fff2a8");
    expect(plain(editor.getHTML())).toBe(
      `<p>hello <span style="color: #b3261e"><mark style="background-color: #fff2a8">world</mark></span></p>`,
    );
    editor.commands.setTextColor("rgb(11, 87, 208)");
    expect(editor.getHTML()).toContain(`color: #0b57d0`);
    editor.chain().unsetTextColor().unsetHighlight().run();
    expect(plain(editor.getHTML())).toBe(`<p>hello world</p>`);
  });

  it("refuses invalid/unsafe color values", () => {
    const editor = make({ content: "<p>x</p>" });
    editor.commands.selectAll();
    expect(editor.commands.setTextColor("red; position:fixed")).toBe(false);
    expect(editor.commands.setTextColor("url(javascript:alert(1))")).toBe(false);
  });

  it("live view paints via the CSSOM, not a style attribute string", () => {
    const editor = make({ content: `<p><span style="color:#b3261e">r</span></p>` });
    const span = (editor.view.dom as HTMLElement).querySelector("span")!;
    expect(span.style.color).toBe("rgb(179, 38, 30)");
  });

  it("ignores Google Docs/Word noise colors on paste", () => {
    const editor = make({ content: "<p></p>" });
    editor.view.pasteHTML(
      `<p><span style="color:#000000;background-color:transparent">plain</span> <span style="color:windowtext;background:white">word</span> <span style="color:#b3261e;background:yellow">kept</span></p>`,
    );
    expect(plain(editor.getHTML())).toBe(
      `<p>plain word <span style="color: #b3261e"><mark style="background-color: #ffff00">kept</mark></span></p>`,
    );
  });

  it("toggleHighlight via Mod-Shift-h semantics", () => {
    const editor = make({ content: "<p>mark me</p>" });
    selectText(editor, "mark");
    editor.commands.toggleHighlight();
    expect(editor.getHTML()).toContain(`<mark style="background-color: #fff2a8">mark</mark>`);
    editor.commands.toggleHighlight();
    expect(editor.getHTML()).not.toContain("<mark");
  });

  it("parses <mark> and <font color>", () => {
    const editor = make({ content: `<p><mark>a</mark> <font color="#146c2e">b</font></p>` });
    expect(plain(editor.getHTML())).toBe(`<p><mark>a</mark> <span style="color: #146c2e">b</span></p>`);
  });
});

describe("color UI", () => {
  const live: Editor[] = [];
  afterEach(() => {
    while (live.length) live.pop()!.destroy();
  });
  const ui = (content: string) => {
    const el = document.createElement("div");
    document.body.append(el);
    const e = createEditor({ element: el, content });
    live.push(e);
    return e;
  };
  const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));

  it("menu lists named swatches as radio items and names the current color", async () => {
    const editor = ui("<p>hello</p>");
    selectText(editor, "hello");
    const trigger = editor.root.querySelector<HTMLElement>('[aria-label="Text color"]')!;
    trigger.click();
    const menu = document.getElementById(trigger.getAttribute("aria-controls")!)!;
    const items = [...menu.querySelectorAll('[role="menuitemradio"]')];
    expect(items[0]!.textContent).toContain("Automatic");
    expect(items.map((i) => i.textContent)).toContain("Dark red");
    expect(menu.querySelectorAll(".owe-swatch").length).toBe(TEXT_PALETTE.length + 1);
    (items.find((i) => i.textContent === "Dark red") as HTMLElement).click();
    await frame();
    expect(editor.getHTML()).toContain("color: #b3261e");
    expect(trigger.getAttribute("aria-label")).toBe("Text color: Dark red");
  });

  it("custom color dialog shows live contrast and validates input", () => {
    const editor = ui("<p>hello</p>");
    selectText(editor, "hello");
    getUI(editor)!.openDialog("textColor");
    const dialog = editor.root.querySelector("dialog")!;
    const hex = dialog.querySelector<HTMLInputElement>('input[type="text"]')!;
    hex.value = "#aaaaaa";
    hex.dispatchEvent(new Event("input"));
    expect(dialog.querySelector(".owe-contrast")!.textContent).toMatch(/2\.3:1 — Below the 4\.5:1 minimum/);
    hex.value = "not a color";
    dialog.querySelector("form")!.dispatchEvent(new Event("submit", { cancelable: true }));
    expect(hex.getAttribute("aria-invalid")).toBe("true");
    hex.value = "#146c2e";
    hex.dispatchEvent(new Event("input"));
    expect(dialog.querySelector(".owe-contrast")!.textContent).toMatch(/Meets WCAG AA/);
    dialog.querySelector("form")!.dispatchEvent(new Event("submit", { cancelable: true }));
    expect(editor.getHTML()).toContain("color: #146c2e");
  });
});
