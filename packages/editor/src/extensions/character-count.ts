import { Plugin, PluginKey } from "prosemirror-state";
import type { Node as PMNode } from "prosemirror-model";
import { defineExtension } from "../core/extension";

type Segmenter = {
  segment(input: string): Iterable<{ segment: string; isWordLike?: boolean }>;
};
type SegmenterCtor = new (locale?: string, options?: { granularity: "grapheme" | "word" }) => Segmenter;
const IntlSegmenter = (Intl as unknown as { Segmenter?: SegmenterCtor }).Segmenter;

const cache = new Map<string, Segmenter>();
function segmenter(lang: string | undefined, granularity: "grapheme" | "word"): Segmenter | null {
  if (!IntlSegmenter) return null;
  const key = `${lang ?? ""}|${granularity}`;
  let s = cache.get(key);
  if (!s) {
    try {
      s = new IntlSegmenter(lang, { granularity });
    } catch {
      s = new IntlSegmenter(undefined, { granularity });
    }
    cache.set(key, s);
  }
  return s;
}

/** User-perceived characters (grapheme clusters): "👍🏽" and "لا" with diacritics count correctly. */
export function countCharacters(text: string, lang?: string): number {
  const seg = segmenter(lang, "grapheme");
  if (!seg) return [...text].length;
  let n = 0;
  for (const segment of seg.segment(text)) if (segment) n++;
  return n;
}

/** Words via Intl.Segmenter — correct for languages without spaces (Chinese, Japanese, Thai). */
export function countWords(text: string, lang?: string): number {
  const seg = segmenter(lang, "word");
  if (!seg) return text.split(/\s+/).filter(Boolean).length;
  let n = 0;
  for (const s of seg.segment(text)) if (s.isWordLike) n++;
  return n;
}

export const docText = (doc: PMNode): string => doc.textBetween(0, doc.content.size, "\n", "\n");

export interface CharacterCountOptions {
  /** Maximum characters (grapheme clusters). Changes that would exceed it are refused. */
  limit: number | null;
}

export const characterCountKey = new PluginKey("owe-character-count");

export const CharacterCount = defineExtension<CharacterCountOptions>({
  name: "characterCount",
  defaultOptions: { limit: null },
  plugins: ({ options, editor }) => [
    new Plugin({
      key: characterCountKey,
      filterTransaction(tr, state) {
        const limit = options.limit;
        if (!limit || !tr.docChanged || tr.getMeta("addToHistory") === false) return true;
        const before = countCharacters(docText(state.doc));
        const after = countCharacters(docText(tr.doc));
        if (after <= limit || after <= before) return true;
        editor.announce(editor.t("charLimitReached"), "assertive");
        return false;
      },
    }),
  ],
});
