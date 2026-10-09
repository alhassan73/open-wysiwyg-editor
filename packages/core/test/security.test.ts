import { describe, expect, it } from "vitest";
import { defineExtension, docToHTML, sanitizeUrl, StarterKit, type JSONContent } from "../src";
import { protectStyles } from "../src/core/sanitize";
import { make } from "./helpers";

const PNG = "data:image/png;base64,iVBORw0KGgo=";

/** A deliberately careless extension: its toDOM copies stored attributes as-is. */
const RawMedia = defineExtension({
  name: "rawMedia",
  nodes: () => ({
    rawMedia: {
      group: "block",
      atom: true,
      attrs: { src: { default: null }, poster: { default: null }, href: { default: null } },
      toDOM: (node) => ["video", { src: node.attrs.src, poster: node.attrs.poster, href: node.attrs.href }],
    },
  }),
});

const rawMediaDoc = (attrs: Record<string, string>): JSONContent => ({
  type: "doc",
  content: [{ type: "rawMedia", attrs }],
});

const paragraphWith = (attrs: Record<string, unknown>): JSONContent => ({
  type: "doc",
  content: [{ type: "paragraph", attrs, content: [{ type: "text", text: "x" }] }],
});

describe("sanitizeUrl", () => {
  it.each([
    ["https://example.com/a?b=c#d", "https://example.com/a?b=c#d"],
    ["http://example.com", "http://example.com"],
    ["mailto:a@b.co", "mailto:a@b.co"],
    ["tel:+201000000000", "tel:+201000000000"],
    ["/relative/path", "/relative/path"],
    ["#section", "#section"],
    ["page.html", "page.html"],
    ["  https://x.y  ", "https://x.y"],
  ])("allows %s", (input, out) => {
    expect(sanitizeUrl(input)).toBe(out);
  });

  it.each([
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    " javascript:alert(1)",
    "java\tscript:alert(1)",
    "java\nscript:alert(1)",
    "\u0001javascript:alert(1)",
    "java​script:alert(1)",
    "vbscript:msgbox(1)",
    "data:text/html,<script>alert(1)</script>",
    "data:image/svg+xml;base64,PHN2Zz4=",
    "file:///etc/passwd",
    "blob:https://x/uuid",
    "",
    null,
    42,
  ])("blocks %s", (input) => {
    expect(sanitizeUrl(input)).toBeNull();
  });

  it("allows raster data images only when enabled and only for images", () => {
    const png = "data:image/png;base64,iVBORw0KGgo=";
    expect(sanitizeUrl(png, {}, "image")).toBeNull();
    expect(sanitizeUrl(png, { allowDataImages: true }, "image")).toBe(png);
    expect(sanitizeUrl(png, { allowDataImages: true }, "link")).toBeNull();
  });

  it("respects a custom protocol allowlist and relative policy", () => {
    expect(sanitizeUrl("ftp://x", { protocols: ["ftp"] })).toBe("ftp://x");
    expect(sanitizeUrl("https://x", { protocols: ["ftp"] })).toBeNull();
    expect(sanitizeUrl("/a", { allowRelative: false })).toBeNull();
  });
});

const XSS_VECTORS = [
  `<img src=x onerror=alert(1)>`,
  `<svg><script>alert(1)</script></svg>`,
  `<script>alert(1)</script><p>after</p>`,
  `<a href="javascript:alert(1)">click</a>`,
  `<a href="  JAVASCRIPT:alert(1)">click</a>`,
  `<a href="java&#x09;script:alert(1)">click</a>`,
  `<iframe src="https://evil.example" srcdoc="<script>alert(1)</script>"></iframe>`,
  `<p onclick="alert(1)" style="background:url(javascript:alert(1))">x</p>`,
  `<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>`,
  `<form action="javascript:alert(1)"><button>go</button></form>`,
  `<object data="javascript:alert(1)"></object><embed src="javascript:alert(1)">`,
  `<noscript><p title="</noscript><img src=x onerror=alert(1)>">`,
  `<base href="javascript:/a/-alert(1)///////"><a href="../x">x</a>`,
  `<img src="data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+">`,
  `<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">x</a>`,
  `<details open ontoggle=alert(1)><summary>x</summary></details>`,
  `<p id="__proto__" name="constructor">clobber</p>`,
  `<template><img src=x onerror=alert(1)></template>`,
  `<style>@import "javascript:alert(1)";</style><p>x</p>`,
  `<!--><img src=x onerror=alert(1)>-->`,
];

