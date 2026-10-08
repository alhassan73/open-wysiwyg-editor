# Open WYSIWYG Editor

[![npm version](https://img.shields.io/npm/v/open-wysiwyg-editor)](https://www.npmjs.com/package/open-wysiwyg-editor)
[![bundle size](https://img.shields.io/bundlephobia/minzip/open-wysiwyg-editor)](https://bundlephobia.com/package/open-wysiwyg-editor)
[![license](https://img.shields.io/npm/l/open-wysiwyg-editor)](LICENSE)

**[Live demo →](https://alhassan73.github.io/open-wysiwyg-editor/)** · [npm](https://www.npmjs.com/package/open-wysiwyg-editor) · [Documentation](packages/editor/README.md) · [Changelog](packages/editor/CHANGELOG.md)

An accessible rich text editor that works on **any website**: plain HTML/JS, React, Next.js, Vue, Nuxt, Angular, Svelte, Astro, WordPress and more. It's RTL-first, it runs under a strict Content Security Policy, and it's released under the MIT license.

```bash
npm install open-wysiwyg-editor
```

```js
import { createEditor } from "open-wysiwyg-editor";
import "open-wysiwyg-editor/style.css";

const editor = createEditor({ element: document.querySelector("#editor") });
```

Usage for every framework, plus the full API, is in the **[package documentation](packages/editor/README.md)**. The same page is shown on npm.

## Repository layout

| Path | What |
| --- | --- |
| `packages/editor` | The `open-wysiwyg-editor` npm package: the engine, extensions, UI and styles |
| `apps/playground` | The demo page, served under a strict CSP with Trusted Types. Every push to `main` publishes it to GitHub Pages. `npm run build && npm run site` builds it locally into `_site/` |
| `e2e` | Playwright tests (Chromium, Firefox, WebKit) with axe-core |

## Development

Either npm or pnpm works, and both lockfiles are kept up to date. Node 22 or later is required.

```sh
npm install          # or: pnpm install
npm run build        # or: pnpm build
npm run dev          # playground at http://localhost:5173
npm run check        # lint, then typecheck, then unit tests
npx playwright install --with-deps   # first time only
npm run e2e          # end-to-end and accessibility tests
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the branch and release workflow, and [SECURITY.md](SECURITY.md) for how to report vulnerabilities.

## License

[MIT](LICENSE) © alhassan-ahmed
