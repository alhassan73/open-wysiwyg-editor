import { Plugin, TextSelection, type Command } from "prosemirror-state";
import type { MarkSpec } from "prosemirror-model";
import { defineExtension } from "../core/extension";
import { sanitizeUrl, type UrlPolicy } from "../core/url";
import type { LinkAttrs } from "../core/types";
import { markInputRule, markRange, toggleMarkCommand } from "./helpers";

const notNormal = (value: string) => value !== "normal" && value !== "400" && value !== "lighter";

export const Bold = defineExtension({
  name: "bold",
  marks: () => ({
    bold: {
      parseDOM: [
        { tag: "strong" },
        // Google Docs wraps whole documents in <b style="font-weight:normal">.
        { tag: "b", getAttrs: (el: HTMLElement) => notNormal(el.style.fontWeight || "bold") && null },
        { style: "font-weight=400", clearMark: (m) => m.type.name === "bold" },
        { style: "font-weight", getAttrs: (v: string) => /^(bold(er)?|[6-9]\d{2})$/.test(v) && null },
      ],
      toDOM: () => ["strong", 0],
    },
  }),
  commands: ({ schema }) => ({ toggleBold: () => toggleMarkCommand(schema.marks.bold!) }),
  keymap: ({ schema }) => ({ "Mod-b": toggleMarkCommand(schema.marks.bold!) }),
  inputRules: ({ schema }) => [
    markInputRule(/(?:^|[^*\w])(\*\*([^*\s](?:[^*]*[^*\s])?)\*\*)$/, schema.marks.bold!),
    markInputRule(/(?:^|[^_\w])(__([^_\s](?:[^_]*[^_\s])?)__)$/, schema.marks.bold!),
  ],
});

export const Italic = defineExtension({
  name: "italic",
  marks: () => ({
    italic: {
      parseDOM: [
        { tag: "em" },
        { tag: "i", getAttrs: (el: HTMLElement) => el.style.fontStyle !== "normal" && null },
        { style: "font-style=normal", clearMark: (m) => m.type.name === "italic" },
        { style: "font-style=italic" },
      ],
      toDOM: () => ["em", 0],
    },
  }),
  commands: ({ schema }) => ({ toggleItalic: () => toggleMarkCommand(schema.marks.italic!) }),
  keymap: ({ schema }) => ({ "Mod-i": toggleMarkCommand(schema.marks.italic!) }),
  inputRules: ({ schema }) => [
    markInputRule(/(?:^|[^*\w])(\*([^*\s](?:[^*]*[^*\s])?)\*)$/, schema.marks.italic!),
    markInputRule(/(?:^|[^_\w])(_([^_\s](?:[^_]*[^_\s])?)_)$/, schema.marks.italic!),
  ],
});

export const Underline = defineExtension({
  name: "underline",
  marks: () => ({
    underline: {
      parseDOM: [
        { tag: "u" },
        { tag: "ins" },
        { style: "text-decoration", getAttrs: (v: string) => v.includes("underline") && null },
        { style: "text-decoration-line", getAttrs: (v: string) => v.includes("underline") && null },
      ],
      toDOM: () => ["u", 0],
    },
  }),
  commands: ({ schema }) => ({ toggleUnderline: () => toggleMarkCommand(schema.marks.underline!) }),
  keymap: ({ schema }) => ({ "Mod-u": toggleMarkCommand(schema.marks.underline!) }),
});

export const Strike = defineExtension({
  name: "strike",
  marks: () => ({
    strike: {
      parseDOM: [
        { tag: "s" },
        { tag: "del" },
        { tag: "strike" },
        { style: "text-decoration", getAttrs: (v: string) => v.includes("line-through") && null },
        { style: "text-decoration-line", getAttrs: (v: string) => v.includes("line-through") && null },
      ],
      toDOM: () => ["s", 0],
    },
  }),
  commands: ({ schema }) => ({ toggleStrike: () => toggleMarkCommand(schema.marks.strike!) }),
  keymap: ({ schema }) => ({ "Mod-Shift-s": toggleMarkCommand(schema.marks.strike!) }),
  inputRules: ({ schema }) => [
    markInputRule(/(?:^|[^~\w])(~~([^~\s](?:[^~]*[^~\s])?)~~)$/, schema.marks.strike!),
  ],
});

