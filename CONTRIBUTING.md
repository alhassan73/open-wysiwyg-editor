# Contributing

Thanks for helping! Both **pnpm** and **npm** are supported.

```bash
# pnpm                      # npm
pnpm install                npm install
pnpm run check              npm run check        # lint + build + typecheck + unit tests
pnpm run build              npm run build        # every package, core first
pnpm run e2e                npm run e2e          # Playwright (Chromium, Firefox, WebKit) + axe
pnpm run dev                npm run dev          # demo site at http://localhost:5173
```

## Layout

| Path | What |
| --- | --- |
| `packages/core` | `open-wysiwyg-editor`: engine, extensions, UI, styles, `<owe-editor>`, CDN build |
| `packages/react`, `next`, `preact`, `vue`, `nuxt`, `angular`, `svelte`, `solid`, `astro` | `@open-wysiwyg-editor/*` framework packages |
| `examples/` | Documentation website and live demo: Vite + React, multi-page, built into `_site/` by `npm run site` and deployed to GitHub Pages |
| `test/e2e/` | Playwright + axe tests; fixtures in `test/e2e/fixtures` |
| `scripts/` | `serve-e2e`, `size-check`, `license-check`, `copy-styles`, `publish`, `render-banner` |
| `.github/assets/` | README banner and social preview (`node scripts/render-banner.mjs` regenerates the PNGs) |

Framework packages import the built core, so build core first (`npm run build` does this).
Work on one package with `-w`:

```bash
npm run build -w open-wysiwyg-editor
npm run build -w @open-wysiwyg-editor/vue
npm run test -w @open-wysiwyg-editor/react
npm run typecheck -w @open-wysiwyg-editor/svelte
```

Root scripts are package-manager agnostic (they use npm workspaces under the hood, which works
whichever tool installed `node_modules`). Workspace packages depend on each other with plain
semver ranges — never `workspace:` — so both tools resolve them locally.

## Ground rules

- **Accessibility is a feature, not a follow-up.** New UI must follow the WAI-ARIA Authoring
  Practices pattern it resembles, be fully keyboard operable, announce non-visual state changes,
  and pass axe (WCAG 2.2 AA; the e2e suite checks every UI state).
- **Security:** no `innerHTML`/`outerHTML`/`insertAdjacentHTML`, `eval`, `new Function`, inline
  event handlers or `style=""` strings (lint enforces most of this). Use `h()` and the CSSOM.
- **Privacy:** no network requests, storage or telemetry by default.
- **i18n:** every user-facing string goes through `editor.t()` and gets an Arabic translation.
- Add a line to `CHANGELOG.md` for every user-visible change.
- Sign off your commits (DCO): `git commit -s`.

## Branches and releasing

`main` always holds the latest release, and every push to it deploys the demo. Each version also
has its own branch named after it (e.g. `0.1.1`, `0.2.0`) that keeps that release's code.

1. Create the next version branch from `main` (e.g. `1.1.0`). Bump `version` in **every**
   package under `packages/` (all packages share one version, and framework packages depend on
   `open-wysiwyg-editor` `^X.Y.Z`), and add the version to `CHANGELOG.md` at the repo root.
2. When it's ready, merge it into `main`. This also deploys the demo.
3. Tag `vX.Y.Z` on `main` and push the tag:
   `git tag v1.1.0 && git push origin v1.1.0`. The release workflow checks that the tag matches
   every package version, runs `npm run check`, checks bundle sizes, then runs
   `scripts/publish.mjs`, which publishes each package that isn't on npm yet (core first) through
   npm Trusted Publishing (no token or 2FA code; provenance included). Tags keep the `v` prefix so
   they never share a name with a branch.

Preview what would be published with `node scripts/publish.mjs --dry-run` (after
`npm run build`). Trusted Publishing must be configured for each package on npmjs.com, and a
package must exist before that is possible, so the first publish of a new package is done by hand.
See the header of `scripts/publish.mjs`.
