# Contributing

Thanks for helping! Both **pnpm** and **npm** are supported.

```bash
# pnpm                      # npm
pnpm install                npm install
pnpm run check              npm run check        # lint + typecheck + unit tests
pnpm run build              npm run build
pnpm run e2e                npm run e2e          # Playwright (Chromium, Firefox, WebKit) + axe
pnpm run dev                npm run dev          # playground
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
- Add a line to `packages/editor/CHANGELOG.md` for every user-visible change.
- Sign off your commits (DCO): `git commit -s`.

## Branches and releasing

`main` always holds the latest release, and every push to it deploys the demo. Each version also
has its own branch named after it (e.g. `0.1.1`, `0.2.0`) that keeps that release's code.

1. Create the next version branch from `main` (e.g. `0.2.0`). Update `version` in
   `packages/editor/package.json` and add the version to `packages/editor/CHANGELOG.md`.
2. When it's ready, merge it into `main`. This also deploys the demo.
3. Tag `vX.Y.Z` on `main` and push the tag:
   `git tag v0.2.0 && git push origin v0.2.0`. The release workflow checks that the tag matches
   the package version, runs `npm run check`, builds, checks bundle sizes and publishes through npm
   Trusted Publishing (no token or 2FA code; provenance included). It skips versions that are
   already on npm. Tags keep the `v` prefix so they never share a name with a branch.
