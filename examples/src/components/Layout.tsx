import { useEffect, useRef, useState, type ReactNode } from "react";
import { FRAMEWORKS, NAV_GROUPS, REPO, npmUrl, rel } from "../content/site";
import { ThemeToggle } from "./ThemeToggle";
import { Wordmark } from "./Wordmark";

interface Props {
  /** Path of this page from the site root, e.g. "frameworks/react.html". */
  path: string;
  /** Show the documentation sidebar. */
  docs?: boolean;
  children: ReactNode;
}

const TOP = [
  { label: "Getting started", to: "getting-started.html", match: (p: string) => p === "getting-started.html" },
  { label: "Frameworks", to: "frameworks/index.html", match: (p: string) => p.startsWith("frameworks/") },
  { label: "API", to: "api.html", match: (p: string) => p === "api.html" },
  { label: "Guides", to: "guides/accessibility.html", match: (p: string) => p.startsWith("guides/") },
];

export function Layout({ path, docs = false, children }: Props) {
  const header = useRef<HTMLElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState(false);
  const [side, setSide] = useState(false);
  const href = (to: string) => rel(path, to);

  // The wordmark condenses once the page has scrolled past the sentinel (no scroll listener).
  useEffect(() => {
    const el = sentinel.current;
    const bar = header.current;
    if (!el || !bar || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => {
      bar.toggleAttribute("data-compact", !entry!.isIntersecting);
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!menu) return;
    const close = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [menu]);

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div className="scroll-sentinel" ref={sentinel} aria-hidden="true" />
      <header className="site-header" ref={header}>
        <div className="shell header-row">
          <a className="brand" href={href("index.html")} aria-label="Open WYSIWYG Editor — home">
            <Wordmark />
          </a>
          <nav className="main-nav" aria-label="Main" data-open={menu || undefined} id="main-nav">
            <ul>
              {TOP.map((item) => (
                <li key={item.to}>
                  <a href={href(item.to)} aria-current={item.match(path) ? "page" : undefined}>
                    {item.label}
                  </a>
                </li>
              ))}
              <li className="nav-ext">
                <a href={REPO} rel="noreferrer">
                  GitHub
                </a>
              </li>
              <li className="nav-theme">
                <ThemeToggle />
              </li>
              <li className="nav-ext">
                <a href={npmUrl("open-wysiwyg-editor")} rel="noreferrer">
                  npm
                </a>
              </li>
            </ul>
          </nav>
          <div className="header-actions">
            <div className="header-theme">
              <ThemeToggle />
            </div>
            <button
              type="button"
              className="menu-btn"
              aria-expanded={menu}
              aria-controls="main-nav"
              onClick={() => setMenu((v) => !v)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d={menu ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"} />
              </svg>
              <span className="sr-only">Menu</span>
            </button>
          </div>
        </div>
      </header>

      {docs ? (
        <div className="shell docs-grid">
          <div className="sidebar">
            <button
              type="button"
              className="side-btn"
              aria-expanded={side}
              aria-controls="docs-nav"
              onClick={() => setSide((v) => !v)}
            >
              Documentation menu
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d={side ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"} />
              </svg>
            </button>
            <nav aria-label="Documentation" id="docs-nav" data-open={side || undefined}>
              {NAV_GROUPS.map((group) => (
                <div key={group.title} className="side-group">
                  <p className="side-title">{group.title}</p>
                  <ul>
                    {group.items.map((item) => (
                      <li key={item.to}>
                        <a href={href(item.to)} aria-current={item.to === path ? "page" : undefined}>
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
          <main id="main" className="doc" tabIndex={-1}>
            {children}
          </main>
        </div>
      ) : (
        <main id="main" tabIndex={-1}>
          {children}
        </main>
      )}

      <footer className="site-footer">
        <div className="shell footer-grid">
          <div className="footer-brand">
            <a href={href("index.html")} aria-label="Open WYSIWYG Editor — home">
              <Wordmark variant="static" />
            </a>
            <p>An accessible, RTL-first rich text editor for every framework. MIT licensed. No license key, no telemetry.</p>
          </div>
          <nav aria-label="Footer: documentation">
            <p className="footer-title">Documentation</p>
            <ul>
              <li><a href={href("getting-started.html")}>Getting started</a></li>
              <li><a href={href("frameworks/index.html")}>Frameworks</a></li>
              <li><a href={href("api.html")}>API</a></li>
              <li><a href={href("guides/accessibility.html")}>Accessibility</a></li>
              <li><a href={href("guides/security.html")}>Security</a></li>
            </ul>
          </nav>
          <nav aria-label="Footer: packages">
            <p className="footer-title">Packages</p>
            <ul>
              {FRAMEWORKS.filter((f) => f.pkg !== "open-wysiwyg-editor")
                .slice(0, 5)
                .map((f) => (
                  <li key={f.slug}>
                    <a href={href(`frameworks/${f.slug}.html`)}>{f.name}</a>
                  </li>
                ))}
              <li><a href={href("frameworks/index.html")}>All frameworks</a></li>
            </ul>
          </nav>
          <nav aria-label="Footer: project">
            <p className="footer-title">Project</p>
            <ul>
              <li><a href={REPO} rel="noreferrer">GitHub</a></li>
              <li><a href={npmUrl("open-wysiwyg-editor")} rel="noreferrer">npm</a></li>
              <li><a href={`${REPO}/blob/main/CHANGELOG.md`} rel="noreferrer">Changelog</a></li>
              <li><a href={`${REPO}/blob/main/SECURITY.md`} rel="noreferrer">Security policy</a></li>
              <li><a href={`${REPO}/blob/main/LICENSE`} rel="noreferrer">MIT license</a></li>
            </ul>
          </nav>
        </div>
      </footer>
    </>
  );
}
