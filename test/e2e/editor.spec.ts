import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const MOD = process.platform === "darwin" ? "Meta" : "Control";

async function open(page: Page, query = "") {
  await page.goto(`/test/e2e/fixtures/index.html${query}`);
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
}

const content = (page: Page) => page.locator(".owe-content");

async function expectNoViolations(page: Page, allow?: RegExp) {
  const v = await page.evaluate(() => (window as unknown as { __violations: string[] }).__violations);
  expect(v.filter((x) => !allow?.test(x)), "CSP / Trusted Types violations").toEqual([]);
  const errors = await page.evaluate(() => (window as unknown as { __errors: string[] }).__errors);
  expect(errors, "uncaught errors").toEqual([]);
}

async function axe(page: Page, label: string) {
  const results = await new AxeBuilder({ page })
    .include(".owe")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
    .analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(
    serious.map((v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
    `axe (${label})`,
  ).toEqual([]);
}

test.describe("basics", () => {
  test("enhances the textarea, edits, and submits HTML with the form", async ({ page }) => {
    await open(page);
    await expect(page.locator("#body")).toBeHidden();
    const editor = content(page);
    await expect(editor).toHaveAttribute("role", "textbox");
    await expect(editor).toHaveAccessibleName("Article body");
    await expect(editor.locator("h2")).toHaveText("Welcome");
    await editor.locator("p").first().click();
    await page.keyboard.press("End");
    await page.keyboard.type(" Typed text");
    await page.keyboard.press(`${MOD}+A`);
    await page.keyboard.press(`${MOD}+B`);
    const html = await page.evaluate(() => (window as unknown as { editor: { getHTML(): string } }).editor.getHTML());
    expect(html).toContain("Typed text");
    expect(html).toContain("<strong>");
    await expectNoViolations(page);
  });

  test("markdown shortcuts and undo", async ({ page }) => {
    await open(page);
    const editor = content(page);
    await editor.locator("p").first().click();
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    await page.keyboard.type("## Section");
    await expect(editor.locator("h2", { hasText: "Section" })).toBeVisible();
    await page.keyboard.press(`${MOD}+Z`);
    await expect(editor.locator("h2", { hasText: "Section" })).toHaveCount(0);
    await expectNoViolations(page);
  });
});

test.describe("keyboard (WCAG 2.1.1 / 2.1.2, ATAG A.3.1)", () => {
  test("Tab order: toolbar (one stop) → text → out of the editor", async ({ page }) => {
    await open(page);
    await page.locator("label[for=body]").click(); // focuses the editor via its label
    await page.keyboard.press("Shift+Tab");
    await expect(page.locator('[role="toolbar"] .owe-toolbar-item[tabindex="0"]')).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(content(page)).toBeFocused();
    // Not inside a list: Tab leaves the editor (no trap)
    await content(page).locator("h2").click();
    await page.keyboard.press("Tab");
    await expect(content(page)).not.toBeFocused();
  });

  test("Escape then Tab leaves the editor from inside a list", async ({ page }) => {
    await open(page);
    await content(page).locator("li p").nth(1).click();
    await page.keyboard.press("Escape");
    await page.keyboard.press("Tab");
    await expect(content(page)).not.toBeFocused();
  });

  test("Alt+F10 / Escape move between text and toolbar; arrows rove", async ({ page }) => {
    await open(page);
    await content(page).locator("p").first().click();
    await page.keyboard.press("Alt+F10");
    const first = page.locator('[role="toolbar"] .owe-toolbar-item').first();
    await expect(first).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator('[role="toolbar"] .owe-toolbar-item').nth(1)).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(content(page)).toBeFocused();
  });

  test("menu button: open, choose with keyboard, focus returns", async ({ page }) => {
    await open(page);
    await content(page).locator("p").first().click();
    const trigger = page.getByRole("button", { name: /^Text style:/ });
    await trigger.focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(page.getByRole("menuitemradio", { name: "Paragraph" })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menu")).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(content(page).locator("h1")).toHaveCount(1);
  });

  test("link dialog via Ctrl+K: focus moves in, is trapped, and returns", async ({ page }) => {
    await open(page);
    await content(page).locator("strong").dblclick();
    await page.keyboard.press(`${MOD}+K`);
    const dialog = page.getByRole("dialog", { name: "Insert link" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel(/Link address/)).toBeFocused();
    await page.keyboard.type("javascript:alert(1)");
    await page.keyboard.press("Enter");
    await expect(dialog.getByLabel(/Link address/)).toHaveAttribute("aria-invalid", "true");
    await dialog.getByLabel(/Link address/).fill("example.org");
    await page.keyboard.press("Enter");
    await expect(dialog).toBeHidden();
    await expect(content(page)).toBeFocused();
    await expect(content(page).locator('a[href="https://example.org"]')).toHaveText("world");
    await expectNoViolations(page);
  });
});

test.describe("accessibility (axe-core, WCAG 2.2 AA)", () => {
  test("default state", async ({ page }) => {
    await open(page);
    await axe(page, "default");
  });

  test("menu open, dialogs, find bar", async ({ page }) => {
    test.slow(); // several axe scans
    await open(page);
    await content(page).locator("p").first().click();
    await page.getByRole("button", { name: /^Text style:/ }).click();
    await axe(page, "menu open");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Insert image" }).click();
    await axe(page, "image dialog");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Keyboard shortcuts" }).click();
    await axe(page, "help dialog");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Find and replace" }).click();
    await axe(page, "find bar");
  });

  test("Arabic / RTL, dark theme, read-only", async ({ page }) => {
    await open(page, "?lang=ar");
    await expect(page.locator(".owe")).toHaveAttribute("dir", "rtl");
    await expect(content(page)).toHaveAccessibleName("Article body");
    await axe(page, "rtl");
    await open(page, "?theme=dark");
    await axe(page, "dark");
    await open(page, "?readonly=1");
    await expect(content(page)).toHaveAttribute("aria-readonly", "true");
    await axe(page, "read-only");
  });

  test("forced colors and reduced motion", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "forced-colors emulation is Chromium-only");
    await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
    await open(page);
    await axe(page, "forced-colors");
  });

  test("reflow at 320 CSS px (WCAG 1.4.10)", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await open(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await axe(page, "320px");
  });
});

test.describe("security in real engines", () => {
  const vectors = [
    `<img src=x onerror="window.__xss++">`,
    `<svg onload="window.__xss++"></svg>`,
    `<a href="javascript:window.__xss++">x</a>`,
    `<iframe srcdoc="<script>parent.__xss++</script>"></iframe>`,
    `<math><mtext><table><mglyph><style><img src=x onerror="window.__xss++">`,
    `<details open ontoggle="window.__xss++"><summary>x</summary></details>`,
    `<noscript><p title="</noscript><img src=x onerror=window.__xss++>">`,
    `<form><math><mtext></form><form><mglyph><style></math><img src onerror="window.__xss++">`,
  ];

  test("XSS corpus never executes and output stays clean", async ({ page }) => {
    await open(page);
    for (const vector of vectors) {
      await page.evaluate((v) => (window as unknown as { editor: { setContent(c: string): void } }).editor.setContent(v), vector);
    }
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => (window as unknown as { __xss: number }).__xss)).toBe(0);
    // Malformed payloads with unclosed <style> inside MathML get *blocked* by the CSP (that's the
    // policy working); anything script- or Trusted-Types-related would still fail here.
    await expectNoViolations(page, /^style-src-elem/);
  });

  test("pasting HTML is sanitized and works under Trusted Types", async ({ page }) => {
    await open(page);
    await content(page).locator("p").first().click();
    await page.evaluate(() => {
      // Word-style clipboard: <style> block + conditional comments must not trigger CSP reports.
      const html = `<html><head><style>p.MsoNormal{margin:0}</style></head><body><!--[if gte mso 9]><xml><o:x/></xml><![endif]--><p class="MsoNormal">pasted <b>bold</b><img src=x onerror="window.__xss++"><script>window.__xss++</script></p></body></html>`;
      // view.pasteHTML runs ProseMirror's real paste pipeline (transformPastedHTML → clipboard
      // parser) in every engine; Firefox ignores clipboardData on synthetic ClipboardEvents.
      (window as unknown as { editor: { view: { pasteHTML(h: string): boolean } } }).editor.view.pasteHTML(html);
    });
    await expect(content(page)).toContainText("pasted bold");
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => (window as unknown as { __xss: number }).__xss)).toBe(0);
    await expectNoViolations(page);
  });

  // Regression: Chromium applies the page CSP to inert parsing documents, so parsed style=""
  // attributes were blocked (formatting lost) and reported. They must survive, silently.
  test("inline-style formatting survives load and paste under strict CSP", async ({ page }) => {
    await open(page);
    type Win = { editor: { setContent(h: string): void; getHTML(): string; view: { pasteHTML(h: string): boolean } } };
    const loaded = await page.evaluate(() => {
      const { editor } = window as unknown as Win;
      editor.setContent(
        `<p style="text-align:center">c</p><p><span style="color:#b3261e">r</span> <mark style="background-color:#fff2a8">m</mark></p>`,
      );
      return editor.getHTML();
    });
    expect(loaded).toContain(`<p style="text-align: center"`);
    expect(loaded).toContain(`<span style="color: #b3261e">r</span>`);
    expect(loaded).toContain(`<mark style="background-color: #fff2a8">m</mark>`);

    await content(page).locator("p").last().click();
    const pasted = await page.evaluate(() => {
      const { editor } = window as unknown as Win;
      // Google Docs bold/italic + a Word list paragraph.
      editor.view.pasteHTML(
        `<b id="docs-internal-guid-1" style="font-weight:normal"><span style="font-weight:700">gd-bold</span> <span style="font-style:italic">gd-italic</span></b>` +
          `<p class="MsoListParagraph" style="mso-list:l0 level1 lfo1"><span style="mso-list:Ignore">1.<span>&nbsp;</span></span>word-item</p>`,
      );
      return editor.getHTML();
    });
    expect(pasted).toContain(`<strong>gd-bold</strong>`);
    expect(pasted).toContain(`<em>gd-italic</em>`);
    expect(pasted).toMatch(/<ol[^>]*><li><p[^>]*>word-item<\/p><\/li><\/ol>/);
    await expectNoViolations(page);
  });
});
