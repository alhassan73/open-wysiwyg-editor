# Changelog

All notable changes to this project are documented here. The project follows [Semantic Versioning](https://semver.org/).

## 0.1.1

### Changed

- The npm page now links the [live demo](https://alhassan73.github.io/open-wysiwyg-editor/) as the package homepage. The README has badges and step-by-step usage for plain HTML, bundlers, HTML forms, React, Next.js, Vue, Nuxt, Angular, Svelte and Astro.
- The error thrown when `createEditor()` runs without a DOM (server-side rendering) no longer mentions a `/server` entry that doesn't exist.

### Internal

- Releases are published when a `vX.Y.Z` tag is pushed. They go through npm Trusted Publishing, so no token is needed, and each release carries a provenance attestation. Each version is developed on its own branch (e.g. `0.1.1`).
- CI runs on Node 22 and 24. pnpm 11 doesn't run on Node 20, which reached end of life in April 2026.

## 0.1.0

The first release: an accessible, RTL-first rich text editor that runs under a strict CSP, built on ProseMirror. It includes the full toolbar UI, a headless entry, English and Arabic, tables, images, links, colors, find & replace, an HTML source view, paste cleanup and optional general HTML support.
