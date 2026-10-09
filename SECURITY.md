# Security Policy

## Reporting a vulnerability

Please **do not open a public issue**. Report privately via
[GitHub private vulnerability reporting](https://github.com/alhassan73/open-wysiwyg-editor/security/advisories/new).

We aim to acknowledge reports within 3 working days and to ship a fix for confirmed
high/critical issues within 14 days. Fixed issues are published as GitHub Security Advisories
(with a CVE where applicable) and credited to the reporter unless you prefer otherwise.

## Supported versions

| Version | Supported |
| ------- | --------- |
| 1.x (`open-wysiwyg-editor` and every `@open-wysiwyg-editor/*` package) | ✅ |
| 0.x | ❌ |

All packages share one version number and are released together, so a fix ships for all of them at once.
When a new major version is released, the previous major gets security fixes for 6 months.

## Security model (read this before deploying)

- **Client-side sanitization is not a security boundary.** Anyone can send arbitrary HTML to your
  server without using the editor. Always sanitize on the server before storing or rendering —
  `sanitizeHTML(html, { window })` from this package works on Node with `jsdom`/`linkedom`.
- Every HTML input path (initial content, `setContent`, paste, drop) is parsed by DOMPurify into an
  inert document and then into a strict schema; only known nodes/attributes survive.
- JSON input is checked against the schema's node types, and attribute values are re-checked when
  rendering: URLs, alignment, direction, list numbering, code languages, colors and HtmlSupport
  attributes. The same checks cover nodes that ProseMirror builds from a pasted clipboard's
  `data-pm-slice` context, which never go through the HTML parse rules. So a malicious `href` or a
  `textAlign` carrying extra CSS, stored in JSON or smuggled in clipboard HTML, is never emitted.
- HTML output is produced by a DOM-free serializer that validates tag/attribute names, escapes all
  values, drops event-handler attributes, script-capable elements and SVG/MathML, and re-checks URL
  attributes against the editor's `urlPolicy` (`src` and `poster` as images, the rest as links).
- Allowed URL schemes default to `http`, `https`, `mailto`, `tel` (+ relative). `javascript:`,
  `vbscript:`, `data:` (except raster images when `urlPolicy.allowDataImages` is set), `file:` and
  `blob:` are always refused, in the editor and in `getHTML()` output.
- **Custom extensions** are trusted code. The serializer re-checks what their `toDOM`/`toHTML` returns,
  but the live editing view renders `toDOM` directly. Validate stored attributes in `toDOM` (use
  `sanitizeUrl()` for URLs, and an attribute `validate` function so ProseMirror refuses bad values in
  pasted slice context), exactly as the built-in extensions do.
- Works under a strict **Content-Security-Policy** (no `eval`, no inline scripts, no inline style
  attributes in the live editor) and **Trusted Types**:

  ```
  Content-Security-Policy: script-src 'self'; style-src 'self';
    require-trusted-types-for 'script';
    trusted-types open-wysiwyg-editor ProseMirrorClipboard dompurify;
  ```

  (`dompurify` is only needed if the `open-wysiwyg-editor` policy name is not allowed.)
- No telemetry and no license checks. The editor's own code makes no network requests (an image
  upload happens only through the `upload` function you configure). The browser does fetch URLs that
  appear in the content, such as `https:` images in loaded or pasted HTML, so a pasted remote image
  contacts its host, as it would on the published page. Limit this with `urlPolicy`, your CSP's
  `img-src`, or server-side rules.

## Supply chain

Releases are published from GitHub Actions using npm Trusted Publishing (OIDC) with
[provenance](https://docs.npmjs.com/generating-provenance-statements). Verify with
`npm audit signatures`.

When loading from a CDN, pin an exact version and add Subresource Integrity (the README shows the
current `integrity` values). A floating range such as `@1` runs whatever is published next.
