import { CopyButton } from "../components/CopyButton";
import { Layout } from "../components/Layout";
import { PackageCard } from "../components/PackageCard";
import { FRAMEWORKS, REPO } from "../content/site";
import { mount } from "../mount";
import { Playground } from "./Playground";

const FEATURES = [
  { title: "Formatting that stays semantic", text: "Headings, bold, italic, underline, strike, code, sub and superscript, text and highlight colors, alignment and per-block direction.", icon: "M7 5h6a3.5 3.5 0 010 7H7zM7 12h7a3.5 3.5 0 010 7H7z" },
  { title: "Real blocks", text: "Bullet, numbered and task lists, quotes, code blocks, tables with captions and header rows, images with alt text, and links.", icon: "M4 6h16M4 12h10M4 18h16" },
  { title: "WCAG 2.2 AA by design", text: "Keyboard operable with no trap, screen reader announcements, Windows High Contrast, reduced motion and a dark theme.", icon: "M12 3a9 9 0 100 18 9 9 0 000-18zM8 12l3 3 5-6" },
  { title: "Secure by default", text: "DOMPurify on every input, a URL allow-list, Trusted Types and no unsafe-inline. It runs under a strict CSP.", icon: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" },
  { title: "RTL-first", text: "English and Arabic built in, add your own. The whole UI mirrors in RTL, and every block has dir=auto.", icon: "M9 4h9M9 4v16M13 4v16M7 8L3 12l4 4" },
  { title: "Everywhere", text: "A web component for plain HTML and forms, plus packages for React, Next.js, Preact, Vue, Nuxt, Angular, Svelte, Solid and Astro.", icon: "M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" },
  { title: "Tools writers need", text: "Find and replace, HTML source view, word and character count, element path, shortcut help and Markdown-style typing.", icon: "M10 4a6 6 0 100 12 6 6 0 000-12zM15 15l5 5" },
  { title: "Yours to shape", text: "Full UI by default, headless mode for your own, custom toolbar buttons, an extensions API and theming with CSS variables.", icon: "M4 7h10M18 7h2M4 17h2M10 17h10M14 5v4M8 15v4" },
];

const FACTS = [
  { big: "WCAG 2.2 AA", small: "Accessibility target, checked with axe-core in every release" },
  { big: "3 engines", small: "Tested in Chromium, Firefox and WebKit" },
  { big: "Strict CSP", small: "No unsafe-inline, Trusted Types enforced" },
  { big: "MIT", small: "No license key, no telemetry, no cloud service" },
];

function Home() {
  const path = "index.html";
  return (
    <Layout path={path}>
      <section className="hero" aria-labelledby="hero-h">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <p className="pill">Open source · MIT · v1.0</p>
            <h1 id="hero-h">
              A rich text editor that <span className="grad-text">works everywhere</span>.
            </h1>
            <p className="hero-sub">
              Accessible, RTL-first and safe under a strict CSP. One small core and a ready-made package for every framework, from plain HTML forms to Next.js.
            </p>
            <div className="hero-cta">
              <a className="btn btn-primary btn-lg" href="getting-started.html">
                Get started
              </a>
              <a className="btn btn-ghost btn-lg" href="#demo">
                Try the live demo
              </a>
              <a className="btn btn-ghost btn-lg" href={REPO} rel="noreferrer">
                GitHub
              </a>
            </div>
            <div className="install-line">
              <code>npm install open-wysiwyg-editor</code>
              <CopyButton text="npm install open-wysiwyg-editor" />
            </div>
          </div>

          <div className="hero-card" aria-hidden="true">
            <div className="hc-bar">
              <span className="hc-ic hc-on">B</span>
              <span className="hc-ic hc-it">I</span>
              <span className="hc-ic">
                <svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" /></svg>
              </span>
              <span className="hc-sep" />
              <span className="hc-ic">
                <svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" /></svg>
              </span>
              <span className="hc-ic">
                <svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h10M4 17h16" /></svg>
              </span>
            </div>
            <div className="hc-body">
              <p className="hc-h">Write anywhere.</p>
              <p className="hc-t">
                Semantic HTML. <mark>Keyboard-first.</mark>
                <span className="hc-cur" />
              </p>
              <p className="hc-ar" lang="ar" dir="rtl">
                <mark>محرر نصوص</mark> يدعم العربية
              </p>
            </div>
            <div className="hc-foot">
              <span>
                dir=<b>auto</b>
              </span>
              <span>ltr + rtl</span>
            </div>
          </div>
        </div>
      </section>

      <section className="band" aria-labelledby="demo-h" id="demo">
        <div className="shell">
          <h2 id="demo-h" className="band-title">
            Try it right here
          </h2>
          <p className="band-sub">
            This is the real <code className="ic">&lt;RichTextEditor&gt;</code> from <code className="ic">@open-wysiwyg-editor/react</code>. Switch language, theme and toolbar, then watch the output below.
          </p>
          <Playground />
        </div>
      </section>

      <section className="band band-deep" aria-labelledby="features-h">
        <div className="shell">
          <h2 id="features-h" className="band-title">
            Everything a writer expects
          </h2>
          <p className="band-sub">And the things your users, your security team and your auditors ask for.</p>
          <ul className="grid grid-4 plain-list">
            {FEATURES.map((f) => (
              <li key={f.title} className="card feature">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="feature-icon">
                  <path d={f.icon} />
                </svg>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="band" aria-labelledby="fw-h">
        <div className="shell">
          <h2 id="fw-h" className="band-title">
            Pick your framework
          </h2>
          <p className="band-sub">Each package re-exports the whole core API and ships the stylesheets. Install one.</p>
          <ul className="grid grid-3 plain-list">
            {FRAMEWORKS.map((fw) => (
              <PackageCard key={fw.slug} fw={fw} href={`frameworks/${fw.slug}.html`} />
            ))}
          </ul>
        </div>
      </section>

      <section className="band band-deep" aria-labelledby="facts-h">
        <div className="shell">
          <h2 id="facts-h" className="band-title">
            Built to be trusted
          </h2>
          <p className="band-sub">Accessibility and security are tested on every release, not promised in a README.</p>
          <ul className="grid grid-4 plain-list">
            {FACTS.map((f) => (
              <li key={f.big} className="card fact">
                <p className="fact-big">{f.big}</p>
                <p>{f.small}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="band cta-band" aria-labelledby="cta-h">
        <div className="shell cta-inner">
          <h2 id="cta-h" className="band-title">
            Ship an editor in five minutes
          </h2>
          <p className="band-sub">Install, import the stylesheet, mount. The guide takes you through forms, saving and displaying content.</p>
          <p className="hero-cta cta-center">
            <a className="btn btn-primary btn-lg" href="getting-started.html">
              Read the getting started guide
            </a>
            <a className="btn btn-ghost btn-lg" href="frameworks/index.html">
              Browse frameworks
            </a>
          </p>
        </div>
      </section>
    </Layout>
  );
}

mount(<Home />);
