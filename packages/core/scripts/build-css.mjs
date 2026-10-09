// Bundles src/styles/*.css into dist/style.css (editor UI + content) and dist/content.css
// (content only, for the page that displays saved HTML). No dependencies: plain concatenation, two
// small source transforms (below), and a conservative whitespace/comment minifier for the .min.css files.
//
// 1. Tokens are an API, not defaults to fight. Each --owe-<name> declared in tokens.css is renamed to a
//    private --owe-d-<name>, and every var(--owe-<name>) becomes var(--owe-<name>, var(--owe-d-<name>)).
//    The editor then never declares a public token, so one set anywhere (inline by ui.brand / ui.tokens,
//    on .owe, a wrapper or :root, in any cascade layer) always wins.
// 2. Host CSS must not restyle the editor. The stylesheets are unlayered, and every selector gets
//    BOOST appended to its subject (two classes of specificity), so Tailwind's preflight, element rules
//    and ordinary class rules lose; only a more specific selector or !important overrides the editor.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(join(root, "src/styles", name), "utf8");
const banner = "/*! open-wysiwyg-editor | MIT License */\n";

const minify = (css) =>
  css
    .replace(/\/\*(?!!)[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    // Never strip whitespace *before* ":" — `.a :is(b)` (descendant) ≠ `.a:is(b)` (compound).
    .replace(/\s*([{};,>])\s*/g, "$1")
    .replace(/:\s+/g, ":")
    .replace(/;}/g, "}")
    .trim();

// ---- 1. private token defaults --------------------------------------------------------------------
const TOKENS = new Set(
  [...read("tokens.css").matchAll(/^\s+--owe-([a-z0-9-]+)\s*:/gm)].map((m) => m[1]),
);

function privatizeTokens(css) {
  return css
    .replace(/^(\s+)--owe-([a-z0-9-]+)(\s*):/gm, (all, indent, name, space) =>
      TOKENS.has(name) ? `${indent}--owe-d-${name}${space}:` : all,
    )
    .replace(/var\(--owe-([a-z0-9-]+)\s*([,)])/g, (all, name, end) => {
      if (!TOKENS.has(name)) return all;
      // A second fallback would be swallowed into the first one: give the token its default in tokens.css.
      if (end === ",") throw new Error(`var(--owe-${name}, …) has its own fallback; remove it`);
      return `var(--owe-${name}, var(--owe-d-${name}))`;
    });
}

// ---- 2. specificity boost -------------------------------------------------------------------------
// `.\#` is a class no element has, so `:not(.\#)` matches everything and adds one class of specificity.
const BOOST = ":not(.\\#):not(.\\#)";

/** Index after a comment or string that starts at `i`, or `i` when there is none. */
function skip(css, i) {
  if (css.startsWith("/*", i)) {
    const end = css.indexOf("*/", i + 2);
    if (end < 0) throw new Error("unterminated comment");
    return end + 2;
  }
  const quote = css[i];
  if (quote === '"' || quote === "'") {
    let j = i + 1;
    while (j < css.length && css[j] !== quote) j += css[j] === "\\" ? 2 : 1;
    return j + 1;
  }
  return i;
}

/** Index of the next "{" at the current level, or -1. */
function nextOpen(css, from) {
  for (let i = from; i < css.length;) {
    const next = skip(css, i);
    if (next !== i) {
      i = next;
      continue;
    }
    if (css[i] === "{") return i;
    if (css[i] === "}") throw new Error("unexpected }");
    i++;
  }
  return -1;
}

/** Index of the "}" that closes the "{" at `open`. */
function matchClose(css, open) {
  let depth = 0;
  for (let i = open; i < css.length;) {
    const next = skip(css, i);
    if (next !== i) {
      i = next;
      continue;
    }
    if (css[i] === "{") depth++;
    else if (css[i] === "}" && --depth === 0) return i;
    i++;
  }
  throw new Error("unbalanced braces");
}

/** Splits a selector list on its top-level commas. */
function splitList(list) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth--;
    else if (c === "," && depth === 0) {
      parts.push(list.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(list.slice(start));
  return parts;
}

/** Adds BOOST to the subject of each selector, before a trailing pseudo-element. */
function boostSelectors(list) {
  return splitList(list)
    .map((selector) => {
      const [, body, pseudo = "", space] = /^([\s\S]*?)(::[a-z-]+)?(\s*)$/.exec(selector);
      return `${body}${BOOST}${pseudo}${space}`;
    })
    .join(",");
}

function boostRules(css) {
  let out = "";
  let i = 0;
  for (;;) {
    const open = nextOpen(css, i);
    if (open < 0) return out + css.slice(i);
    const close = matchClose(css, open);
    // The prelude starts after any whitespace and comments that precede it.
    let start = i;
    for (;;) {
      while (/\s/.test(css[start] ?? "")) start++;
      const next = skip(css, start);
      if (next === start) break;
      start = next;
    }
    const prelude = css.slice(start, open);
    const body = css.slice(open + 1, close);
    out += css.slice(i, start);
    if (/^@(media|supports|container)\b/.test(prelude)) out += `${prelude}{${boostRules(body)}}`;
    else if (prelude.startsWith("@"))
      out += `${prelude}{${body}}`; // @keyframes, @font-face: unchanged
    else out += `${boostSelectors(prelude)}{${body}}`;
    i = close + 1;
  }
}

// ---- bundles --------------------------------------------------------------------------------------
const outputs = {
  "style.css": ["tokens.css", "base.css", "editor.css", "ui.css", "content.css"],
  "content.css": ["tokens.css", "base.css", "content.css"],
};

mkdirSync(join(root, "dist"), { recursive: true });
for (const [file, parts] of Object.entries(outputs)) {
  const css = banner + boostRules(privatizeTokens(parts.map(read).join("\n")));
  if (/@layer\b/.test(css)) throw new Error(`${file}: the editor's CSS must stay unlayered`);
  writeFileSync(join(root, "dist", file), css);
  writeFileSync(join(root, "dist", file.replace(".css", ".min.css")), banner + minify(css));
}
console.log("css: wrote", Object.keys(outputs).join(", "));
