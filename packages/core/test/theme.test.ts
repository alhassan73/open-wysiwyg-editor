import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { applyTheme, getUI, THEME_TOKENS, type ThemeOptions } from "../src";
import { EDITOR_TAG, type EditorElement } from "../src/element";
import { make } from "./helpers";

const styles = (file: string) =>
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../src/styles", file), "utf8");
const prop = (el: HTMLElement, name: string) => el.style.getPropertyValue(`--owe-${name}`);

describe("ui.brand", () => {
  it("sets --owe-brand and a matching --owe-brand-2", () => {
    const { root } = make({ ui: { brand: "#e11d48" } });
    expect(prop(root, "brand")).toBe("#e11d48");
    expect(prop(root, "brand-2")).toContain("var(--owe-brand)");
  });

  it("picks black text on a light brand and white text on a dark brand", () => {
    expect(prop(make({ ui: { brand: "#facc15" } }).root, "on-brand")).toBe("#101112");
    expect(prop(make({ ui: { brand: "#1e3a8a" } }).root, "on-brand")).toBe("#ffffff");
  });

  it.each([
    ["rgb(250 204 21)", "#101112"],
    ["hsl(48, 96%, 53%)", "#101112"],
    ["hsl(224, 64%, 33%)", "#ffffff"],
    ["Navy", "#ffffff"],
    ["yellow", "#101112"],
  ])("reads on-brand from %s", (brand, onBrand) => {
    expect(prop(make({ ui: { brand } }).root, "on-brand")).toBe(onBrand);
  });

  it("sets only the brand when the color can't be measured", () => {
    const { root } = make({ ui: { brand: "oklch(0.7 0.15 30)" } });
    expect(prop(root, "brand")).toBe("oklch(0.7 0.15 30)");
    expect(prop(root, "on-brand")).toBe("");
  });

  it("lets tokens override what the shortcut derives", () => {
    const { root } = make({ ui: { brand: "#facc15", tokens: { "on-brand": "#000000", "brand-2": "#ff0000" } } });
    expect(prop(root, "on-brand")).toBe("#000000");
    expect(prop(root, "brand-2")).toBe("#ff0000");
  });
});

describe("ui.tokens", () => {
  it("sets public tokens with the --owe- prefix", () => {
    const { root } = make({ ui: { tokens: { bg: "#0b0d10", radius: "8px", "btn-active-bg": "var(--owe-accent-soft)" } } });
    expect(prop(root, "bg")).toBe("#0b0d10");
    expect(prop(root, "radius")).toBe("8px");
    expect(prop(root, "btn-active-bg")).toBe("var(--owe-accent-soft)");
  });

  it("ignores unknown token names", () => {
    const { root } = make({ ui: { tokens: { nope: "red", constructor: "red" } as ThemeOptions["tokens"] } });
    expect(prop(root, "nope")).toBe("");
    expect(root.getAttribute("style") ?? "").not.toContain("red");
  });

  it.each([
    "red; background: url(https://evil.test/x.png)",
    "red}",
    "{red",
    "<b>red</b>",
    "url(https://evil.test/x.png)",
    "URL( x )",
    "u\\72l(https://evil.test/x.png)",
    "image-set('https://evil.test/x.png' 1x)",
    "",
    "   ",
  ])("rejects the value %j", (value) => {
    const { root } = make({ ui: { brand: value, tokens: { bg: value, text: "#111111" } } });
    expect(prop(root, "bg")).toBe("");
    expect(prop(root, "brand")).toBe("");
    expect(prop(root, "text")).toBe("#111111"); // the valid neighbour still applies
  });

  it("ignores values that aren't strings", () => {
    const { root } = make({ ui: { tokens: { bg: 5, text: null } as unknown as ThemeOptions["tokens"] } });
    expect(prop(root, "bg")).toBe("");
    expect(prop(root, "text")).toBe("");
  });

  it("covers every token that tokens.css declares", () => {
    const css = styles("tokens.css");
    const declared = new Set([...css.matchAll(/^\s+--owe-([a-z0-9-]+):/gm)].map((m) => m[1]!));
    expect(declared.size).toBeGreaterThan(30);
    for (const name of declared) expect(THEME_TOKENS, name).toContain(name);
  });
});

