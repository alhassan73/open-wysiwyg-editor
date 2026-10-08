import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Runs against the built site (npm run site → _site/). scripts/serve-e2e.mjs serves it under the same
// base path as GitHub Pages, and the pages carry their own CSP <meta> (strict, with Trusted Types).
const BASE = "/open-wysiwyg-editor/";
const SITE = "https://alhassan73.github.io/open-wysiwyg-editor/";

const LOCALES = [
  {
    locale: "en",
    dir: "ltr",
    ogLocale: "en_US",
    author: "Alhassan Ahmed",
    breadcrumb: "Breadcrumb",
    other: "العربية",
  },
  {
    locale: "ar",
    dir: "rtl",
    ogLocale: "ar_AR",
    author: "الحسن أحمد",
    breadcrumb: "مسار التنقل",
    other: "English",
  },
] as const;

/** Routes after the language, with a trailing slash ("" is the home page). */
const ROUTES = [
  "",
  "getting-started/",
  "frameworks/",
  "frameworks/react/",
  "frameworks/vue/",
  "api/",
  "guides/",
  "guides/theming/",
] as const;
/** Every route of the site; the sitemap lists all of them in both languages. */
const ALL_ROUTES = [
  ...ROUTES,
  ...["next", "preact", "nuxt", "angular", "svelte", "solid", "astro", "web-component"].map(
    (s) => `frameworks/${s}/`,
  ),
  ...["vanilla", "others"].map((s) => `frameworks/${s}/`),
  ...["styling", "accessibility", "security", "i18n"].map((s) => `guides/${s}/`),
];

const PAGES = LOCALES.flatMap((l) =>
  ROUTES.map((route) => ({
    ...l,
    route,
    path: `${BASE}${l.locale}/${route}`,
    url: `${SITE}${l.locale}/${route}`,
  })),
);

type W = { __v?: string[] };
type Ld = { "@context"?: string; "@graph"?: Ld[]; "@type"?: string; inLanguage?: string };

async function open(page: Page, path: string) {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() =>
    document.addEventListener("securitypolicyviolation", (e) => {
      ((window as unknown as W).__v ??= []).push(`${e.violatedDirective} ${e.blockedURI}`);
    }),
  );
  await page.goto(path);
  await expect(page.locator("h1").first()).toBeVisible();
  return errors;
}

