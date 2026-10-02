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
- Add a changeset for user-visible changes: `npx changeset`.
- Sign off your commits (DCO): `git commit -s`.
