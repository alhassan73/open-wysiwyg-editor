import { npmUrl, REPO, type FrameworkInfo } from "../content/site";

/** A framework card. The title link covers the whole card; npm and GitHub links sit above it. */
export function PackageCard({ fw, href }: { fw: FrameworkInfo; href: string }) {
  return (
    <li className="card pkg">
      <span className="pkg-badge" aria-hidden="true">
        {fw.short}
      </span>
      <h3 className="pkg-title">
        <a href={href} className="pkg-link">
          {fw.name}
        </a>
      </h3>
      <p className="pkg-text">{fw.blurb}</p>
      <p className="pkg-meta">
        <code className="ic ic-type">{fw.pkg}</code>
      </p>
      <p className="pkg-links">
        <a href={npmUrl(fw.pkg)} rel="noreferrer">
          npm<span className="sr-only"> package for {fw.name}</span>
        </a>
        <a href={`${REPO}/tree/main/packages/${fw.folder}`} rel="noreferrer">
          GitHub<span className="sr-only"> source for {fw.name}</span>
        </a>
      </p>
    </li>
  );
}