/** Scrolls the whole page once, so sections that fade in when first seen are fully shown, then back to the top. */
async function revealAll(page: Page) {
  await page.evaluate(async () => {
    const step = Math.max(200, window.innerHeight * 0.6);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForTimeout(500);
}

const demoContent = (page: Page) => page.locator("[data-testid=demo-editor] .owe-content");
const mainNav = (page: Page) => page.getByRole("navigation", { name: /^(Main|التنقل الرئيسي)$/ });

for (const p of PAGES) {
  test(`${p.locale}/${p.route}: loads with no console errors or CSP violations`, async ({
    page,
  }) => {
    test.slow();
    const errors = await open(page, p.path);
    if (p.route === "") await expect(demoContent(page)).toBeVisible(); // the editor mounted
    await page.waitForLoadState("networkidle");
    await revealAll(page);
    expect(await page.evaluate(() => (window as unknown as W).__v ?? [])).toEqual([]);
    expect(errors).toEqual([]);
  });

  test(`${p.locale}/${p.route}: SEO metadata, canonical, hreflang, breadcrumb and structured data`, async ({
    page,
  }) => {
    await open(page, p.path);
    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", p.locale);
    await expect(html).toHaveAttribute("dir", p.dir);

    await expect(page).toHaveTitle(/Open WYSIWYG Editor/);
    const meta = (selector: string) => page.locator(selector).first().getAttribute("content");
    expect((await meta('meta[name="description"]'))?.length ?? 0).toBeGreaterThan(50);
    expect(await meta('meta[name="robots"]')).toMatch(/\bindex\b/);
    expect(await meta('meta[name="robots"]')).not.toMatch(/noindex/);

    // Canonical is the page's own URL; hreflang points at the same page in each language.
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", p.url);
    for (const [hreflang, href] of [
      ["en", `${SITE}en/${p.route}`],
      ["ar", `${SITE}ar/${p.route}`],
      ["x-default", SITE], // the root, which sends each visitor to their language
    ]) {
      await expect(page.locator(`link[rel="alternate"][hreflang="${hreflang}"]`)).toHaveAttribute(
        "href",
        href!,
      );
    }

    expect(await meta('meta[property="og:image"]')).toMatch(/^https:\/\/.+\.png$/);
    expect(await meta('meta[property="og:title"]')).toBeTruthy();
    expect(await meta('meta[property="og:type"]')).toBe("website");
    expect(await meta('meta[property="og:url"]')).toBe(p.url);
    expect(await meta('meta[property="og:locale"]')).toBe(p.ogLocale);
    expect(await meta('meta[name="twitter:card"]')).toBe("summary_large_image");
    expect(await meta('meta[name="twitter:image"]')).toMatch(/^https:\/\/.+\.png$/);

    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.length).toBeGreaterThan(0);
    const data = blocks.map((b) => JSON.parse(b) as Ld);
    expect(data[0]!["@context"]).toMatch(/schema\.org/);
    const nodes = data.flatMap((d) => d["@graph"] ?? [d]);
    const types = nodes.map((n) => n["@type"]);
    if (p.route === "") {
      expect(types).toEqual(
        expect.arrayContaining(["WebSite", "SoftwareSourceCode", "SoftwareApplication"]),
      );
      expect(nodes.find((n) => n["@type"] === "WebSite")?.inLanguage).toBe(p.locale);
      await expect(page.getByRole("navigation", { name: p.breadcrumb })).toHaveCount(0);
    } else {
      // Every page below the home page has a breadcrumb: visible, and as structured data ending at the page.
      expect(types).toContain("BreadcrumbList");
      const list = nodes.find((n) => n["@type"] === "BreadcrumbList") as unknown as {
        itemListElement: { position: number; name: string; item: string }[];
      };
      expect(list.itemListElement[0]!.item).toBe(`${SITE}${p.locale}/`);
      expect(list.itemListElement.at(-1)!.item).toBe(p.url);
      list.itemListElement.forEach((it, i) => expect(it.position).toBe(i + 1));
      const crumbs = page.getByRole("navigation", { name: p.breadcrumb });
      await expect(crumbs).toBeVisible();
      await expect(crumbs.locator("[aria-current=page]")).toHaveCount(1);
    }

    // Semantics: one h1, and headings never skip a level on the way down.
    await expect(page.locator("h1")).toHaveCount(1);
    const levels = await page
      .locator("h1, h2, h3, h4, h5, h6")
      .evaluateAll((hs) => hs.map((h) => Number(h.tagName[1])));
    levels.forEach((level, i) => {
      if (i > 0)
        expect(level, `heading #${i} (h${level}) after h${levels[i - 1]}`).toBeLessThanOrEqual(
          levels[i - 1]! + 1,
        );
    });
  });
}

for (const l of LOCALES) {
  test(`${l.locale}: the footer credits the author, the copyright and the MIT license`, async ({
    page,
  }) => {
    await open(page, `${BASE}${l.locale}/`);
    const footer = page.getByRole("contentinfo");
    await expect(footer).toContainText(l.author);
    await expect(footer).toContainText("© 2026");
    await expect(footer.getByRole("link", { name: /MIT/ }).first()).toHaveAttribute(
      "href",
      /\/blob\/main\/LICENSE$/,
    );
    await expect(footer.getByRole("link", { name: l.author })).toHaveAttribute(
      "href",
      "https://github.com/alhassan73",
    );
    // The author is also in the structured data.
    const ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).join(
      "",
    );
    expect(ld).toContain('"name":"Alhassan Ahmed"');
  });
}