describe("theme at runtime", () => {
  it("applies theme, brand and tokens, and ui.setTheme() replaces them", () => {
    const editor = make({ ui: { theme: "dark", brand: "#facc15", tokens: { radius: "4px" } } });
    const { root } = editor;
    expect(root.dataset.theme).toBe("dark");
    getUI(editor)!.setTheme({ theme: "light", brand: "#1e3a8a" });
    expect(root.dataset.theme).toBe("light");
    expect(prop(root, "brand")).toBe("#1e3a8a");
    expect(prop(root, "on-brand")).toBe("#ffffff");
    expect(prop(root, "radius")).toBe(""); // not part of the new theme
    getUI(editor)!.setTheme({});
    expect(root.dataset.theme).toBeUndefined();
    expect(root.getAttribute("style") ?? "").not.toContain("--owe-");
  });

  it("applyTheme() works on any editor root and leaves other styles alone", () => {
    const el = document.createElement("div");
    el.style.color = "red";
    applyTheme(el, { brand: "#0d9488", tokens: { "toolbar-bg": "#f0fdfa" } });
    expect(prop(el, "toolbar-bg")).toBe("#f0fdfa");
    applyTheme(el, {});
    expect(prop(el, "toolbar-bg")).toBe("");
    expect(el.style.color).toBe("red");
  });

});

describe("<owe-editor theme brand>", () => {
  afterEach(() => document.body.replaceChildren());
  const mount = (markup: string): EditorElement => {
    const wrapper = document.createElement("div");
    // Test fixture markup, not user content.
    wrapper.innerHTML = markup;
    document.body.append(wrapper);
    return wrapper.querySelector(EDITOR_TAG)!;
  };

  it("applies the attributes when the editor starts", () => {
    const root = mount(`<owe-editor theme="dark" brand="#e11d48"></owe-editor>`).editor!.root;
    expect(root.dataset.theme).toBe("dark");
    expect(prop(root, "brand")).toBe("#e11d48");
    expect(prop(root, "on-brand")).toBe("#ffffff");
  });

  it("follows attribute changes and removals", () => {
    const el = mount(`<owe-editor></owe-editor>`);
    const { root } = el.editor!;
    expect(root.dataset.theme).toBeUndefined();
    el.setAttribute("theme", "dark");
    el.setAttribute("brand", "#facc15");
    expect(root.dataset.theme).toBe("dark");
    expect(prop(root, "brand")).toBe("#facc15");
    expect(prop(root, "on-brand")).toBe("#101112");
    el.setAttribute("brand", "#1e3a8a");
    expect(prop(root, "on-brand")).toBe("#ffffff");
    el.setAttribute("theme", "light");
    expect(root.dataset.theme).toBe("light");
    el.removeAttribute("theme");
    el.removeAttribute("brand");
    expect(root.dataset.theme).toBeUndefined();
    expect(prop(root, "brand")).toBe("");
  });

  it("ignores an invalid theme and an unsafe brand", () => {
    const el = mount(`<owe-editor theme="purple" brand="red; background:url(x)"></owe-editor>`);
    const { root } = el.editor!;
    expect(root.dataset.theme).toBeUndefined();
    expect(prop(root, "brand")).toBe("");
  });

  it("lets the attributes win over options.ui, and keeps the other ui options", () => {
    const wrapper = document.createElement("div");
    const el = document.createElement(EDITOR_TAG) as EditorElement;
    el.options = { ui: { brand: "#111111", theme: "light", tokens: { radius: "6px" } } };
    el.setAttribute("brand", "#222222");
    wrapper.append(el);
    document.body.append(wrapper);
    const { root } = el.editor!;
    expect(prop(root, "brand")).toBe("#222222");
    expect(root.dataset.theme).toBe("light");
    expect(prop(root, "radius")).toBe("6px");
    el.removeAttribute("brand");
    expect(prop(root, "brand")).toBe("#111111"); // back to options.ui
    expect(prop(root, "radius")).toBe("6px");
  });
});

describe("default theme", () => {
  it("has no purple, magenta or indigo defaults", () => {
    const css = ["tokens", "ui", "editor", "content"].map((name) => styles(`${name}.css`)).join("\n");
    for (const hex of ["9644ff", "af47c0", "4a35b8"]) expect(css.toLowerCase()).not.toContain(hex);
  });
});
