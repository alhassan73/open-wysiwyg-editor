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
| latest minor of the current major | ✅ |
| previous major | security fixes for 6 months after a new major |

## Security model (read this before deploying)

- **Client-side sanitization is not a security boundary.** Anyone can send arbitrary HTML to your
  server without using the editor. Always sanitize on the server before storing or rendering —
  `sanitizeHTML(html, { window })` from this package works on Node with `jsdom`/`linkedom`.
- Every HTML input path (initial content, `setContent`, paste, drop) is parsed by DOMPurify into an
  inert document and then into a strict schema; only known nodes/attributes survive.
- JSON input is validated against the schema; URLs are re-checked when rendering, so a malicious
  `href` stored in JSON is never emitted.
- HTML output is produced by a DOM-free serializer that validates tag/attribute names, escapes all
  values, drops event-handler attributes and script-capable elements, and re-checks URL attributes.
- Allowed URL schemes default to `http`, `https`, `mailto`, `tel` (+ relative). `javascript:`,
  `vbscript:`, `data:` (except opt-in raster images), `file:` and `blob:` are always refused.
- Works under a strict **Content-Security-Policy** (no `eval`, no inline scripts, no inline style
  attributes in the live editor) and **Trusted Types**:

  ```
  Content-Security-Policy: script-src 'self'; style-src 'self';
    require-trusted-types-for 'script';
    trusted-types open-wysiwyg-editor ProseMirrorClipboard dompurify;
  ```

  (`dompurify` is only needed if the `open-wysiwyg-editor` policy name is not allowed.)
- No telemetry, no license checks, no network requests unless you configure upload/embed hooks.

## Supply chain

Releases are published from GitHub Actions using npm Trusted Publishing (OIDC) with
[provenance](https://docs.npmjs.com/generating-provenance-statements). Verify with
`npm audit signatures`.
