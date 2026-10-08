import { useEffect, useRef, useState } from "react";

interface Props {
  text: string;
  label?: string;
  className?: string;
}

/** Copies `text`. The "Copied" confirmation goes through a polite live region. */
export function CopyButton({ text, label = "Copy", className = "" }: Props) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
      return;
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button type="button" className={`copy ${className}`} onClick={copy} data-copied={copied || undefined}>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          {copied ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <path d="M9 9h10v11H9zM5 15V4h10" />}
        </svg>
        <span>{copied ? "Copied" : label}</span>
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </>
  );
}
