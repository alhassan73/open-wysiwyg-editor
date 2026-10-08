# Changelog

All notable changes to this project are documented here. The project follows [Semantic Versioning](https://semver.org/).

## 1.0.1

Theming, and a fix for dialogs in apps that use a CSS reset. Every addition is optional: with no options, the editor looks as before apart from the changes listed under "Changed".

### Added

- One-color branding. Set `ui: { brand: "#e11d48" }`, `<owe-editor brand="#e11d48">` or `.owe { --owe-brand: #e11d48 }` and the pressed toolbar buttons, dialog buttons, links, focus ring, caret, text selection and card edge follow it, in light and dark. `ui.brand` and the attribute also pick black or white text for brand-colored buttons (`--owe-on-brand`) by WCAG contrast.
- New tokens `--owe-brand` (default `#0066ff`), `--owe-brand-2` (`#00b8ff`) and `--owe-on-brand` (`#ffffff`). `--owe-primary`, `--owe-primary-hover`, `--owe-accent`, `--owe-accent-soft`, `--owe-focus`, `--owe-caret`, `--owe-selection`, `--owe-on-accent` and `--owe-gradient` are now derived from them with `color-mix()`. Setting any of those tokens yourself still wins.
- Button and chrome tokens, so a dashboard can restyle the editor without touching selectors: `--owe-btn-color`, `--owe-btn-bg`, `--owe-btn-radius`, `--owe-btn-hover-color`, `--owe-btn-hover-bg`, `--owe-btn-active-color`, `--owe-btn-active-bg`, `--owe-btn-active-hover-bg`, `--owe-btn-primary-bg`, `--owe-btn-primary-color`, `--owe-btn-primary-hover-bg`, `--owe-toolbar-bg`, `--owe-toolbar-border`, `--owe-editor-border` and `--owe-editor-radius`. They have no declared default, so they can be set on `.owe` or on any element around it.
- `ui.tokens`: set any public design token from JavaScript, by name without the `--owe-` prefix (`tokens: { bg: "#0b0d10", radius: "8px" }`). Applied through the CSSOM, so it works under a strict CSP. Unknown names and values that contain `;`, `{`, `}`, `<`, `\`, `url()`, `image()`, `image-set()` or `src()` are ignored.
- `<owe-editor>` attributes `theme` (`auto`, `light`, `dark`) and `brand`. Both follow later changes.
- `getUI(editor).setTheme({ theme, brand, tokens })` to change the theme of a running editor, and the exported `applyTheme(element, options)` it uses. The framework packages read `ui` once at start, so call `setTheme()` from your own effect when the theme changes.
- Exported `THEME_TOKENS` (the list of public token names) and the types `ThemeToken`, `ThemeOptions` and `ThemeMode`.

### Changed

- The default gradient edge of the card is now blue to cyan (`#0066ff` to `#00b8ff`). It was blue to violet to magenta. The dark theme's `--owe-mark` highlight is now a deep amber (`#6b4e00`) instead of indigo; body text on it keeps 5.7:1.
- Default link, focus-ring and caret colors are now derived from the brand: `--owe-accent` is `#003c9e` in light (was `#0057d9`, now 9.8:1 on white) and `#75a9ff` in dark (was `#4d94ff`). `--owe-focus` and `--owe-caret` follow `--owe-accent`.
- `--owe-primary-hover` is derived from `--owe-primary`, so overriding only `--owe-primary` now also changes the hover color. The dark theme no longer re-declares `--owe-primary`, `--owe-primary-hover`, `--owe-on-accent`, `--owe-accent-soft`, `--owe-focus` or `--owe-caret`, so your override of one of them applies in both themes.
- The stylesheet uses `color-mix()` (Chrome and Edge 111, Safari 16.2, Firefox 113).

### Fixed

- Dialogs (link, image, table, shortcuts) open centered in apps that use a CSS reset such as Tailwind's preflight. They relied on the browser's `margin: auto` centering of a modal `<dialog>`, which those resets remove, so they opened in the top-left corner.

## 1.0.0

The first stable release. There are no breaking changes to the 0.1 API: the only change to `open-wysiwyg-editor` is additive.

### Added

- Framework packages, each re-exporting the whole core API and shipping `style.css`, `style.min.css`, `content.css` and `content.min.css`:
  - `@open-wysiwyg-editor/react`: `<RichTextEditor>` and `useEditor()` for React 18+, Remix, Gatsby and Vite.
  - `@open-wysiwyg-editor/next`: the React package marked `"use client"`, so Server Components and Server Actions forms (via `name`) work in the App Router.
  - `@open-wysiwyg-editor/preact`: the same API as the React package, on `preact/hooks`.
  - `@open-wysiwyg-editor/vue`: `<RichTextEditor v-model>` for Vue 3.3+.
  - `@open-wysiwyg-editor/nuxt`: a Nuxt module that auto-imports `<RichTextEditor>` and adds the stylesheet.
  - `@open-wysiwyg-editor/angular`: a standalone `RichTextEditorComponent` with `ngModel` and reactive forms support (Angular 21+).
  - `@open-wysiwyg-editor/svelte`: the `use:richText` action for Svelte 3, 4 and 5 and SvelteKit.
  - `@open-wysiwyg-editor/solid`: the `use:richText` directive for Solid 1.6+ and SolidStart.
  - `@open-wysiwyg-editor/astro`: `RichTextEditor.astro`, which renders `<owe-editor>`.
- The `<owe-editor>` web component: a form-associated custom element with the attributes `name`, `placeholder`, `readonly`, `disabled`, `dir`, `content-lang`, `label`, `value`, `language` and `toolbar`, the `input` and `change` events, and initial content from `value`, a `<template>` child or its children. The CDN build defines it automatically; with a bundler, import `open-wysiwyg-editor/element`.
- `createEditor({ element: "#selector" })`: `element` now also accepts a CSS selector.
- Integration helpers for writing your own wrapper: `RUNTIME_OPTIONS`, `pickRuntimeOptions`, `sameRuntimeOptions`, `forwardCallbacks` and `syncContent`.
- A new website (one page, in English and Arabic) with copy-paste usage for every framework, and one README that is both the GitHub page and the npm page.

### Changed

- The repository layout: the editor moved to `packages/core`, the demo to `examples/` and the end-to-end tests to `test/e2e/`. The CHANGELOG moved to the repository root.
- All packages are released together, with one version number, from one `vX.Y.Z` tag through npm Trusted Publishing.

## 0.1.1

### Changed

- The npm page now links the [live demo](https://alhassan73.github.io/open-wysiwyg-editor/) as the package homepage. The README has badges and step-by-step usage for plain HTML, bundlers, HTML forms, React, Next.js, Vue, Nuxt, Angular, Svelte and Astro.
- The error thrown when `createEditor()` runs without a DOM (server-side rendering) no longer mentions a `/server` entry that doesn't exist.

### Internal

- Releases are published when a `vX.Y.Z` tag is pushed. They go through npm Trusted Publishing, so no token is needed, and each release carries a provenance attestation. Each version is developed on its own branch (e.g. `0.1.1`).
- CI runs on Node 22 and 24. pnpm 11 doesn't run on Node 20, which reached end of life in April 2026.

## 0.1.0

The first release: an accessible, RTL-first rich text editor that runs under a strict CSP, built on ProseMirror. It includes the full toolbar UI, a headless entry, English and Arabic, tables, images, links, colors, find & replace, an HTML source view, paste cleanup and optional general HTML support.
