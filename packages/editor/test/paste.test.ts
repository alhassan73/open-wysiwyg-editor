import { describe, expect, it } from "vitest";
import { cleanPastedHTML } from "../src";
import { make } from "./helpers";

const plain = (html: string) => html.replace(/ dir="auto"/g, "");

// Trimmed from real Word 365 clipboard HTML.
const WORD = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta name=Generator content="Microsoft Word 15"><style><!-- p.MsoNormal {margin:0cm;} --></style></head>
<body lang=EN-US><!--StartFragment-->
<h1>Quarterly report</h1>
<p class=MsoNormal>Intro with <b>bold</b> and <i>italic</i><o:p></o:p></p>
<p class=MsoListParagraphCxSpFirst style='text-indent:-18.0pt;mso-list:l0 level1 lfo1'><![if !supportLists]><span style='font-family:Symbol'><span style='mso-list:Ignore'>·<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp; </span></span></span><![endif]>First</p>
<p class=MsoListParagraphCxSpMiddle style='margin-left:72.0pt;mso-list:l0 level2 lfo1'><![if !supportLists]><span style='font-family:"Courier New"'><span style='mso-list:Ignore'>o<span>&nbsp;&nbsp; </span></span></span><![endif]>Nested</p>
<p class=MsoListParagraphCxSpLast style='mso-list:l0 level1 lfo1'><![if !supportLists]><span style='mso-list:Ignore'>·<span>&nbsp;&nbsp;</span></span><![endif]>Second</p>
<p class=MsoNormal>Steps:</p>
<p class=MsoListParagraph style='mso-list:l1 level1 lfo2'><![if !supportLists]><span style='mso-list:Ignore'>3.<span>&nbsp;</span></span><![endif]>Third step</p>
<p class=MsoListParagraph style='mso-list:l1 level1 lfo2'><![if !supportLists]><span style='mso-list:Ignore'>4.<span>&nbsp;</span></span><![endif]>Fourth step</p>
<p class=MsoNormal><img width=200 height=100 src="file:///C:/Users/x/AppData/Local/Temp/msohtmlclip1/01/clip_image001.png" alt="Chart of sales"></p>
<table class=MsoTableGrid border=1><tr><td><p class=MsoNormal><b>Region</b></p></td><td><p class=MsoNormal><b>Total</b></p></td></tr>
<tr><td><p class=MsoNormal>North</p></td><td><p class=MsoNormal>10</p></td></tr></table>
<!--EndFragment--></body></html>`;

const GDOCS = `<meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-abc"><h2 dir="ltr"><span style="font-size:16pt;font-weight:400">Heading</span></h2>
<ul style="margin-top:0;margin-bottom:0;"><li dir="ltr" aria-level="1" style="list-style-type:disc;"><p dir="ltr" role="presentation"><span style="font-weight:700">Bold item</span></p></li>
<li dir="ltr" aria-level="2" style="list-style-type:circle;"><p dir="ltr" role="presentation"><span style="font-style:italic">Nested item</span></p></li>
<li dir="ltr" aria-level="1"><p dir="ltr" role="presentation"><span>Back</span></p></li></ul>
<p dir="ltr"><span style="text-decoration:underline">under</span> <span style="vertical-align:super">sup</span></p></b>`;

const LIBREOFFICE = `<!DOCTYPE HTML><html><head><meta name="generator" content="LibreOffice 7.6"/><style type="text/css">p { margin-bottom: 0.1in }</style></head>
<body lang="ar-EG" dir="rtl"><p dir="rtl" style="margin-bottom: 0in"><font face="Arial">مرحبا <b>بالعالم</b></font></p>
<ol><li><p style="margin-bottom: 0in">one</p></li><ul><li><p>loose nested</p></li></ul></ol></body></html>`;

describe("cleanPastedHTML", () => {
  it("rebuilds Word lists (nesting, bullets vs numbers, start) and removes Office junk", () => {
    const { html, dropped } = cleanPastedHTML(WORD);
    expect(html).not.toMatch(/mso-list:\s*Ignore|<o:p|StartFragment|MsoNormal \{/i);
    expect(dropped).toBe(true); // file:/// image
    expect(html).toMatch(/<ul><li><p>First<\/p><ul><li><p>Nested<\/p><\/li><\/ul><\/li><li><p>Second<\/p><\/li><\/ul>/);
    expect(html).toMatch(/<ol start="3"><li><p>Third step<\/p><\/li><li><p>Fourth step<\/p><\/li><\/ol>/);
  });

  it("nests Google Docs aria-level lists and drops its blanket dir=ltr", () => {
    const { html } = cleanPastedHTML(GDOCS);
    expect(html).not.toContain('dir="ltr"');
    expect(html).toMatch(/<ul>\s*<li>.*Bold item.*<ul><li>.*Nested item.*<\/li><\/ul><\/li><li>.*Back/s);
  });

  it("repairs loose nested lists (LibreOffice/Docs) and unwraps <font>", () => {
    const { html } = cleanPastedHTML(LIBREOFFICE);
    expect(html).not.toContain("<font");
    expect(html).toMatch(/<ol><li><p[^>]*>one<\/p><ul><li><p>loose nested<\/p><\/li><\/ul><\/li><\/ol>/);
    expect(html).toContain('dir="rtl"');
  });
});

describe("paste through the editor", () => {
  it("Word → clean semantic document (headings, lists, table, no junk)", () => {
    const editor = make({ content: "<p></p>" });
    editor.view.pasteHTML(WORD);
    const out = plain(editor.getHTML());
    expect(out).toContain("<h1>Quarterly report</h1>");
    expect(out).toContain("<p>Intro with <strong>bold</strong> and <em>italic</em></p>");
    expect(out).toContain("<ul><li><p>First</p><ul><li><p>Nested</p></li></ul></li><li><p>Second</p></li></ul>");
    expect(out).toContain(`<ol start="3"><li><p>Third step</p></li><li><p>Fourth step</p></li></ol>`);
    expect(out).toContain("<table><tbody><tr><td><p><strong>Region</strong></p></td>");
    expect(out).not.toMatch(/file:|mso|class=/i);
  });

  it("Google Docs → bold/italic/underline/superscript and nested lists", () => {
    const editor = make({ content: "<p></p>" });
    editor.view.pasteHTML(GDOCS);
    const out = plain(editor.getHTML());
    expect(out).toContain("<h2>Heading</h2>");
    expect(out).toContain("<strong>Bold item</strong>");
    expect(out).toContain("<em>Nested item</em>");
    expect(out).toContain("<u>under</u> <sup>sup</sup>");
    expect(out).toMatch(/<ul><li><p><strong>Bold item<\/strong><\/p><ul><li><p><em>Nested item<\/em><\/p><\/li><\/ul><\/li><li><p>Back<\/p><\/li><\/ul>/);
  });

  it("LibreOffice Arabic → keeps rtl direction and semantics", () => {
    const editor = make({ content: "<p></p>" });
    editor.view.pasteHTML(LIBREOFFICE);
    const out = editor.getHTML();
    expect(out).toContain(`<p dir="rtl">مرحبا <strong>بالعالم</strong></p>`);
  });

  it("announces when pasted content had to be dropped", async () => {
    const editor = make({ content: "<p></p>" });
    editor.view.pasteHTML(`<p>x<img src="file:///c:/a.png" alt="a"></p>`);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(editor.root.querySelector('[role="status"]')!.textContent).toMatch(/removed/);
  });

  it("preserves accessibility attributes through paste (ATAG B.1.2)", () => {
    const editor = make({ content: "<p></p>" });
    editor.view.pasteHTML(
      `<figure><img src="https://x.example/a.png" alt="Logo"><figcaption>Our logo</figcaption></figure><table><caption>T</caption><tr><th scope="col">H</th></tr><tr><td>d</td></tr></table>`,
    );
    const out = editor.getHTML();
    expect(out).toContain(`alt="Logo"`);
    expect(out).toContain(`<figcaption>Our logo</figcaption>`);
    expect(out).toContain(`<caption>T</caption>`);
    expect(out).toContain(`<th scope="col">`);
  });
});
