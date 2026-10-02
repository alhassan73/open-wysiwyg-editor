import { Plugin, type Command } from "prosemirror-state";
import type { Mark, MarkType } from "prosemirror-model";
import { defineExtension } from "../core/extension";
import { HIGHLIGHT_PALETTE, TEXT_PALETTE, normalizeColor, type PaletteColor } from "../core/color";

/** Colors that are really "no color" in pasted content (Google Docs/Word put them everywhere). */
const NOISE_TEXT = new Set(["#000000", "#1b1f24"]);
const NOISE_TEXT_RAW = /^(inherit|initial|unset|currentcolor|windowtext|auto|black)$/i;
const NOISE_BG = /^(transparent|inherit|initial|unset|none|window|white|#fff(fff)?)$/i;

function applyColor(type: MarkType, color: string | null): Command {
  return (state, dispatch) => {
    const value = color === null ? null : normalizeColor(color);
    if (color !== null && !value) return false;
    const { from, to, empty } = state.selection;
    const tr = state.tr;
    if (empty) {
      tr.removeStoredMark(type);
      if (value) tr.addStoredMark(type.create({ color: value }));
    } else {
      // Only touch inline content that allows the mark (e.g. not inside code blocks).
      let applicable = false;
      state.doc.nodesBetween(from, to, (node, pos, parent) => {
        if (!node.isInline || !parent?.type.allowsMarkType(type)) return true;
        applicable = true;
        const start = Math.max(pos, from);
        const end = Math.min(pos + node.nodeSize, to);
        tr.removeMark(start, end, type);
        if (value) tr.addMark(start, end, type.create({ color: value }));
        return true;
      });
      if (!applicable) return false;
    }
    if (dispatch) dispatch(tr);
    return true;
  };
}

/** Live-view rendering through the CSSOM (allowed under `style-src 'self'`). */
const styledView =
  (tag: string, prop: string) =>
  (mark: Mark): { dom: HTMLElement } => {
    const dom = document.createElement(tag);
    const color = normalizeColor(mark.attrs.color);
    if (color) dom.style.setProperty(prop, color);
    return { dom };
  };

export interface TextColorOptions {
  palette: PaletteColor[];
}

export const TextColor = defineExtension<TextColorOptions>({
  name: "textColor",
  defaultOptions: { palette: TEXT_PALETTE },
  marks: () => ({
    textColor: {
      attrs: { color: { default: null } },
      parseDOM: [
        {
          style: "color",
          getAttrs: (raw: string) => {
            if (NOISE_TEXT_RAW.test(raw.trim())) return false;
            const color = normalizeColor(raw);
            return color && !NOISE_TEXT.has(color) ? { color } : false;
          },
        },
        {
          tag: "font[color]",
          getAttrs: (el: HTMLElement) => {
            const color = normalizeColor(el.getAttribute("color"));
            return color && !NOISE_TEXT.has(color) ? { color } : false;
          },
        },
      ],
      toDOM: (mark) => {
        const color = normalizeColor(mark.attrs.color);
        return ["span", color ? { style: `color: ${color}` } : {}, 0];
      },
    },
  }),
  commands: ({ schema }) => ({
    setTextColor: (color: string) => applyColor(schema.marks.textColor!, color),
    unsetTextColor: () => applyColor(schema.marks.textColor!, null),
  }),
  plugins: () => [new Plugin({ props: { markViews: { textColor: styledView("span", "color") } } })],
});

export interface HighlightOptions {
  palette: PaletteColor[];
}

export const Highlight = defineExtension<HighlightOptions>({
  name: "highlight",
  defaultOptions: { palette: HIGHLIGHT_PALETTE },
  marks: () => ({
    highlight: {
      attrs: { color: { default: null } },
      parseDOM: [
        {
          tag: "mark",
          getAttrs: (el: HTMLElement) => ({
            color: normalizeColor(el.style.backgroundColor || el.getAttribute("data-color")) ?? null,
          }),
        },
        ...["background-color", "background"].map((style) => ({
          style,
          getAttrs: (raw: string) => {
            const value = raw.trim();
            if (NOISE_BG.test(value)) return false;
            const color = normalizeColor(value);
            return color && color !== "#ffffff" ? { color } : false;
          },
        })),
      ],
      // <mark> is semantic: assistive tech can report "highlighted" text.
      toDOM: (mark) => {
        const color = normalizeColor(mark.attrs.color);
        return ["mark", color ? { style: `background-color: ${color}` } : {}, 0];
      },
    },
  }),
  commands: ({ schema, options }) => {
    const type = schema.marks.highlight!;
    return {
      setHighlight: (color?: string) => applyColor(type, color ?? options.palette[0]?.value ?? "#fff2a8"),
      unsetHighlight: () => applyColor(type, null),
      toggleHighlight: (color?: string): Command => (state, dispatch, view) => {
        const { from, to, empty, $from } = state.selection;
        const active = empty
          ? !!type.isInSet(state.storedMarks ?? $from.marks())
          : state.doc.rangeHasMark(from, to, type);
        return applyColor(type, active ? null : (color ?? options.palette[0]?.value ?? "#fff2a8"))(state, dispatch, view);
      },
    };
  },
  keymap: ({ editor }) => ({
    "Mod-Shift-h": () => editor.commands.toggleHighlight(),
  }),
  plugins: () => [new Plugin({ props: { markViews: { highlight: styledView("mark", "background-color") } } })],
});