export const Code = defineExtension({
  name: "code",
  marks: () => ({
    code: {
      excludes: "_",
      code: true,
      parseDOM: [{ tag: "code" }],
      toDOM: () => ["code", 0],
    },
  }),
  commands: ({ schema }) => ({ toggleCode: () => toggleMarkCommand(schema.marks.code!) }),
  keymap: ({ schema }) => ({ "Mod-e": toggleMarkCommand(schema.marks.code!) }),
  inputRules: ({ schema }) => [markInputRule(/(?:^|[^`])(`([^`]+)`)$/, schema.marks.code!)],
});

const script = (tag: "sub" | "sup", align: string, excludes: string): MarkSpec => ({
  excludes,
  parseDOM: [{ tag }, { style: "vertical-align", getAttrs: (v: string) => v === align && null }],
  toDOM: () => [tag, 0],
});

export const Subscript = defineExtension({
  name: "subscript",
  marks: () => ({ subscript: script("sub", "sub", "superscript") }),
  commands: ({ schema }) => ({ toggleSubscript: () => toggleMarkCommand(schema.marks.subscript!) }),
  keymap: ({ schema }) => ({ "Mod-,": toggleMarkCommand(schema.marks.subscript!) }),
});

export const Superscript = defineExtension({
  name: "superscript",
  marks: () => ({ superscript: script("sup", "super", "subscript") }),
  commands: ({ schema }) => ({ toggleSuperscript: () => toggleMarkCommand(schema.marks.superscript!) }),
  keymap: ({ schema }) => ({ "Mod-.": toggleMarkCommand(schema.marks.superscript!) }),
});

export interface LinkOptions {
  /** Added to every link's `rel` (e.g. "nofollow ugc" for user-generated content). */
  rel: string | null;
  /** Turn a pasted URL into a link when text is selected. Default true. */
  linkOnPaste: boolean;
}

export const Link = defineExtension<LinkOptions>({
  name: "link",
  priority: 1000, // outermost mark: <a><strong>…</strong></a>
  defaultOptions: { rel: null, linkOnPaste: true },
  marks: (options, { urlPolicy }) => ({
    link: {
      attrs: {
        href: { default: null },
        target: { default: null },
        title: { default: null },
      },
      inclusive: false,
      parseDOM: [
        {
          tag: "a[href]",
          getAttrs: (el: HTMLElement) => {
            const href = sanitizeUrl(el.getAttribute("href"), urlPolicy);
            if (!href) return false; // text is kept, the unsafe link is dropped
            return {
              href,
              target: el.getAttribute("target") === "_blank" ? "_blank" : null,
              title: el.getAttribute("title"),
            };
          },
        },
      ],
      toDOM: (mark) => {
        const newTab = mark.attrs.target === "_blank";
        const rel = [newTab ? "noopener noreferrer" : null, options.rel].filter(Boolean).join(" ");
        return [
          "a",
          {
            href: sanitizeUrl(mark.attrs.href, urlPolicy),
            target: newTab ? "_blank" : null,
            rel: rel || null,
            title: mark.attrs.title,
          },
          0,
        ];
      },
    },
  }),
  commands: ({ schema }) => {
    const type = schema.marks.link!;
    const setLink =
      (attrs: LinkAttrs): Command =>
      (state, dispatch) => {
        const href = sanitizeUrl(attrs.href, readPolicy(schema));
        if (!href) return false;
        const mark = type.create({ href, target: attrs.newTab ? "_blank" : null, title: attrs.title ?? null });
        const { empty, from, to, $from } = state.selection;
        const tr = state.tr;
        if (empty) {
          const range = markRange($from, type);
          if (range) {
            // Editing an existing link in place (optionally replacing its text).
            if (attrs.text && attrs.text !== state.doc.textBetween(range.from, range.to)) {
              const kept = state.doc.resolve(range.from + 1).marks().filter((m) => m.type !== type);
              tr.replaceWith(range.from, range.to, schema.text(attrs.text, [...kept, mark]));
            } else {
              tr.removeMark(range.from, range.to, type).addMark(range.from, range.to, mark);
            }
          } else {
            const text = attrs.text || href;
            tr.insert(from, schema.text(text, [...$from.marks().filter((m) => m.type !== type), mark]));
            tr.setSelection(TextSelection.create(tr.doc, from + text.length));
          }
        } else if (attrs.text && attrs.text !== state.doc.textBetween(from, to)) {
          tr.replaceWith(from, to, schema.text(attrs.text, [mark]));
        } else {
          tr.removeMark(from, to, type).addMark(from, to, mark);
        }
        tr.removeStoredMark(type);
        if (dispatch) dispatch(tr.scrollIntoView());
        return true;
      };
    const unsetLink: Command = (state, dispatch) => {
      const { empty, from, to, $from } = state.selection;
      const range = empty ? markRange($from, type) : { from, to };
      if (!range) return false;
      if (dispatch) dispatch(state.tr.removeMark(range.from, range.to, type));
      return true;
    };
    return { setLink, unsetLink: () => unsetLink };
  },
  plugins: ({ schema, options }) =>
    options.linkOnPaste
      ? [
          new Plugin({
            props: {
              handlePaste(view, event) {
                const { empty, from, to } = view.state.selection;
                if (empty) return false;
                const text = event.clipboardData?.getData("text/plain")?.trim() ?? "";
                if (!/^(https?:\/\/|mailto:)\S+$/i.test(text)) return false;
                const href = sanitizeUrl(text, readPolicy(schema));
                if (!href) return false;
                view.dispatch(view.state.tr.addMark(from, to, schema.marks.link!.create({ href })));
                return true;
              },
            },
          }),
        ]
      : [],
});

/** The schema carries the URL policy it was built with (see buildSchema). */
function readPolicy(schema: { cached: Record<string, unknown> }): UrlPolicy {
  return (schema.cached.urlPolicy as UrlPolicy | undefined) ?? {};
}
