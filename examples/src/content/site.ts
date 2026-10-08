export const REPO = "https://github.com/alhassan73/open-wysiwyg-editor";
export const SITE = "https://alhassan73.github.io/open-wysiwyg-editor/";
export const npmUrl = (pkg: string) => `https://www.npmjs.com/package/${pkg}`;

export interface NavItem {
  label: string;
  to: string; // path from the site root, e.g. "frameworks/react.html"
}
export interface NavGroup {
  title: string;
  items: NavItem[];
}

export interface FrameworkInfo {
  slug: string;
  name: string;
  pkg: string;
  folder: string; // packages/<folder>
  blurb: string;
  short: string; // card badge
}

export const FRAMEWORKS: FrameworkInfo[] = [
  { slug: "react", name: "React", pkg: "@open-wysiwyg-editor/react", folder: "react", short: "Re", blurb: "RichTextEditor and useEditor() for React 18+, Remix, Gatsby and Vite." },
  { slug: "next", name: "Next.js", pkg: "@open-wysiwyg-editor/next", folder: "next", short: "Nx", blurb: "Already a client component, so Server Components and Server Actions just work." },
  { slug: "preact", name: "Preact", pkg: "@open-wysiwyg-editor/preact", folder: "preact", short: "Pr", blurb: "Same API as React, on preact/hooks." },
  { slug: "vue", name: "Vue", pkg: "@open-wysiwyg-editor/vue", folder: "vue", short: "Vu", blurb: "A v-model component for Vue 3.3+." },
  { slug: "nuxt", name: "Nuxt", pkg: "@open-wysiwyg-editor/nuxt", folder: "nuxt", short: "Nu", blurb: "A module that auto-imports the component and adds the CSS." },
  { slug: "angular", name: "Angular", pkg: "@open-wysiwyg-editor/angular", folder: "angular", short: "Ng", blurb: "A standalone component for ngModel and reactive forms." },
  { slug: "svelte", name: "Svelte", pkg: "@open-wysiwyg-editor/svelte", folder: "svelte", short: "Sv", blurb: "A use:richText action for Svelte 3, 4, 5 and SvelteKit." },
  { slug: "solid", name: "Solid", pkg: "@open-wysiwyg-editor/solid", folder: "solid", short: "So", blurb: "A use:richText directive for Solid and SolidStart." },
  { slug: "astro", name: "Astro", pkg: "@open-wysiwyg-editor/astro", folder: "astro", short: "As", blurb: "An .astro component that renders the web component." },
  { slug: "web-component", name: "Web component", pkg: "open-wysiwyg-editor", folder: "core", short: "<>", blurb: "The <owe-editor> tag: forms, CMSs and any framework." },
  { slug: "vanilla", name: "Vanilla JS", pkg: "open-wysiwyg-editor", folder: "core", short: "JS", blurb: "createEditor() with a bundler, or one script tag from a CDN." },
  { slug: "others", name: "Lit, Alpine, htmx and more", pkg: "open-wysiwyg-editor", folder: "core", short: "+", blurb: "Lit, Alpine, htmx, Ember, Qwik, WordPress and PHP." },
];

export const GUIDES: NavItem[] = [
  { label: "Accessibility", to: "guides/accessibility.html" },
  { label: "Security", to: "guides/security.html" },
  { label: "Styling", to: "guides/styling.html" },
  { label: "Languages and RTL", to: "guides/i18n.html" },
];

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Start",
    items: [
      { label: "Overview", to: "index.html" },
      { label: "Getting started", to: "getting-started.html" },
    ],
  },
  {
    title: "Frameworks",
    items: [
      { label: "All frameworks", to: "frameworks/index.html" },
      ...FRAMEWORKS.map((f) => ({ label: f.name, to: `frameworks/${f.slug}.html` })),
    ],
  },
  { title: "Reference", items: [{ label: "API", to: "api.html" }] },
  { title: "Guides", items: GUIDES },
];

/** Relative link from the page at `from` to the page at `to` (both paths from the site root). */
export function rel(from: string, to: string): string {
  const depth = from.split("/").length - 1;
  return "../".repeat(depth) + to;
}
