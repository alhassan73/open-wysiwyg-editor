import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Runs against the built site (npm run site → _site/), served with a strict CSP + Trusted Types.
const BASE = "/_site/";
const PAGES = [
  "index.html",
  "getting-started.html",
  "api.html",
  "frameworks/index.html",
  ...["react", "next", "preact", "vue", "nuxt", "angular", "svelte", "solid", "astro", "web-component", "vanilla", "others"].map(
    (s) => `frameworks/${s}.html`,
  ),
  "guides/accessibility.html",
  "guides/security.html",
  "guides/styling.html",
  "guides/i18n.html",
];

type W = { __v?: string[] };

async function open(page: Page, path: string) {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() =>
    document.addEventListener("securitypolicyviolation", (e) => {
      ((window as unknown as W).__v ??= []).push(`${e.violatedDirective} ${e.blockedURI}`);
    }),
  );
  await page.goto(BASE + path);
  await expect(page.locator("h1").first()).toBeVisible();
  return errors;
}

test("every page loads with no console errors or CSP violations", async ({ page }) => {
  test.slow(); // visits every page in turn
  for (const path of PAGES) {
    const errors = await open(page, path);
    await page.waitForLoadState("networkidle");
    expect(await page.evaluate(() => (window as unknown as W).__v ?? []), path).toEqual([]);
    expect(errors, path).toEqual([]);
    page.removeAllListeners("console");
    page.removeAllListeners("pageerror");
  }
});

test("navigation reaches every page and marks the current one", async ({ page }) => {
  await open(page, "index.html");
  const nav = page.getByRole("navigation", { name: "Main" });
  await nav.getByRole("link", { name: "Frameworks" }).click();
  await expect(page).toHaveURL(/frameworks\/index\.html$/);
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Frameworks" })).toHaveAttribute("aria-current", "page");
  await page.getByRole("navigation", { name: "Documentation" }).getByRole("link", { name: "React", exact: true }).click();
  await expect(page).toHaveURL(/frameworks\/react\.html$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("React");
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "API" }).click();
  await expect(page).toHaveURL(/api\.html$/);
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Getting started" }).click();
  await expect(page).toHaveURL(/getting-started\.html$/);
});

test("home: the live editor types, bolds and updates the HTML output", async ({ page }) => {
  await open(page, "index.html");
  const content = page.locator("[data-testid=demo-editor] .owe-content");
  await expect(content.locator("h2")).toHaveText("Write for everyone");
  await content.click();
  await page.keyboard.press("Control+End");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Control+b");
  await page.keyboard.type("Typed live");
  await page.keyboard.press("Control+b");
  const output = page.locator("[data-testid=output]:visible");
  await expect(output).toContainText("<strong>Typed live</strong>");
  await page.getByRole("tab", { name: "JSON" }).click();
  await expect(page.locator("[data-testid=output]:visible")).toContainText('"type": "doc"');
});

test("home: switching to Arabic gives an RTL editor", async ({ page }) => {
  await open(page, "index.html");
  await page.getByLabel("Interface language").selectOption("ar");
  const root = page.locator("[data-testid=demo-editor] .owe");
  await expect(root).toHaveAttribute("dir", "rtl");
  await expect(root.locator(".owe-content h2")).toHaveText("اكتب لكل الناس");
});

test("home: read-only and theme options apply", async ({ page }) => {
  await open(page, "index.html");
  await page.getByLabel("Read-only").check();
  await expect(page.locator("[data-testid=demo-editor] .owe-content")).toHaveAttribute("contenteditable", "false");
  await page.getByLabel("Editor theme").selectOption("light");
  await expect(page.locator("[data-testid=demo-editor] .owe")).toHaveAttribute("data-theme", "light");
});

test("site theme toggle switches and persists", async ({ page }) => {
  await open(page, "index.html");
  await page.getByRole("radio", { name: "Light theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("tabs on a framework page are keyboard operable", async ({ page }) => {
  await open(page, "frameworks/react.html");
  const tabs = page.getByRole("tablist", { name: "Package manager" }).getByRole("tab");
  await tabs.first().focus();
  await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowRight");
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel", { name: "pnpm" })).toContainText("pnpm add @open-wysiwyg-editor/react");
  await page.keyboard.press("End");
  await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Home");
  await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
});

test("web component page: the form demo submits its value", async ({ page }) => {
  await open(page, "frameworks/web-component.html");
  const field = page.locator("owe-editor[name=body] .owe-content");
  await expect(field).toBeVisible();
  await field.click();
  await page.keyboard.press("Control+End");
  await page.keyboard.type(" Extra words");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("form-result")).toContainText("Extra words");
  await expect(page.getByTestId("form-result")).toContainText("<p");
});

test("styling guide: the customizer sets --owe tokens", async ({ page }) => {
  await open(page, "guides/styling.html");
  await page.getByLabel("Radius", { exact: false }).fill("20");
  const radius = await page.locator("[data-testid=customizer-editor] .owe").evaluate((el) => (el as HTMLElement).style.getPropertyValue("--owe-radius"));
  expect(radius).toBe("20px");
});

test("wordmark condenses when the page scrolls", async ({ page }) => {
  await open(page, "index.html");
  const header = page.locator("header.site-header");
  await expect(header).not.toHaveAttribute("data-compact", /.*/);
  await page.mouse.wheel(0, 600);
  await expect(header).toHaveAttribute("data-compact", "");
  await page.mouse.wheel(0, -2000);
  await expect(header).not.toHaveAttribute("data-compact", /.*/);
});

for (const path of ["index.html", "getting-started.html", "frameworks/react.html", "frameworks/web-component.html", "api.html"]) {
  for (const theme of ["dark", "light"]) {
    test(`axe: ${path} (${theme}) has no violations`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem("owe-site-theme", t), theme);
      await open(page, path);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1500); // let the wordmark intro finish
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
    });
  }
}
