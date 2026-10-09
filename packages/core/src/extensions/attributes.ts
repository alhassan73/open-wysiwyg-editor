import type { Mark, Node as PMNode } from "prosemirror-model";
import { defineExtension } from "../core/extension";
import type { TextAlign as Align, TextDirection as Dir } from "../core/types";
import { setBlockAttrs } from "./helpers";

const ALIGNMENTS: Align[] = ["start", "center", "end", "justify"];
const DIRECTIONS: Dir[] = ["ltr", "rtl", "auto"];

// Stored values are re-checked when rendering: JSON content and clipboard slice context
// (data-pm-slice) create nodes without running parseHTML.
const alignOf = (value: unknown): Align | null =>
  value !== "start" && ALIGNMENTS.includes(value as Align) ? (value as Align) : null;
const dirOf = (value: unknown): Dir | null => (DIRECTIONS.includes(value as Dir) ? (value as Dir) : null);

export interface TextAlignOptions {
  types: string[];
  /**
   * How alignment is written to HTML output. "style" (default) is portable; "class" emits
   * `owe-align-*` classes for sites whose CSP forbids inline styles in published content.
   * The live editor always uses classes, so it works under strict CSP either way.
   */
  output: "style" | "class";
}

export const TextAlign = defineExtension<TextAlignOptions>({
  name: "textAlign",
  defaultOptions: { types: ["paragraph", "heading"], output: "style" },
  globalAttributes: ({ types, output }) => [
    {
      types,
      attributes: {
        textAlign: {
          default: null,
          parseHTML: (el) => {
            const raw = (el.style.textAlign || el.getAttribute("align") || "").toLowerCase();
            if (raw === "left" || raw === "right") {
              // Physical → logical, using the nearest explicit direction.
              const rtl = el.closest("[dir]")?.getAttribute("dir") === "rtl";
              return (raw === "left") !== rtl ? null : "end"; // start is the default (null)
            }
            return ALIGNMENTS.includes(raw as Align) && raw !== "start" ? raw : null;
          },
          renderHTML: (value): Record<string, string> | null => {
            const align = alignOf(value);
            if (!align) return null;
            return output === "class" ? { class: `owe-align-${align}` } : { style: `text-align: ${align}` };
          },
          renderDOM: (value): Record<string, string> | null => {
            const align = alignOf(value);
            return align ? { class: `owe-align-${align}` } : null;
          },
        },
      },
    },
  ],
  commands: ({ options }) => ({
    setTextAlign: (align: Align) =>
      ALIGNMENTS.includes(align) ? setBlockAttrs(options.types, { textAlign: align === "start" ? null : align }) : () => false,
    unsetTextAlign: () => setBlockAttrs(options.types, { textAlign: null }),
  }),
  keymap: ({ options }) => ({
    "Mod-Shift-l": setBlockAttrs(options.types, { textAlign: null }),
    "Mod-Shift-e": setBlockAttrs(options.types, { textAlign: "center" }),
    "Mod-Shift-r": setBlockAttrs(options.types, { textAlign: "end" }),
    "Mod-Shift-j": setBlockAttrs(options.types, { textAlign: "justify" }),
  }),
});

export interface TextDirectionOptions {
  types: string[];
  /**
   * Blocks without an explicit direction get `dir="auto"`, so a paragraph typed in Arabic inside
   * an English document (or vice versa) displays correctly while editing *and* when published.
   */
  autoDetect: boolean;
}

export const TextDirection = defineExtension<TextDirectionOptions>({
  name: "textDirection",
  defaultOptions: {
    types: ["paragraph", "heading", "blockquote", "bulletList", "orderedList", "taskList", "table"],
    autoDetect: true,
  },
  globalAttributes: ({ types, autoDetect }) => {
    const textblocks: string[] = types.filter((t) => t === "paragraph" || t === "heading");
    const containers = types.filter((t) => !textblocks.includes(t));
    const attr = (auto: boolean) => ({
      dir: {
        default: null,
        parseHTML: (el: HTMLElement) => dirOf(el.getAttribute("dir")?.toLowerCase()),
        // Empty blocks inherit the editor direction so the caret starts on the correct side.
        renderHTML: (value: unknown, node: PMNode | Mark) => {
          const dir = dirOf(value);
          return dir ? { dir } : auto && "content" in node && node.content.size > 0 ? { dir: "auto" } : null;
        },
      },
    });
    return [
      { types: textblocks, attributes: attr(autoDetect) },
      { types: containers, attributes: attr(false) },
    ];
  },
  commands: ({ options }) => ({
    setTextDirection: (dir: Dir) =>
      dir === "ltr" || dir === "rtl" || dir === "auto"
        ? setBlockAttrs(options.types, { dir })
        : () => false,
    unsetTextDirection: () => setBlockAttrs(options.types, { dir: null }),
  }),
});
