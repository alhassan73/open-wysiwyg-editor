import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("playground: accessible, CSP-clean, every demo works", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/apps/playground/index.html");
  await page.evaluate(() =>
    document.addEventListener("securitypolicyviolation", (e) =>
      ((window as unknown as { __v: string[] }).__v ??= []).push(e.violatedDirective),
    ),
  );
  const out = page.locator("#out");
  await expect(page.locator(".owe")).toHaveCount(3); // full, headless, Arabic
  await expect(page.locator(".owe").nth(2)).toHaveAttribute("dir", "rtl");
  await expect(out).toContainText("<h2");
  await expect(out).toContainText(`<img src="sample.svg" alt="Editor logo`);

  // Options remount the editor and keep the content.
  await page.selectOption("#opt-lang", "ar");
  await page.selectOption("#opt-theme", "dark");
  const full = page.locator(".owe").first();
  await expect(full).toHaveAttribute("dir", "rtl");
  await expect(full).toHaveAttribute("data-theme", "dark");
  await expect(full.locator(".owe-content h2")).toHaveText("Write for everyone");

  await page.selectOption("#opt-toolbar", "minimal");
  await expect(full.getByRole("button", { name: "Insert today's date" })).toBeVisible();

  // Unsafe HTML is neutralised; HtmlSupport keeps the extra (safe) markup.
  await page.click("#load-unsafe");
  await expect(out).toContainText("Safe color kept");
  // (the sample's visible text mentions "onerror" etc., so match markup, not words)
  await expect(out).not.toContainText(/ on\w+=|="javascript:|url\(|position:|<script|<iframe|<section/);
  await expect(out).toContainText(`<a href="https://example.com">`);
  await page.check("#opt-html");
  await page.click("#load-unsafe");
  await expect(out).toContainText(`<section class="card" data-id="7">`);
  expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();

  // Headless: the page's own buttons drive the editor and reflect its state.
  await page.evaluate(() => (window as unknown as { headless: { commands: { selectAll(): void } } }).headless.commands.selectAll());
  const bold = page.locator('#headless-toolbar [data-cmd="bold"]');
  await bold.click();
  await expect(bold).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#headless-editor strong")).toHaveText("Built with your own buttons.");
  await expect(page.locator('#headless-toolbar [data-cmd="undo"]')).toHaveAttribute("aria-disabled", "false");

  // Author-chosen text colors are picked for a light page, so audit in the light theme.
  await page.selectOption("#opt-theme", "light");
  await expect(full).toHaveAttribute("data-theme", "light");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious.map((v) => `${v.id} → ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);

  expect((await page.evaluate(() => (window as unknown as { __v?: string[] }).__v)) ?? []).toEqual([]);
  expect(errors.filter((e) => !/favicon/.test(e))).toEqual([]);
});
