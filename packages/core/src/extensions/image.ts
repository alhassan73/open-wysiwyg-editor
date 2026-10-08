import { NodeSelection, type Command } from "prosemirror-state";
import type { DOMOutputSpec } from "prosemirror-model";
import { defineExtension } from "../core/extension";
import { sanitizeUrl, type UrlPolicy } from "../core/url";
import type { ImageAttrs } from "../core/types";

const dimension = (value: string | null): number | null => {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 && n < 20000 ? n : null;
};

export interface ImageOptions {
  /**
   * Called with a pasted/dropped/picked file; resolve with the uploaded URL. Without it, files are
   * not inserted (no silent base64 bloat, no network calls the integrator didn't configure).
   */
  upload: ((file: File) => Promise<string>) | null;
}

export const Image = defineExtension<ImageOptions>({
  name: "image",
  defaultOptions: { upload: null },
  nodes: (_options, { urlPolicy }) => ({
    image: {
      group: "block",
      atom: true,
      draggable: true,
      attrs: {
        src: { default: null },
        // null = not provided (the checker flags it); "" = decorative (ATAG B.2.3).
        alt: { default: null },
        title: { default: null },
        caption: { default: null },
        width: { default: null },
        height: { default: null },
      },
      parseDOM: [
        {
          tag: "figure",
          getAttrs: (el: HTMLElement) => {
            const img = el.querySelector("img");
            if (!img) return false;
            const attrs = readImg(img, urlPolicy);
            if (!attrs) return false;
            const caption = el.querySelector("figcaption")?.textContent?.trim();
            return { ...attrs, caption: caption || null };
          },
        },
        { tag: "img[src]", getAttrs: (el: HTMLElement) => readImg(el as HTMLImageElement, urlPolicy) ?? false },
      ],
      toDOM: (node) => {
        const a = node.attrs as ImageAttrs;
        const img: DOMOutputSpec = [
          "img",
          {
            src: sanitizeUrl(a.src, urlPolicy, "image"),
            alt: a.alt,
            title: a.title ?? null,
            width: a.width ? String(a.width) : null,
            height: a.height ? String(a.height) : null,
            loading: "lazy",
            decoding: "async",
          },
        ];
        return a.caption ? ["figure", img, ["figcaption", a.caption]] : img;
      },
    },
  }),
  commands: ({ schema }) => {
    const type = schema.nodes.image!;
    const policy = (schema.cached.urlPolicy as UrlPolicy | undefined) ?? {};
    const setImage =
      (attrs: ImageAttrs): Command =>
      (state, dispatch) => {
        const src = sanitizeUrl(attrs.src, policy, "image");
        if (!src) return false;
        const node = type.create({ ...normalize(attrs), src });
        if (dispatch) dispatch(state.tr.replaceSelectionWith(node).scrollIntoView());
        return true;
      };
    const updateImage =
      (attrs: Partial<ImageAttrs>): Command =>
      (state, dispatch) => {
        const sel = state.selection;
        if (!(sel instanceof NodeSelection) || sel.node.type !== type) return false;
        const next = { ...sel.node.attrs, ...normalize(attrs) };
        if (attrs.src !== undefined) {
          const src = sanitizeUrl(attrs.src, policy, "image");
          if (!src) return false;
          next.src = src;
        }
        if (dispatch) {
          const tr = state.tr.setNodeMarkup(sel.from, undefined, next);
          tr.setSelection(NodeSelection.create(tr.doc, sel.from));
          dispatch(tr);
        }
        return true;
      };
    return { setImage, updateImage };
  },
});

function readImg(img: HTMLImageElement, policy: UrlPolicy): Record<string, unknown> | null {
  const src = sanitizeUrl(img.getAttribute("src"), policy, "image");
  if (!src) return null;
  return {
    src,
    alt: img.getAttribute("alt"),
    title: img.getAttribute("title"),
    width: dimension(img.getAttribute("width")),
    height: dimension(img.getAttribute("height")),
  };
}

function normalize(attrs: Partial<ImageAttrs>): Partial<ImageAttrs> {
  const out: Partial<ImageAttrs> = {};
  if (attrs.alt !== undefined) out.alt = attrs.alt === null ? null : attrs.alt.trim();
  if (attrs.title !== undefined) out.title = attrs.title?.trim() || null;
  if (attrs.caption !== undefined) out.caption = attrs.caption?.trim() || null;
  if (attrs.width !== undefined) out.width = attrs.width ? Math.round(attrs.width) : null;
  if (attrs.height !== undefined) out.height = attrs.height ? Math.round(attrs.height) : null;
  return out;
}
