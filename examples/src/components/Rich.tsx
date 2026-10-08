import { Fragment } from "react";

/** Plain text with `inline code` between backticks. No HTML is ever parsed. */
export function Rich({ text }: { text: string }) {
  const parts = text.split("`");
  return (
    <>
      {parts.map((part, i) =>
        i % 2 ? (
          <code className="ic" key={i}>
            {part}
          </code>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
