import { Plugin, PluginKey, TextSelection, type Command, type EditorState } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import type { Node as PMNode } from "prosemirror-model";
import { defineExtension } from "../core/extension";

export interface SearchQuery {
  query: string;
  caseSensitive?: boolean;
  /** Match whole words only (Unicode-aware: works for Arabic, Cyrillic, CJK word boundaries). */
  wholeWord?: boolean;
}

export interface SearchMatch {
  from: number;
  to: number;
}

export interface SearchState extends Required<SearchQuery> {
  matches: SearchMatch[];
  /** Index of the current match, or -1. */
  index: number;
}

export const searchKey = new PluginKey<SearchState>("owe-search");

const EMPTY: SearchState = { query: "", caseSensitive: false, wholeWord: false, matches: [], index: -1 };

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Finds all matches; positions map 1:1 onto UTF-16 offsets inside each textblock. */
export function findMatches(doc: PMNode, q: SearchQuery): SearchMatch[] {
  if (!q.query) return [];
  let source = escapeRegExp(q.query);
  if (q.wholeWord) source = `(?<![\\p{L}\\p{N}_\\p{M}])${source}(?![\\p{L}\\p{N}_\\p{M}])`;
  let re: RegExp;
  try {
    re = new RegExp(source, `g${q.caseSensitive ? "" : "i"}u`);
  } catch {
    return [];
  }
  const matches: SearchMatch[] = [];
  doc.descendants((node, pos) => {
    if (!node.isTextblock) return true;
    let text = "";
    node.forEach((child) => {
      // Non-text inline nodes (images, breaks) occupy one position and must break matches.
      text += child.isText ? child.text! : "￼".repeat(child.nodeSize);
    });
    for (const m of text.matchAll(re)) {
      if (!m[0]) continue;
      const from = pos + 1 + m.index!;
      matches.push({ from, to: from + m[0].length });
      if (matches.length > 10_000) return false; // keep huge documents responsive
    }
    return false;
  });
  return matches;
}

function nearestIndex(matches: SearchMatch[], pos: number): number {
  if (!matches.length) return -1;
  const i = matches.findIndex((m) => m.from >= pos);
  return i === -1 ? 0 : i;
}

export function getSearchState(state: EditorState): SearchState {
  return searchKey.getState(state) ?? EMPTY;
}

type Meta = { type: "set"; query: SearchQuery } | { type: "index"; index: number } | { type: "clear" };

const select =
  (direction: 1 | -1): Command =>
  (state, dispatch) => {
    const s = getSearchState(state);
    if (!s.matches.length) return false;
    let index: number;
    if (s.index === -1) index = direction === 1 ? nearestIndex(s.matches, state.selection.from) : s.matches.length - 1;
    else index = (s.index + direction + s.matches.length) % s.matches.length;
    const m = s.matches[index]!;
    if (dispatch) {
      dispatch(
        state.tr
          .setSelection(TextSelection.create(state.doc, m.from, m.to))
          .setMeta(searchKey, { type: "index", index } satisfies Meta)
          .scrollIntoView(),
      );
    }
    return true;
  };

export const FindReplace = defineExtension({
  name: "findReplace",
  commands: () => ({
    setSearch: (query: SearchQuery) => (state, dispatch) => {
      if (dispatch) dispatch(state.tr.setMeta(searchKey, { type: "set", query } satisfies Meta));
      return true;
    },
    clearSearch: () => (state, dispatch) => {
      if (dispatch) dispatch(state.tr.setMeta(searchKey, { type: "clear" } satisfies Meta));
      return true;
    },
    findNext: () => select(1),
    findPrevious: () => select(-1),
    replaceCurrent: (replacement: string) => (state, dispatch) => {
      const s = getSearchState(state);
      const m = s.matches[s.index];
      if (!m) return false;
      if (dispatch) {
        const tr = state.tr;
        if (replacement) tr.insertText(replacement, m.from, m.to);
        else tr.delete(m.from, m.to);
        // Move on to the next match after the replaced text.
        const next = findMatches(tr.doc, s).findIndex((x) => x.from >= tr.mapping.map(m.to));
        if (next >= 0) {
          const nm = findMatches(tr.doc, s)[next]!;
          tr.setSelection(TextSelection.create(tr.doc, nm.from, nm.to)).setMeta(searchKey, { type: "index", index: next });
        }
        dispatch(tr.scrollIntoView());
      }
      return true;
    },
    replaceAll: (replacement: string) => (state, dispatch) => {
      const s = getSearchState(state);
      if (!s.matches.length) return false;
      if (dispatch) {
        const tr = state.tr;
        // Back to front so earlier positions stay valid.
        for (const m of [...s.matches].reverse()) {
          if (replacement) tr.insertText(replacement, m.from, m.to);
          else tr.delete(m.from, m.to);
        }
        dispatch(tr);
      }
      return true;
    },
  }),
  plugins: () => [
    new Plugin<SearchState>({
      key: searchKey,
      state: {
        init: () => EMPTY,
        apply(tr, prev) {
          const meta = tr.getMeta(searchKey) as Meta | undefined;
          if (meta?.type === "clear") return EMPTY;
          if (meta?.type === "set") {
            const q = { query: meta.query.query, caseSensitive: !!meta.query.caseSensitive, wholeWord: !!meta.query.wholeWord };
            const matches = findMatches(tr.doc, q);
            return { ...q, matches, index: -1 };
          }
          if (meta?.type === "index") return { ...prev, index: meta.index };
          if (tr.docChanged && prev.query) {
            const matches = findMatches(tr.doc, prev);
            return { ...prev, matches, index: Math.min(prev.index, matches.length - 1) };
          }
          return prev;
        },
      },
      props: {
        decorations(state) {
          const s = getSearchState(state);
          if (!s.matches.length) return null;
          return DecorationSet.create(
            state.doc,
            s.matches.map((m, i) =>
              Decoration.inline(m.from, m.to, { class: i === s.index ? "owe-find-match owe-find-current" : "owe-find-match" }),
            ),
          );
        },
      },
    }),
  ],
});
