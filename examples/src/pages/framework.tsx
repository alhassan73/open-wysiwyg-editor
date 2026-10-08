import { lazy, Suspense } from "react";
import { Callout } from "../components/Callout";
import { CodeBlock } from "../components/CodeBlock";
import { InstallTabs } from "../components/InstallTabs";
import { Layout } from "../components/Layout";
import { PropsTable } from "../components/PropsTable";
import { Rich } from "../components/Rich";
import { PageHead, Section } from "../components/ui";
import { DOCS } from "../content/frameworks";
import { FRAMEWORKS, REPO, npmUrl, rel } from "../content/site";
import { mount, slug } from "../mount";
const WebComponentDemo = lazy(() => import("./WebComponentDemo").then((m) => ({ default: m.WebComponentDemo })));

function FrameworkPage({ id }: { id: string }) {
  const fw = FRAMEWORKS.find((f) => f.slug === id)!;
  const doc = DOCS[id]!;
  const path = `frameworks/${id}.html`;
  const isCore = fw.pkg === "open-wysiwyg-editor";
  return (
    <Layout path={path} docs>
      <PageHead eyebrow="Frameworks" title={fw.name} lead={doc.lead} />
      <p className="pkg-actions">
        <a className="btn btn-ghost" href={npmUrl(fw.pkg)} rel="noreferrer">
          npm: {fw.pkg}
        </a>
        <a className="btn btn-ghost" href={`${REPO}/tree/main/packages/${fw.folder}`} rel="noreferrer">
          GitHub source
        </a>
      </p>

      <Section id="install" title="Install">
        <InstallTabs pkg={fw.pkg} />
        {doc.requires && (
          <p>
            Requires <strong>{doc.requires}</strong>.
            {!isCore && " The package depends on the core editor and re-exports its whole API, so you install only this one."}
          </p>
        )}
      </Section>

      {id === "web-component" && (
        <Section id="demo" title="Live form demo">
          <Suspense fallback={<p>Loading demo…</p>}><WebComponentDemo /></Suspense>
        </Section>
      )}

      {doc.sections.map((s) => (
        <Section key={s.id} id={s.id} title={s.title}>
          {s.text?.map((t, i) => (
            <p key={i}>
              <Rich text={t} />
            </p>
          ))}
          {s.code?.map((c, i) => <CodeBlock key={i} lang={c.lang} label={c.label} code={c.code} />)}
          {s.props && <PropsTable {...s.props} />}
          {s.callout && <Callout {...s.callout} />}
        </Section>
      ))}

      <Section id="ssr" title="Server-side rendering">
        {doc.ssr.map((t, i) => (
          <p key={i}>
            <Rich text={t} />
          </p>
        ))}
      </Section>

      <Section id="styling" title="Styling">
        {doc.styling.text.map((t, i) => (
          <p key={i}>
            <Rich text={t} />
          </p>
        ))}
        {doc.styling.code?.map((c, i) => <CodeBlock key={i} lang={c.lang} label={c.label} code={c.code} />)}
        <p>
          Theme it with CSS variables: see the <a href={rel(path, "guides/styling.html")}>styling guide</a>.
        </p>
      </Section>

      <Section id="links" title="Links">
        <ul className="plain-list">
          <li><a href={npmUrl(fw.pkg)} rel="noreferrer">{fw.pkg} on npm</a></li>
          <li><a href={`${REPO}/tree/main/packages/${fw.folder}#readme`} rel="noreferrer">README on GitHub</a></li>
          {doc.links?.map((l) => (
            <li key={l.href}><a href={l.href} rel="noreferrer">{l.label}</a></li>
          ))}
          <li><a href={rel(path, "api.html")}>API reference</a></li>
          <li><a href={rel(path, "frameworks/index.html")}>All frameworks</a></li>
        </ul>
      </Section>
    </Layout>
  );
}

mount(<FrameworkPage id={slug()} />);
