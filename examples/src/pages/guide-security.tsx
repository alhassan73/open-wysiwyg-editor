import { Callout } from "../components/Callout";
import { CodeBlock } from "../components/CodeBlock";
import { Layout } from "../components/Layout";
import { PropsTable } from "../components/PropsTable";
import { PageHead, Section, P } from "../components/ui";
import { REPO } from "../content/site";
import { mount } from "../mount";

function Page() {
  return (
    <Layout path="guides/security.html" docs>
      <PageHead
        eyebrow="Guides"
        title="Security"
        lead="The editor works under a strict Content Security Policy with Trusted Types. This site itself runs under that policy."
      />

      <Section id="layers" title="Layers of defence">
        <PropsTable
          title="Security layers"
          kind="options"
          rows={[
            { name: "Input", type: "", desc: "Every input path (initial content, setContent, paste, drop, source view) passes through DOMPurify. Script-capable elements are removed before parsing." },
            { name: "Model", type: "", desc: "Only schema-known content survives, unless HtmlSupport is added, and even then its blocklist applies." },
            { name: "Output", type: "", desc: "getHTML() is produced by a serializer that does not use the DOM. It validates tag and attribute names, escapes every value and checks every URL again." },
            { name: "URLs", type: "", desc: "Allowed by default: http, https, mailto and tel, plus relative URLs. data: images are off unless urlPolicy.allowDataImages is set." },
            { name: "CSP", type: "", desc: "Works under script-src 'self'; style-src 'self'; require-trusted-types-for 'script'. The live view never writes inline style strings." },
            { name: "Trusted Types", type: "", desc: "Adds one policy named open-wysiwyg-editor to your trusted-types directive, or pass your own with setTrustedTypesPolicy()." },
          ]}
        />
      </Section>

      <Section id="csp" title="Content Security Policy">
        <P text="A recommended policy:" />
        <CodeBlock
          lang="plain"
          code={`Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self';
  img-src 'self' https: data:; require-trusted-types-for 'script';
  trusted-types open-wysiwyg-editor`}
        />
        <P text={"This documentation site ships a stricter variant as a `<meta>` tag, with `font-src 'self'`, `object-src 'none'`, `base-uri 'none'` and `form-action 'self'`. If you also forbid inline styles on pages that show saved content, use `textAlign: { output: \"class\" }` and the content stylesheet."} />
        <Callout tone="info" title="HtmlSupport and styles">
          Allowed style values are written to the output only. In the live editor they still need style-src-attr 'unsafe-inline', so leave styles out of HtmlSupport rules if you need the editor to stay fully CSP-clean.
        </Callout>
      </Section>

      <Section id="trusted-types" title="Trusted Types">
        <P text="With `require-trusted-types-for 'script'`, every HTML sink needs a trusted value. The editor creates one policy named `open-wysiwyg-editor` (list it in `trusted-types`). Its paste handling uses ProseMirror's `ProseMirrorClipboard` policy. To use your own policy, pass it to `setTrustedTypesPolicy()`." />
        <CodeBlock lang="plain" code={`trusted-types open-wysiwyg-editor ProseMirrorClipboard`} />
      </Section>

      <Section id="server" title="Sanitize on the server">
        <Callout tone="security" title="The browser is not a security boundary">
          Never trust HTML that comes from the client. The editor cleans what it loads and produces, but anyone can post any string to your API. Sanitize again on the server, with a library you trust, before you store or render it for other users.
        </Callout>
        <CodeBlock
          lang="ts"
          code={`import sanitizeHtml from "sanitize-html"; // or isomorphic-dompurify

export async function savePost(formData: FormData) {
  const body = sanitizeHtml(String(formData.get("body") ?? ""));
  // store \`body\`
}`}
        />
        <P text="Initial content from users: use the `value` attribute or a `<template>` child on `<owe-editor>`, never raw children. Neither can run anything before the editor sanitizes it." />
      </Section>

      <Section id="report" title="Reporting a vulnerability">
        <p>
          Please report vulnerabilities privately. See the <a href={`${REPO}/blob/main/SECURITY.md`} rel="noreferrer">security policy</a>.
        </p>
      </Section>
    </Layout>
  );
}

mount(<Page />);
