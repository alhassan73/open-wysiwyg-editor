import { contrastRatio } from "../core/color";

export type ThemeMode = "auto" | "light" | "dark";

/** Public design tokens, without the `--owe-` prefix. See the token table in the README. */
export const THEME_TOKENS = [
  // brand
  "brand", "brand-2", "on-brand", "primary", "primary-hover", "accent", "on-accent", "accent-soft",
  "focus", "caret", "selection", "gradient",
  // surfaces, text and borders
  "bg", "chrome", "surface", "surface-2", "field-bg", "code-bg",
  "text", "body", "text-2", "muted", "icon",
  "border", "border-subtle", "popup-border",
  "danger", "warning", "success", "mark", "shadow", "backdrop",
  // type, shape and spacing
  "font", "font-mono", "font-size", "line-height",
  "radius", "radius-sm", "radius-md", "radius-lg",
  "space", "target", "btn-size", "pad-x", "pad-y", "z-popover",
  // buttons and chrome
  "btn-color", "btn-bg", "btn-radius", "btn-hover-color", "btn-hover-bg",
  "btn-active-color", "btn-active-bg", "btn-active-hover-bg",
  "btn-primary-bg", "btn-primary-color", "btn-primary-hover-bg",
  "toolbar-bg", "toolbar-border", "editor-border", "editor-radius",
] as const;

export type ThemeToken = (typeof THEME_TOKENS)[number];

export interface ThemeOptions {
  /** Color theme. "auto" follows prefers-color-scheme. */
  theme?: ThemeMode;
  /**
   * One-color branding: any CSS color. Sets `--owe-brand` (the buttons, links, focus ring, selection
   * and bottom edge all derive from it) and picks a readable `--owe-on-brand` (black or white) when
   * the color is a hex, rgb(), hsl() or basic named color.
   */
  brand?: string;
  /** Any public design token by name, without the `--owe-` prefix: `{ bg: "#0b0d10", radius: "8px" }`. */
  tokens?: Partial<Record<ThemeToken, string>>;
}

const PREFIX = "--owe-";
const KNOWN = new Set<string>(THEME_TOKENS);
const ON_DARK = "#101112";
// Values land in a style declaration through the CSSOM, so they can't break out of it, but a token
// can still be fed to background/mask, so refuse anything that could load a resource or smuggle in
// markup: `;{}<`, backslash escapes (u\72l(), and url()/image()/image-set()/src().
const UNSAFE = /[;{}<\\]|\b(?:url|image-set|image|src|expression)\s*\(/i;
const applied = new WeakMap<HTMLElement, Set<string>>();

const safe = (value: unknown): value is string => typeof value === "string" && !!value.trim() && !UNSAFE.test(value);

/** Black or white, whichever reads better on `color`; `null` when `color` isn't a color we can parse. */
function onBrand(color: string): string | null {
  const white = contrastRatio(color, "#ffffff");
  const dark = contrastRatio(color, ON_DARK);
  return white === null || dark === null ? null : dark > white ? ON_DARK : "#ffffff";
}

/**
 * Applies the theme to an editor root (`editor.root`): sets `data-theme` and the `--owe-*` custom
 * properties through the CSSOM (CSP-safe, no inline style attribute is parsed). It describes the
 * whole theme, so properties set by an earlier call and missing now are removed again. Unknown token
 * names and unsafe values are ignored.
 */
export function applyTheme(root: HTMLElement, { theme, brand, tokens }: ThemeOptions = {}): void {
  if (theme === "light" || theme === "dark") root.dataset.theme = theme;
  else delete root.dataset.theme;

  const next = new Map<string, string>();
  if (safe(brand)) {
    next.set("brand", brand.trim());
    next.set("brand-2", "color-mix(in oklab, var(--owe-brand) 65%, white)"); // one color, one coherent gradient
    const on = onBrand(brand);
    if (on) next.set("on-brand", on);
  }
  for (const [key, value] of Object.entries(tokens ?? {})) {
    if (KNOWN.has(key) && safe(value)) next.set(key, value.trim());
  }

  for (const key of applied.get(root) ?? []) {
    if (!next.has(key)) root.style.removeProperty(PREFIX + key);
  }
  for (const [key, value] of next) root.style.setProperty(PREFIX + key, value);
  applied.set(root, new Set(next.keys()));
}
