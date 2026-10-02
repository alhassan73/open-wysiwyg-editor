import { describe, expect, it } from "vitest";
import { HtmlSupport, StarterKit } from "../src";
import { make } from "./helpers";

const plain = (html: string) => html.replace(/ dir="auto"/g, "");

describe("HtmlSupport (general HTML support)", () => {
  it("is off by default: unknown markup is reduced to the schema", () => {
    const editor = make({ content: `<section class="intro"><p class="lead">x <abbr title="HyperText">HTML</abbr></p></section>` });
    expect(plain(editor.getHTML())).toBe(`<p>x HTML</p>`);
  });

  it("safe preset keeps wrappers, inline elements, classes, data-* and ids", () => {
    const editor = make({
      extensions: [StarterKit, HtmlSupport],
      content:
        `<section class="intro card" data-id="7" id="intro"><p class="lead" data-x="1">x <abbr title="HyperText Markup Language">HTML</abbr> ` +
        `<span lang="fr">bonjour</span> <span>bare</span></p></section>` +
        `<div class="note"><p>n</p></div><details><summary>More</summary><p>hidden</p></details>` +
        `<dl><dt>Term</dt><dd><p>Definition</p></dd></dl>`,
    });
    expect(plain(editor.getHTML())).toBe(
      `<section class="intro card" data-id="7" id="intro"><p class="lead" data-x="1">x <abbr title="HyperText Markup Language">HTML</abbr> ` +
        `<span lang="fr">bonjour</span> bare</p></section>` +
        `<div class="note"><p>n</p></div><details open=""><summary>More</summary><p>hidden</p></details>` +
        `<dl><dt>Term</dt><dd><p>Definition</p></dd></dl>`,
    );
  });

  it("round-trips through JSON", () => {
    const html = `<section class="a"><p class="b">t <mark class="hl">m</mark></p></section>`;
    const one = make({ extensions: [StarterKit, HtmlSupport], content: html });
    const two = make({ extensions: [StarterKit, HtmlSupport], content: one.getJSON() });
    expect(plain(two.getHTML())).toBe(plain(one.getHTML()));
  });

  it("custom rules: only what is listed survives; disallow wins; styles opt-in", () => {
    const editor = make({
      extensions: [
        StarterKit,
        HtmlSupport.configure({
          allow: [
            { name: "section", classes: ["keep", /^tag-/] },
            { name: "p", styles: ["text-indent"], attributes: ["data-*"] },
          ],
          disallow: [{ name: "p", attributes: ["data-secret"] }],
        }),
      ],
      content: `<section class="keep drop tag-x owe-sr-only ProseMirror"><p style="text-indent: 2em; position: fixed" data-a="1" data-secret="s">t</p></section><article><p>a</p></article>`,
    });
    expect(plain(editor.getHTML())).toBe(
      `<section class="keep tag-x"><p data-a="1" style="text-indent: 2em">t</p></section><p>a</p>`,
    );
  });

  it("never lets attacks through the extra-HTML path", () => {
    const editor = make({
      extensions: [
        StarterKit,
        HtmlSupport.configure({ allow: [{ name: /.*/, attributes: true, classes: true, styles: true }] }),
      ],
      content:
        `<div onclick="alert(1)" style="background:url(javascript:alert(1)); color: red" tabindex="0" contenteditable="true" hidden data-pm-slice="x">` +
        `<p id="location" class="ok">a</p><p id="cookie">b</p><q cite="javascript:alert(1)">q</q><q cite="https://x.example">r</q></div>`,
    });
    const html = editor.getHTML();
    expect(html).not.toMatch(/onclick|javascript:|url\(|tabindex|contenteditable|hidden|data-pm|id="location"|id="cookie"/);
    expect(html).toContain(`style="color: red"`);
    expect(html).toContain(`<q cite="https://x.example">r</q>`);
  });

  it("re-validates attributes stored in JSON (bypassing the parser)", () => {
    const editor = make({
      extensions: [StarterKit, HtmlSupport],
      content: {
        type: "doc",
        content: [
          {
            type: "htmlContainer",
            attrs: { tag: "script", attributes: { onclick: "x()", class: "ok", style: "position:fixed" } },
            content: [{ type: "paragraph", attrs: { htmlAttributes: { onmouseover: "x()", class: "c" } }, content: [{ type: "text", text: "t" }] }],
          },
        ],
      },
    });
    expect(plain(editor.getHTML())).toBe(`<div class="ok"><p class="c">t</p></div>`);
  });

  it("keeps extra attributes on marks (e.g. classes on links)", () => {
    const editor = make({
      extensions: [StarterKit, HtmlSupport],
      content: `<p><a href="https://x.example" class="cta" data-track="1">go</a> <strong class="em">b</strong></p>`,
    });
    expect(plain(editor.getHTML())).toBe(
      `<p><a href="https://x.example" class="cta" data-track="1">go</a> <strong class="em">b</strong></p>`,
    );
  });
});