test("sitemap.xml, robots.txt, manifest and the social image are served", async ({
  request,
  page,
}) => {
  const sitemap = await request.get(`${BASE}sitemap.xml`);
  expect(sitemap.status()).toBe(200);
  expect(sitemap.headers()["content-type"]).toMatch(/xml/);
  const xml = await sitemap.text();
  for (const l of LOCALES) {
    for (const route of ALL_ROUTES) {
      expect(xml, `${l.locale}/${route}`).toContain(`<loc>${SITE}${l.locale}/${route}</loc>`);
    }
  }
  // Every entry names the same page in both languages and the root as the default.
  expect(xml).toContain(`hreflang="ar" href="${SITE}ar/frameworks/vue/"`);
  expect(xml).toContain(`hreflang="x-default" href="${SITE}"`);
  expect((xml.match(/<url>/g) ?? []).length).toBe(ALL_ROUTES.length * LOCALES.length);

  const robots = await request.get(`${BASE}robots.txt`);
  expect(robots.status()).toBe(200);
  const txt = await robots.text();
  expect(txt).toMatch(/user-agent: \*/i);
  expect(txt).toMatch(/allow: \//i);
  expect(txt).toContain(`${SITE}sitemap.xml`);

  await page.goto(`${BASE}en/`);
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
  // Same-origin path, so the page CSP (manifest-src falls back to 'self') allows it on any host.
  expect(manifestHref).toBe(`${BASE}manifest.webmanifest`);
  const manifest = await request.get(manifestHref!);
  expect(manifest.status()).toBe(200);
  expect((await manifest.json()).name).toBeTruthy();

  const image = await request.get(`${BASE}social-preview.png`);
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toBe("image/png");

  expect((await request.get(`${BASE}this-page-does-not-exist`)).status()).toBe(404);
  expect((await request.get(`${BASE}en/frameworks/nope/`)).status()).toBe(404);
});

test("en: the live editor types, bolds and updates the HTML and JSON output", async ({ page }) => {
  test.slow();
  await open(page, `${BASE}en/`);
  const content = demoContent(page);
  await expect(content.locator("h2")).toHaveText("Write for everyone");
  await page.waitForLoadState("networkidle"); // the editor and its extensions are loaded
  // Click into the first heading (the click places the caret there directly), go to its end, then
  // type in a new paragraph below it.
  const heading = content.locator("h2").first();
  await heading.click();
  await page.waitForFunction(() => {
    const h2 = document.querySelector("[data-testid=demo-editor] .owe-content h2");
    const node = getSelection()?.focusNode;
    return !!h2 && !!node && h2.contains(node);
  });
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Control+b");
  await page.keyboard.type("Typed live");
  await page.keyboard.press("Control+b");
  const output = page.locator("[data-testid=output]:visible");
  await expect(output).toContainText("<strong>Typed live</strong>");
  await page.getByRole("tab", { name: "JSON" }).click();
  await expect(page.locator("[data-testid=output]:visible")).toContainText('"type": "doc"');
});

test("en: the brand picker changes the editor's --owe-brand", async ({ page }) => {
  test.slow();
  await open(page, `${BASE}en/`);
  const editor = page.locator("[data-testid=demo-editor] .owe");
  await expect(editor).toBeVisible();
  const brand = () => editor.evaluate((el) => getComputedStyle(el).getPropertyValue("--owe-brand"));
  await page
    .locator("label")
    .filter({ has: page.getByRole("radio", { name: "Rose" }) })
    .click();
  await expect(page.getByRole("radio", { name: "Rose" })).toBeChecked();
  await expect(page.getByTestId("brand-value")).toHaveText(/#e11d48/i);
  await expect.poll(brand).toMatch(/e11d48/i);
  await page
    .locator("label")
    .filter({ has: page.getByRole("radio", { name: "Teal" }) })
    .click();
  await expect.poll(brand).toMatch(/0e9f8f/i);
});

test("ar: the live editor is right-to-left", async ({ page }) => {
  await open(page, `${BASE}ar/`);
  const content = demoContent(page);
  await expect(content).toBeVisible();
  await expect(content).toHaveCSS("direction", "rtl");
  await expect(page.locator("[data-testid=demo-editor] .owe")).toHaveCSS("direction", "rtl");
});

test("nav: the header links are real pages and the current one is marked", async ({ page }) => {
  await open(page, `${BASE}en/`);
  const nav = mainNav(page);
  const link = (name: string) => nav.getByRole("link", { name, exact: true });
  await expect(link("Home")).toHaveAttribute("aria-current", "page");
  await expect(link("Frameworks")).not.toHaveAttribute("aria-current", "page");

  await link("Frameworks").click();
  await expect(page).toHaveURL(/\/open-wysiwyg-editor\/en\/frameworks\/$/);
  await expect(link("Frameworks")).toHaveAttribute("aria-current", "page");
  await expect(link("Home")).not.toHaveAttribute("aria-current", "page");
  await expect(page.locator("h1")).toBeVisible();

  await link("API").click();
  await expect(page).toHaveURL(/\/en\/api\/$/);
  await expect(link("API")).toHaveAttribute("aria-current", "page");

  await link("Getting started").click();
  await expect(page).toHaveURL(/\/en\/getting-started\/$/);
  await expect(link("Getting started")).toHaveAttribute("aria-current", "page");

  await link("Guides").click();
  await expect(page).toHaveURL(/\/en\/guides\/$/);
  await expect(link("Guides")).toHaveAttribute("aria-current", "page");
});

test("frameworks: the Vue card opens the Vue page, which marks Frameworks as current", async ({
  page,
}) => {
  await open(page, `${BASE}en/frameworks/`);
  await page
    .getByRole("main")
    .getByRole("link", { name: /^Vue\b/ })
    .click();
  await expect(page).toHaveURL(/\/en\/frameworks\/vue\/$/);
  await expect(page.locator("h1")).toHaveText("Vue");
  await expect(page.getByRole("main")).toContainText("@open-wysiwyg-editor/vue");
  await expect(
    mainNav(page).getByRole("link", { name: "Frameworks", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  // The side nav marks the current framework; next/previous link to its neighbours.
  await expect(
    page.getByRole("navigation", { name: "Framework" }).getByRole("link", { name: "Vue" }),
  ).toHaveAttribute("aria-current", "page");
  await page.getByRole("link", { name: /^Next\s*Nuxt/ }).click();
  await expect(page).toHaveURL(/\/en\/frameworks\/nuxt\/$/);
});

test("home: the framework grid links to a framework page", async ({ page }) => {
  await open(page, `${BASE}en/`);
  await page
    .getByRole("main")
    .getByRole("link", { name: /^Svelte$/ })
    .click();
  await expect(page).toHaveURL(/\/en\/frameworks\/svelte\/$/);
  await expect(page.getByRole("main")).toContainText("@open-wysiwyg-editor/svelte");
});

test("api: the table of contents jumps to a section of the page", async ({ page }) => {
  await open(page, `${BASE}en/api/`);
  const toc = page.getByRole("navigation", { name: "On this page" });
  await toc.getByRole("link", { name: "Callbacks" }).click();
  await expect(page).toHaveURL(/#callbacks$/);
  await expect(page.locator("#callbacks")).toBeInViewport();
});

test("code blocks: the copy button confirms and then resets", async ({ page }) => {
  // Headless browsers deny clipboard writes without a permission prompt: record what the button writes instead.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text: string) => void ((window as { __copied?: string }).__copied = text),
      },
    });
  });
  await open(page, `${BASE}en/frameworks/react/`);
  const copy = page.getByRole("button", { name: "Copy code" }).first();
  await copy.scrollIntoViewIfNeeded();
  // Retried: a click that lands before hydration does nothing.
  await expect(async () => {
    await copy.click();
    await expect(page.getByRole("button", { name: "Copied" }).first()).toBeVisible({
      timeout: 1000,
    });
  }).toPass();
  expect(await page.evaluate(() => (window as { __copied?: string }).__copied)).toContain(
    "@open-wysiwyg-editor/react",
  );
  await expect(page.getByRole("button", { name: "Copy code" }).first()).toBeVisible({
    timeout: 5000,
  });
});

test("theme toggle switches the theme, saves it, and keeps it on other pages and languages", async ({
  page,
}) => {
  await open(page, `${BASE}en/`);
  const html = page.locator("html");
  const before = await html.getAttribute("data-theme");
  expect(before).toMatch(/^(dark|light)$/);
  const next = before === "light" ? "dark" : "light";
  await page.getByRole("button", { name: new RegExp(`${next} theme`, "i") }).click();
  await expect(html).toHaveAttribute("data-theme", next);
  expect(await page.evaluate(() => localStorage.getItem("owe-site-theme"))).toBe(next);
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", next);

  // Another page, reached through the header (a client-side navigation).
  await mainNav(page).getByRole("link", { name: "Frameworks", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/frameworks\/$/);
  await expect(html).toHaveAttribute("data-theme", next);
  // A page loaded from scratch, and the other language.
  await page.goto(`${BASE}en/frameworks/vue/`);
  await expect(html).toHaveAttribute("data-theme", next);
  await page.goto(`${BASE}ar/`);
  await expect(html).toHaveAttribute("data-theme", next);
});

test("language switch keeps the page: /en/frameworks/vue/ to /ar/frameworks/vue/ and back", async ({
  page,
}) => {
  await open(page, `${BASE}en/frameworks/vue/`);
  await page.getByRole("banner").getByRole("link", { name: "العربية" }).click();
  await expect(page).toHaveURL(/\/open-wysiwyg-editor\/ar\/frameworks\/vue\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("h1")).toHaveText("Vue");
  await page.getByRole("banner").getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/open-wysiwyg-editor\/en\/frameworks\/vue\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("language switch works from the home page and the guides", async ({ page }) => {
  await open(page, `${BASE}en/`);
  await page.getByRole("banner").getByRole("link", { name: "العربية" }).click();
  await expect(page).toHaveURL(/\/open-wysiwyg-editor\/ar\/$/);
  await page.goto(`${BASE}ar/guides/theming/`);
  await page.getByRole("banner").getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/open-wysiwyg-editor\/en\/guides\/theming\/$/);
});

test("the root forwards English browsers to /en/", async ({ page }) => {
  await page.goto(BASE);
  await expect(page).toHaveURL(/\/open-wysiwyg-editor\/en\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test.describe("Arabic browser", () => {
  test.use({ locale: "ar-EG" });
  test("the root forwards Arabic browsers to /ar/ and keeps the hash", async ({ page }) => {
    await page.goto(`${BASE}#api`);
    await expect(page).toHaveURL(/\/open-wysiwyg-editor\/ar\/#api$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  });
});

test("the root page is a language chooser with a link to each language", async ({ request }) => {
  const html = await (await request.get(BASE)).text();
  expect(html).toContain(`href="${BASE}en/"`);
  expect(html).toContain(`href="${BASE}ar/"`);
  expect(html).toMatch(/name="robots" content="noindex/);
  expect(html).toContain(`<link rel="canonical" href="${SITE}en/"`);
});

// Pages with the most varied content: the home page (editor, marquee), a framework, the long API tables, a guide.
const AXE_ROUTES = ["", "frameworks/vue/", "api/", "guides/theming/"];
for (const l of LOCALES) {
  for (const route of AXE_ROUTES) {
    for (const theme of ["dark", "light"]) {
      test(`axe: ${l.locale}/${route} (${theme}) has no violations`, async ({ page }) => {
        test.slow();
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.addInitScript((t) => localStorage.setItem("owe-site-theme", t), theme);
        await open(page, `${BASE}${l.locale}/${route}`);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await page.waitForLoadState("networkidle");
        await revealAll(page);
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        expect(
          results.violations.map(
            (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`,
          ),
        ).toEqual([]);
      });
    }
  }
}
