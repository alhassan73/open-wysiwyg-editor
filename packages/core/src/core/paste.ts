import { sanitizeToFragment, STYLE_DATA_ATTR } from "./sanitize";
import { sanitizeUrl, type UrlPolicy } from "./url";

// Styles are still raw text here (see protectStyles), so Office-only properties like mso-list survive.
const STYLED = `[${STYLE_DATA_ATTR}]`;

export interface PasteResult {
  html: string;
  /** Something the author pasted couldn't be kept (e.g. local file:/// images from Word). */
  dropped: boolean;
  /** Office/Google Docs markup was normalized. */
  cleaned: boolean;
}

const WORD = /urn:schemas-microsoft-com:office|class=["']?Mso|mso-[a-z-]+:/i;
const GDOCS = /id=["']?docs-internal-guid/i;
const MSO_IGNORE = /mso-list\s*:\s*ignore/i;
const MSO_LEVEL = /mso-list\s*:[^;"]*level(\d+)/i;
const BULLETS = /^[•·▪●◦–—o§·•▪●◦\-*]$/;
const ORDERED = /^\(?([0-9]{1,4}|[a-zA-Z]|[ivxlcdmIVXLCDM]{1,6})[.)]$/;
const BLOCKS = ":scope > :is(p, h1, h2, h3, h4, h5, h6, div, ul, ol, table, blockquote, pre)";

/**
 * Cleans clipboard HTML: sanitizes it, rebuilds Word's paragraph-based lists as real nested
 * lists, repairs Google Docs list nesting, removes Office-only markup, and drops images whose
 * source can't be used. Accessibility semantics (headings, lists, table headers, alt, lang, dir)
 * are preserved (ATAG B.1.2).
 */
export function cleanPastedHTML(input: string, policy: UrlPolicy = {}): PasteResult {
  const fragment = sanitizeToFragment(input);
  if (!fragment.ownerDocument) return { html: "", dropped: false, cleaned: false };
  // Work inside a container in the same inert document.
  const root = fragment.ownerDocument.createElement("div");
  root.append(fragment);
  const isWord = WORD.test(input);
  const isGDocs = GDOCS.test(input);
  let cleaned = false;
  let dropped = false;

  if (isWord) {
    convertWordLists(root);
    for (const el of [...root.querySelectorAll<HTMLElement>(STYLED)]) {
      if (MSO_IGNORE.test(el.getAttribute(STYLE_DATA_ATTR) ?? "")) el.remove();
    }
    // Wrappers emptied by the marker removal (e.g. <span style="font-family:Symbol"></span>).
    for (const span of [...root.querySelectorAll("span")].reverse()) {
      if (!span.textContent && !span.querySelector("img, br")) span.remove();
    }
    cleaned = true;
  }
  if (isGDocs) {
    // Google Docs marks every paragraph dir="ltr"; let the editor auto-detect instead so the
    // document's own direction (e.g. Arabic) isn't overridden paragraph by paragraph.
    for (const el of root.querySelectorAll("[dir]")) el.removeAttribute("dir");
    cleaned = true;
  }
  cleaned = nestLooseLists(root) || cleaned;
  cleaned = nestAriaLevelLists(root) || cleaned;

  for (const img of [...root.querySelectorAll("img")]) {
    if (!sanitizeUrl(img.getAttribute("src"), policy, "image")) {
      img.remove();
      dropped = true;
    }
  }
  for (const font of [...root.querySelectorAll("font")]) font.replaceWith(...font.childNodes);

  return { html: serializeInert(root), dropped, cleaned };
}

/** Serializes children of an element that lives in DOMPurify's inert document. */
function serializeInert(container: HTMLElement): string {
  // Getter only (not a Trusted Types sink): the markup is re-parsed by ProseMirror's clipboard
  // parser next, exactly like DOMPurify's own string output.
  // eslint-disable-next-line no-restricted-properties
  return container.innerHTML;
}

function isWordListParagraph(el: Element): boolean {
  return el.tagName === "P" && /mso-list\s*:/i.test(el.getAttribute(STYLE_DATA_ATTR) ?? "") && !MSO_IGNORE.test(el.getAttribute(STYLE_DATA_ATTR) ?? "");
}

function markerOf(p: Element): string {
  const ignore = [...p.querySelectorAll(STYLED)].find((el) => MSO_IGNORE.test(el.getAttribute(STYLE_DATA_ATTR) ?? ""));
  const text = (ignore?.textContent ?? "").trim(); // trim() also strips no-break spaces
  ignore?.remove();
  return text;
}

/** Word writes lists as <p style="mso-list:l0 level2 lfo1"> siblings; rebuild real nesting. */
function convertWordLists(root: HTMLElement): boolean {
  const parents = new Set<Element>();
  for (const p of root.querySelectorAll("p")) if (isWordListParagraph(p) && p.parentElement) parents.add(p.parentElement);
  let changed = false;
  for (const parent of parents) {
    const children = [...parent.children];
    for (let i = 0; i < children.length; ) {
      if (!isWordListParagraph(children[i]!)) {
        i++;
        continue;
      }
      const run: Element[] = [];
      while (i < children.length && isWordListParagraph(children[i]!)) run.push(children[i++]!);
      buildNestedList(run, (p) => {
        const level = Number(MSO_LEVEL.exec(p.getAttribute(STYLE_DATA_ATTR) ?? "")?.[1] ?? 1);
        const marker = markerOf(p);
        const ordered = ORDERED.test(marker) && !BULLETS.test(marker);
        const start = ordered && /^\d+/.test(marker) ? Number.parseInt(marker, 10) : 1;
        return { level, ordered, start };
      });
      changed = true;
    }
  }
  return changed;
}

interface ItemInfo {
  level: number;
  ordered: boolean;
  start: number;
}

/** Turns a run of sibling "item" elements (with levels) into nested <ul>/<ol>. */
function buildNestedList(run: Element[], info: (el: Element) => ItemInfo): void {
  const doc = run[0]!.ownerDocument;
  const stack: Array<{ level: number; list: HTMLElement; last: HTMLElement | null }> = [];
  const anchor = doc.createElement("div");
  run[0]!.before(anchor);
  for (const el of run) {
    const { level, ordered, start } = info(el);
    while (stack.length && stack[stack.length - 1]!.level > level) stack.pop();
    let top = stack[stack.length - 1];
    if (!top || top.level < level) {
      const list = doc.createElement(ordered ? "ol" : "ul");
      if (ordered && start > 1) list.setAttribute("start", String(start));
      if (top?.last) top.last.append(list);
      else if (top) top.list.append(doc.createElement("li"), list);
      else anchor.append(list);
      top = { level, list, last: null };
      stack.push(top);
    }
    const li = doc.createElement("li");
    if (el.querySelector(BLOCKS)) {
      li.append(...el.childNodes); // already block content (Google Docs <li><p>…</p></li>)
    } else {
      const p = doc.createElement("p");
      p.append(...el.childNodes);
      for (const attr of ["dir", "lang"]) {
        const v = el.getAttribute(attr);
        if (v) p.setAttribute(attr, v);
      }
      li.append(p);
    }
    top.list.append(li);
    top.last = li;
    el.remove();
  }
  anchor.replaceWith(...anchor.childNodes);
}

/** <ul><li>a</li><ul><li>b</li></ul></ul> (invalid, produced by Google Docs) → proper nesting. */
function nestLooseLists(root: HTMLElement): boolean {
  let changed = false;
  for (const list of [...root.querySelectorAll("ul > ul, ul > ol, ol > ul, ol > ol")]) {
    const prev = list.previousElementSibling;
    if (prev?.tagName === "LI") prev.append(list);
    else {
      const li = list.ownerDocument.createElement("li");
      list.before(li);
      li.append(list);
    }
    changed = true;
  }
  return changed;
}

/** Flat lists whose items carry aria-level (Google Docs) → nested lists. */
function nestAriaLevelLists(root: HTMLElement): boolean {
  let changed = false;
  for (const list of [...root.querySelectorAll("ul, ol")]) {
    const items = [...list.children].filter((c) => c.tagName === "LI");
    const levels = items.map((li) => Number(li.getAttribute("aria-level") ?? 1));
    if (items.length < 2 || levels.every((l) => l === levels[0])) continue;
    const ordered = list.tagName === "OL";
    const wrapper = list.ownerDocument.createElement("div");
    list.before(wrapper);
    for (const li of items) {
      const item = list.ownerDocument.createElement("div");
      item.append(...li.childNodes);
      item.setAttribute("data-level", li.getAttribute("aria-level") ?? "1");
      wrapper.append(item);
    }
    list.remove();
    buildNestedList([...wrapper.children], (el) => ({
      level: Number(el.getAttribute("data-level")),
      ordered,
      start: 1,
    }));
    wrapper.replaceWith(...wrapper.childNodes);
    changed = true;
  }
  return changed;
}