describe("HTML input sanitization (XSS corpus)", () => {
  it.each(XSS_VECTORS)("neutralizes %s", (vector) => {
    const editor = make({ content: vector });
    const html = editor.getHTML();
    expect(html).not.toMatch(/<script|<iframe|<object|<embed|<svg|<math|<style|<form|<base|<template/i);
    expect(html).not.toMatch(/\son\w+\s*=/i);
    expect(html).not.toMatch(/javascript:|vbscript:|data:text|data:image\/svg/i);
    expect(html).not.toMatch(/srcdoc|formaction/i);
    // The live editing DOM must be just as clean.
    const live = editor.view.dom as HTMLElement;
    expect(live.querySelector("script,iframe,object,embed,svg,style,form,base")).toBeNull();
    for (const el of live.querySelectorAll("*")) {
      for (const attr of el.attributes) {
        expect(attr.name.startsWith("on")).toBe(false);
        expect(attr.value).not.toMatch(/javascript:/i);
      }
    }
  });

  it("keeps the text of unsafe links while dropping the link", () => {
    const editor = make({ content: `<p><a href="javascript:alert(1)">click me</a></p>` });
    expect(editor.getHTML()).toBe(`<p dir="auto">click me</p>`);
  });

  it("refuses unsafe URLs arriving through JSON (bypassing the HTML parser)", () => {
    const editor = make({
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "x", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] },
            ],
          },
          { type: "image", attrs: { src: "javascript:alert(1)", alt: "a" } },
        ],
      },
    });
    const html = editor.getHTML();
    expect(html).not.toContain("javascript:");
    // and in the live view
    expect((editor.view.dom as HTMLElement).querySelector("a")?.getAttribute("href") ?? null).toBeNull();
  });

  it("ignores prototype-polluting keys in JSON attrs and options", () => {
    const json = JSON.parse(
      `{"type":"doc","content":[{"type":"paragraph","attrs":{"__proto__":{"onerror":"alert(1)"}},"content":[{"type":"text","text":"x"}]}]}`,
    );
    const editor = make({ content: json });
    expect(editor.getHTML()).toBe(`<p dir="auto">x</p>`);
    expect(({} as Record<string, unknown>).onerror).toBeUndefined();
  });

  it("rejects invalid JSON content without destroying the existing document", async () => {
    const editor = make({ content: "<p>keep</p>" });
    const errors: Error[] = [];
    editor.on("contentError", (e) => errors.push(e));
    expect(editor.setContent({ type: "doc", content: [{ type: "nope" }] })).toBe(false);
    await Promise.resolve();
    expect(editor.getHTML()).toBe(`<p dir="auto">keep</p>`);
    expect(errors).toHaveLength(1);
  });

  it("blocks unsafe hrefs in setLink and setImage commands", () => {
    const editor = make({ content: "<p>text</p>" });
    editor.commands.selectAll();
    expect(editor.commands.setLink({ href: "javascript:alert(1)" })).toBe(false);
    expect(editor.commands.setImage({ src: "javascript:alert(1)", alt: "x" })).toBe(false);
    expect(editor.getHTML()).toBe(`<p dir="auto">text</p>`);
  });

  it("adds rel=noopener noreferrer to links that open a new tab", () => {
    const editor = make({ content: "<p>text</p>" });
    editor.commands.selectAll();
    editor.commands.setLink({ href: "https://example.com", newTab: true });
    expect(editor.getHTML()).toBe(
      `<p dir="auto"><a href="https://example.com" target="_blank" rel="noopener noreferrer">text</a></p>`,
    );
  });
});

describe("inline styles under strict CSP", () => {
  it("parks style attributes in data-owe-style before parsing (attribute-aware)", () => {
    expect(protectStyles(`<p style="color:red">a</p>`)).toBe(`<p data-owe-style="color:red">a</p>`);
    expect(protectStyles(`<p class="x" STYLE = 'a:b'>`)).toBe(`<p class="x" data-owe-style = 'a:b'>`);
    // Quoted values containing ">" or the word style are left alone.
    expect(protectStyles(`<a title="1 > 0 style=x" style="color:red">`)).toBe(
      `<a title="1 > 0 style=x" data-owe-style="color:red">`,
    );
    expect(protectStyles(`<p>style="text" and a < style=b</p>`)).toBe(`<p>style="text" and a < style=b</p>`);
    expect(protectStyles(`<p data-style="x">`)).toBe(`<p data-style="x">`);
  });

  it("still applies styled formatting and never leaks the parking attribute", () => {
    const editor = make({
      content: `<p style="text-align:center">c</p><p><span style="font-weight:700">b</span> <span style="color:#b3261e">r</span> <mark style="background-color:#fff2a8">m</mark></p><p data-owe-style="color:#b3261e">smuggled</p>`,
    });
    const html = editor.getHTML();
    expect(html).toContain(`style="text-align: center"`);
    expect(html).toContain(`<strong>b</strong>`);
    expect(html).toContain(`<span style="color: #b3261e">r</span>`);
    expect(html).toContain(`<mark style="background-color: #fff2a8">m</mark>`);
    expect(html).not.toContain("data-owe-style");
  });
});

