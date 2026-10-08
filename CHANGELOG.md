# Changelog

All notable changes to this project are documented here. The project follows [Semantic Versioning](https://semver.org/).

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
- A new website with copy-paste usage for every framework, and one README that is both the GitHub page and the npm page.

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
