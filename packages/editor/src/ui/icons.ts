/*
 * 24×24 stroke icons rendered with currentColor (so they follow theme, high contrast and
 * forced-colors). Geometry derived from Lucide (ISC License, © Lucide Contributors).
 */
export const icons = {
  undo: ["M9 14 4 9l5-5", "M4 9h10.5a5.5 5.5 0 0 1 0 11H11"],
  redo: ["m15 14 5-5-5-5", "M20 9H9.5a5.5 5.5 0 0 0 0 11H13"],
  bold: ["M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8"],
  italic: ["M19 4h-9", "M14 20H5", "M15 4 9 20"],
  underline: ["M6 4v6a6 6 0 0 0 12 0V4", "M4 20h16"],
  strike: ["M16 4H9a3 3 0 0 0-2.83 4", "M14 12a4 4 0 0 1 0 8H6", "M4 12h16"],
  code: ["m16 18 6-6-6-6", "m8 6-6 6 6 6"],
  subscript: ["m4 5 8 8", "m12 5-8 8", "M20 19h-4c0-1.5.44-2 1.5-2.5S20 15.33 20 14a2 2 0 0 0-3.9-.5"],
  superscript: ["m4 19 8-8", "m12 19-8-8", "M20 12h-4c0-1.5.44-2 1.5-2.5S20 8.33 20 7a2 2 0 0 0-3.9-.5"],
  link: [
    "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
    "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  ],
  bulletList: ["M3 6h.01", "M3 12h.01", "M3 18h.01", "M8 6h13", "M8 12h13", "M8 18h13"],
  orderedList: ["M10 6h11", "M10 12h11", "M10 18h11", "M4 6h1v4", "M4 10h2", "M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"],
  taskList: ["m3 7 2 2 4-4", "m3 17 2 2 4-4", "M13 6h8", "M13 12h8", "M13 18h8"],
  blockquote: [
    "M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z",
    "M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z",
  ],
  codeBlock: [
    "M10 9.5 8 12l2 2.5",
    "m14 9.5 2 2.5-2 2.5",
    "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
  ],
  heading: ["M6 12h12", "M6 20V4", "M18 20V4"],
  alignStart: ["M21 6H3", "M15 12H3", "M17 18H3"],
  alignCenter: ["M21 6H3", "M17 12H7", "M19 18H5"],
  alignEnd: ["M21 6H3", "M21 12H9", "M21 18H7"],
  alignJustify: ["M3 6h18", "M3 12h18", "M3 18h18"],
  dirLtr: ["M13 4v10", "M17 4v10", "M19 4h-9a3.5 3.5 0 0 0 0 7h3", "M4 20h15", "m16 17 3 3-3 3"],
  dirRtl: ["M11 4v10", "M15 4v10", "M17 4H8a3.5 3.5 0 0 0 0 7h3", "M20 20H5", "m8 17-3 3 3 3"],
  dirAuto: ["M12 4v10", "M16 4v10", "M18 4H9.5a3.5 3.5 0 0 0 0 7h2.5", "M4 20h16", "m7 17-3 3 3 3", "m17 17 3 3-3 3"],
  image: [
    "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
    "M9 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    "m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21",
  ],
  table: [
    "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
    "M3 9h18",
    "M3 15h18",
    "M12 3v18",
  ],
  horizontalRule: ["M3 12h18", "M8 7h8", "M8 17h8"],
  removeFormat: ["M4 7V4h16v3", "M5 20h6", "M13 4 8 20", "m15 15 5 5", "m20 15-5 5"],
  find: ["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "m21 21-4.3-4.3"],
  keyboard: [
    "M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z",
    "M6 10h.01",
    "M10 10h.01",
    "M14 10h.01",
    "M18 10h.01",
    "M8 14h8",
  ],
  accessibility: ["M12 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4z", "M5 9l7 1 7-1", "M12 10v4", "m8 21 4-7 4 7"],
  chevronDown: ["m6 9 6 6 6-6"],
  chevronUp: ["m18 15-6-6-6 6"],
  close: ["M18 6 6 18", "m6 6 12 12"],
  check: ["M20 6 9 17l-5-5"],
  more: ["M12 12h.01", "M19 12h.01", "M5 12h.01"],
  textColor: ["m6 16 6-12 6 12", "M8 12h8"],
  highlight: ["m9 11-6 6v3h9l3-3", "m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"],
  sourceCode: [
    "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z",
    "M14 2v4a2 2 0 0 0 2 2h4",
    "M10 12.5 8 15l2 2.5",
    "m14 12.5 2 2.5-2 2.5",
  ],
} satisfies Record<string, string[]>;

export type IconName = keyof typeof icons;

/** Icons that point "forward/backward" or depict start-aligned content flip in RTL. */
export const FLIP_IN_RTL = new Set<IconName>([
  "undo",
  "redo",
  "bulletList",
  "orderedList",
  "taskList",
  "alignStart",
  "alignEnd",
]);