describe("HTML output respects the configured URL policy", () => {
  it("drops data: images from output unless allowDataImages is set, even for careless extensions", () => {
    const strict = make({ extensions: [StarterKit, RawMedia], content: rawMediaDoc({ src: PNG, poster: PNG }) });
    expect(strict.getHTML()).not.toContain("data:");
    expect(docToHTML(strict.state.doc)).not.toContain("data:");

    const allowed = make({
      extensions: [StarterKit, RawMedia],
      urlPolicy: { allowDataImages: true },
      content: rawMediaDoc({ src: PNG, poster: PNG }),
    });
    expect(allowed.getHTML()).toBe(`<video src="${PNG}" poster="${PNG}"></video>`);
  });

  it("checks poster like an image source and never allows data: in links", () => {
    const editor = make({
      extensions: [StarterKit, RawMedia],
      urlPolicy: { allowDataImages: true },
      content: rawMediaDoc({ src: "https://example.com/v.mp4", poster: "mailto:a@b.co", href: PNG }),
    });
    expect(editor.getHTML()).toBe(`<video src="https://example.com/v.mp4"></video>`);
  });

  it("keeps the built-in image's data: source only when allowed", () => {
    const doc: JSONContent = { type: "doc", content: [{ type: "image", attrs: { src: PNG, alt: "a" } }] };
    expect(make({ content: doc }).getHTML()).not.toContain("data:");
    expect(make({ content: doc, urlPolicy: { allowDataImages: true } }).getHTML()).toContain(`src="${PNG}"`);
  });

  it("never emits SVG or MathML from an extension's toDOM (animation attributes are script sinks)", () => {
    const Svg = defineExtension({
      name: "svgBlock",
      nodes: () => ({
        svgBlock: {
          group: "block",
          atom: true,
          toDOM: () => [
            "div",
            ["svg", ["a", ["animate", { attributeName: "href", values: "javascript:alert(1)" }], ["text", "x"]]],
            ["math", { href: "https://example.com" }, "y"],
          ],
        },
      }),
    });
    const editor = make({ extensions: [StarterKit, Svg], content: { type: "doc", content: [{ type: "svgBlock" }] } });
    expect(editor.getHTML()).toBe("<div></div>");
  });
});

describe("attribute values are validated at render time (JSON and paste context bypass parsing)", () => {
  const INJECTED = "center; position: fixed; inset: 0; background-image: url(https://evil.example/t.png)";

  it("refuses CSS smuggled through textAlign", () => {
    const editor = make({ content: paragraphWith({ textAlign: INJECTED }) });
    expect(editor.getHTML()).toBe(`<p dir="auto">x</p>`);
    expect((editor.view.dom as HTMLElement).querySelector("p")!.className).toBe("");

    const classes = make({
      extensions: [StarterKit.configure({ textAlign: { output: "class" } })],
      content: paragraphWith({ textAlign: "center evil-class" }),
    });
    expect(classes.getHTML()).toBe(`<p dir="auto">x</p>`);
  });

  it("still renders valid alignments", () => {
    expect(make({ content: paragraphWith({ textAlign: "center" }) }).getHTML()).toBe(
      `<p style="text-align: center" dir="auto">x</p>`,
    );
  });

  it("refuses invalid dir values", () => {
    const editor = make({ content: paragraphWith({ dir: "rtl evil" }) });
    expect(editor.getHTML()).toBe(`<p dir="auto">x</p>`);
  });

  it("refuses invalid ordered list attributes", () => {
    const editor = make({
      content: {
        type: "doc",
        content: [
          {
            type: "orderedList",
            attrs: { start: "2 x", type: "x" },
            content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "x" }] }] }],
          },
        ],
      },
    });
    expect(editor.getHTML()).toBe(`<ol><li><p dir="auto">x</p></li></ol>`);
  });

  it("refuses attributes smuggled in a clipboard slice context (data-pm-slice)", () => {
    // prosemirror-view creates the context's wrapper nodes from raw JSON attributes, running only
    // the attribute validators in the schema (GHSA-c8x8-7fp4-3x9w), never the parse rules.
    const editor = make({
      extensions: [StarterKit.configure({ textAlign: { types: ["paragraph", "heading", "blockquote"] } })],
      content: "<p>start</p><p></p>",
    });
    editor.commands.focus("end");
    const context = JSON.stringify([
      "blockquote",
      { textAlign: INJECTED, dir: "rtl evil" },
      "orderedList",
      { start: "2 x", type: "x" },
    ]);
    editor.view.pasteHTML(`<div><li data-pm-slice='0 0 ${context}'><p>pasted</p></li></div>`);
    const html = editor.getHTML();
    expect(html).toContain("pasted");
    expect(html).toContain("<blockquote><ol><li>"); // the context was applied …
    expect(html).not.toMatch(/evil|position|background|start=|type=/); // … without its unsafe values
    const live = editor.view.dom as HTMLElement;
    for (const el of live.querySelectorAll("blockquote, ol")) {
      expect(el.className).not.toMatch(/evil|position|background/);
      expect(el.getAttribute("dir") ?? "auto").toMatch(/^(ltr|rtl|auto)$/);
    }
  });
});
