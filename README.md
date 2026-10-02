# open-wysiwyg-editor

An accessible rich text editor that is RTL-first and safe under a strict CSP. It works in plain JavaScript and in any framework, and is released under the MIT license.

**Live demo:** https://alhassan73.github.io/open-wysiwyg-editor/ · **Package documentation:** [packages/editor/README.md](packages/editor/README.md)

## Repository layout

| Path | What |
| --- | --- |
| `packages/editor` | The `open-wysiwyg-editor` npm package: the engine, extensions, UI and styles |
| `apps/playground` | Demo page, served under a strict CSP with Trusted Types; published to GitHub Pages on every push to `main` (`npm run build && npm run site` builds it locally into `_site/`) |
| `e2e` | Playwright tests (Chromium, Firefox, WebKit) with axe-core |

## Development

Either npm or pnpm works. Both lockfiles are kept up to date. Node 20 or later is required.

```sh
npm install          # or: pnpm install
npm run build        # or: pnpm build
npm run dev          # playground at http://localhost:5173
npm run check        # lint, then typecheck, then unit tests
npx playwright install --with-deps   # first time only
npm run e2e          # end-to-end and accessibility tests
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow (including changesets) and [SECURITY.md](SECURITY.md) for how to report vulnerabilities.

## License

[MIT](LICENSE)
