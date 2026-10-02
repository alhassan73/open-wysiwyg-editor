export type TextAlign = "start" | "center" | "end" | "justify";
export type TextDirection = "ltr" | "rtl" | "auto";

export interface LinkAttrs {
  href: string;
  /** Text to insert when the selection is empty. Defaults to the URL. */
  text?: string;
  title?: string | null;
  /** Opens in a new tab; `rel="noopener noreferrer"` is always added. */
  newTab?: boolean;
}

export interface ImageAttrs {
  src: string;
  /** `null` = not provided yet (flagged by the checker); `""` = decorative. */
  alt: string | null;
  title?: string | null;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface InsertTableOptions {
  rows?: number;
  cols?: number;
  /** Default true — header rows are the accessible default (ATAG B.2.2.1). */
  withHeaderRow?: boolean;
  caption?: string | null;
}

/** ProseMirror JSON document shape. */
export interface JSONContent {
  type: string;
  attrs?: Record<string, unknown>;
  content?: JSONContent[];
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  text?: string;
}
