/** Color parsing, validation and WCAG contrast — no CSS strings are ever trusted as-is. */

export type RGB = [number, number, number];

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB_FN = /^rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*(?:[,/]\s*(?:0|1|0?\.\d+|\d{1,3}%))?\s*\)$/i;
const HSL_FN = /^hsla?\(\s*(\d{1,3}(?:\.\d+)?)(?:deg)?\s*[, ]\s*(\d{1,3}(?:\.\d+)?)%\s*[, ]\s*(\d{1,3}(?:\.\d+)?)%\s*(?:[,/]\s*(?:0|1|0?\.\d+|\d{1,3}%))?\s*\)$/i;

const NAMED: Record<string, string> = {
  black: "#000000", white: "#ffffff", red: "#ff0000", green: "#008000", blue: "#0000ff",
  yellow: "#ffff00", orange: "#ffa500", purple: "#800080", gray: "#808080", grey: "#808080",
  silver: "#c0c0c0", maroon: "#800000", navy: "#000080", teal: "#008080", olive: "#808000",
  lime: "#00ff00", aqua: "#00ffff", cyan: "#00ffff", fuchsia: "#ff00ff", magenta: "#ff00ff",
  pink: "#ffc0cb", brown: "#a52a2a", darkred: "#8b0000", darkblue: "#00008b", darkgreen: "#006400",
};

function hsl2rgb(h: number, s: number, l: number): RGB {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

export function parseColor(input: unknown): RGB | null {
  if (typeof input !== "string") return null;
  const value = input.trim().toLowerCase();
  const hex = HEX.exec(NAMED[value] ?? value)?.[1];
  if (hex) {
    const full = hex.length <= 4 ? [...hex.slice(0, 3)].map((c) => c + c).join("") : hex.slice(0, 6);
    return [0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16)) as RGB;
  }
  const rgb = RGB_FN.exec(value);
  if (rgb) {
    const parts = rgb.slice(1, 4).map(Number) as RGB;
    return parts.every((n) => n <= 255) ? parts : null;
  }
  const hsl = HSL_FN.exec(value);
  if (hsl) return hsl2rgb(Number(hsl[1]) % 360, Math.min(100, Number(hsl[2])), Math.min(100, Number(hsl[3])));
  return null;
}

export const toHex = ([r, g, b]: RGB): string =>
  `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;

/** Validates any CSS color the editor accepts and normalizes it to #rrggbb (or null). */
export function normalizeColor(input: unknown): string | null {
  const rgb = parseColor(input);
  return rgb ? toHex(rgb) : null;
}

/** WCAG 2.x relative luminance. */
export function luminance([r, g, b]: RGB): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio (1–21) between two colors, or null if either can't be parsed. */
export function contrastRatio(a: unknown, b: unknown): number | null {
  const ca = parseColor(a);
  const cb = parseColor(b);
  if (!ca || !cb) return null;
  const [hi, lo] = [luminance(ca), luminance(cb)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

export interface PaletteColor {
  /** Accessible name (a UI label key like "colorDarkRed", or plain text) — never just a hex code (WCAG 1.4.1). */
  name: string;
  value: string;
}

/** Text colors: every entry is ≥ 4.5:1 on white (WCAG AA for normal text). */
export const TEXT_PALETTE: PaletteColor[] = [
  { name: "colorBlack", value: "#1b1f24" },
  { name: "colorDarkGray", value: "#57606a" },
  { name: "colorDarkRed", value: "#b3261e" },
  { name: "colorDarkOrange", value: "#9a4a00" },
  { name: "colorOlive", value: "#6b5b00" },
  { name: "colorDarkGreen", value: "#146c2e" },
  { name: "colorTeal", value: "#006a6a" },
  { name: "colorBlue", value: "#0b57d0" },
  { name: "colorPurple", value: "#6f2dbd" },
  { name: "colorMagenta", value: "#a1185d" },
];

/** Highlight colors: light tints that keep dark text ≥ 4.5:1. */
export const HIGHLIGHT_PALETTE: PaletteColor[] = [
  { name: "colorYellow", value: "#fff2a8" },
  { name: "colorGreen", value: "#c9f2d0" },
  { name: "colorBlue", value: "#d3e3fd" },
  { name: "colorPink", value: "#ffd8e6" },
  { name: "colorOrange", value: "#ffe0b8" },
  { name: "colorPurple", value: "#e8dcff" },
  { name: "colorGray", value: "#e6e8eb" },
];
