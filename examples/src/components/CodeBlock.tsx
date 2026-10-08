import { Highlight, type PrismTheme } from "prism-react-renderer";
import { CopyButton } from "./CopyButton";

// Colors come from site.css (.token.*), so the highlighter never writes style attributes.
const THEME: PrismTheme = { plain: {}, styles: [] };

const LABELS: Record<string, string> = {
  tsx: "TSX",
  ts: "TypeScript",
  typescript: "TypeScript",
  jsx: "JSX",
  js: "JavaScript",
  markup: "HTML",
  html: "HTML",
  css: "CSS",
  json: "JSON",
  bash: "Shell",
  plain: "Text",
};

interface Props {
  code: string;
  lang?: string;
  label?: string;
}

export function CodeBlock({ code, lang = "ts", label }: Props) {
  const text = code.replace(/\n+$/, "");
  const language = lang === "bash" ? "plain" : lang;
  return (
    <figure className="code">
      <figcaption className="code-bar">
        <span className="code-lang">{LABELS[lang] ?? lang}</span>
        {label && <span className="code-file">{label}</span>}
        <CopyButton text={text} />
      </figcaption>
      <Highlight theme={THEME} code={text} language={language}>
        {({ tokens, getLineProps, getTokenProps }) => (
          // The scrollable region is focusable so keyboard users can scroll long lines.
          <pre className="code-pre" tabIndex={0} aria-label={`${label ?? LABELS[lang] ?? "Code"} example`}>
            <code>
              {tokens.map((line, i) => {
                const { className } = getLineProps({ line });
                return (
                  <span key={i} className={`code-line ${className}`}>
                    {line.map((token, k) => {
                      const { className: tokenClass, children } = getTokenProps({ token });
                      return (
                        <span key={k} className={tokenClass}>
                          {children}
                        </span>
                      );
                    })}
                  </span>
                );
              })}
            </code>
          </pre>
        )}
      </Highlight>
    </figure>
  );
}
