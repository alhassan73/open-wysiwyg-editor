/**
 * A label is either a plain string with `{name}` placeholders, or a set of plural forms selected
 * with Intl.PluralRules (Arabic needs zero/one/two/few/many/other).
 */
export type Label = string | Partial<Record<Intl.LDMLPluralRule, string>>;

export const defaultLabels = {
  editorLabel: "Rich text editor",
  toolbar: "Formatting",
  more: "More",
  // Marks
  bold: "Bold",
  italic: "Italic",
  underline: "Underline",
  strike: "Strikethrough",
  code: "Inline code",
  subscript: "Subscript",
  superscript: "Superscript",
  link: "Link",
  unlink: "Remove link",
  removeFormat: "Clear formatting",
  // Blocks
  blockType: "Text style",
  paragraph: "Paragraph",
  heading: "Heading {level}",
  blockquote: "Quote",
  codeBlock: "Code block",
  horizontalRule: "Horizontal line",
  hardBreak: "Line break",
  bulletList: "Bulleted list",
  orderedList: "Numbered list",
  taskList: "Checklist",
  task: "Task",
  toggleTask: "Mark task as done",
  indent: "Increase indent",
  outdent: "Decrease indent",
  // Alignment & direction
  align: "Alignment",
  alignStart: "Align start",
  alignCenter: "Align center",
  alignEnd: "Align end",
  alignJustify: "Justify",
  direction: "Text direction",
  dirLtr: "Left to right",
  dirRtl: "Right to left",
  dirAuto: "Automatic direction",
  // History
  undo: "Undo",
  redo: "Redo",
  // Image
  image: "Image",
  insertImage: "Insert image",
  imageUrl: "Image address (URL)",
  imageUpload: "Upload from device",
  altText: "Alternative text",
  altHelp: "Describe the image for people who can't see it. Leave out \"image of\".",
  decorative: "Decorative image (no description needed)",
  caption: "Caption",
  imageSize: "Size",
  sizeSmall: "Small",
  sizeMedium: "Medium",
  sizeLarge: "Large",
  sizeOriginal: "Original",
  // Table
  table: "Table",
  insertTable: "Insert table",
  rows: "Rows",
  columns: "Columns",
  headerRow: "Header row",
  headerColumn: "Header column",
  tableCaption: "Table caption",
  addRowBefore: "Insert row above",
  addRowAfter: "Insert row below",
  addColumnBefore: "Insert column before",
  addColumnAfter: "Insert column after",
  deleteRow: "Delete row",
  deleteColumn: "Delete column",
  deleteTable: "Delete table",
  mergeCells: "Merge cells",
  splitCell: "Split cell",
  tableSize: "{rows} by {cols} table",
  // Link dialog
  linkUrl: "Link address (URL)",
  linkText: "Text to display",
  linkNewTab: "Open in a new tab",
  invalidUrl: "This address is not allowed. Use a web address (https://…), email (mailto:) or phone (tel:).",
  // Dialog
  insert: "Insert",
  save: "Save",
  cancel: "Cancel",
  close: "Close",
  apply: "Apply",
  remove: "Remove",
  // Find & replace
  find: "Find",
  findAndReplace: "Find and replace",
  replace: "Replace",
  replaceWith: "Replace with",
  replaceAll: "Replace all",
  findNext: "Next match",
  findPrevious: "Previous match",
  matchCase: "Match case",
  wholeWord: "Whole words",
  matchCount: { zero: "No matches", one: "{current} of {n} match", other: "{current} of {n} matches" },
  replacedCount: { one: "Replaced {n} match", other: "Replaced {n} matches" },
  // Status
  wordCount: { one: "{n} word", other: "{n} words" },
  charCount: { one: "{n} character", other: "{n} characters" },
  charLimit: "{n} of {limit} characters",
  charLimitReached: "Character limit reached",
  elementPath: "Element path",
  // Announcements
  on: "{name} on",
  off: "{name} off",
  inserted: "{name} inserted",
  pasteCleaned: "Pasted content was cleaned up",
  pasteDropped: "Some pasted content isn't supported and was removed",
  // Help
  shortcuts: "Keyboard shortcuts",
  shortcutsHelp: "Press {shortcut} to move to the toolbar, Escape to return to the text.",
  // Accessibility checker
  a11yChecker: "Accessibility checker",
  a11yIssues: { zero: "No accessibility issues", one: "{n} accessibility issue", other: "{n} accessibility issues" },
  // Placeholder
  placeholder: "Start writing…",
  // Element path & structure
  listItem: "List item",
  tableRow: "Row",
  tableCell: "Cell",
  tableHeader: "Header cell",
  selectElement: "Select {name}",
  // Dialogs & UI
  editLink: "Edit link",
  editImage: "Edit image",
  required: "required",
  altRequired: "Describe the image, or mark it as decorative.",
  urlRequired: "Enter an address.",
  tableOptions: "Table options",
  tableProperties: "Table properties",
  closeFind: "Close find and replace",
  action: "Action",
  shortcut: "Shortcut",
  leaveEditor: "Press Escape, then Tab, to leave the editor from inside a list or table.",
  markdownShortcuts: "Typing shortcuts",
  navigation: "Navigation",
  formatting: "Formatting",
  blocks: "Blocks",
  focusToolbar: "Move focus to the toolbar",
  showShortcuts: "Show keyboard shortcuts",
  openFind: "Find and replace",
  insertLink: "Insert link",
  sourceCode: "Source code",
  sourceCleaned: "Some HTML isn't supported and was removed or simplified",
  // Colors
  textColor: "Text color",
  highlight: "Highlight color",
  automatic: "Automatic",
  noHighlight: "No highlight",
  customColor: "Custom color",
  color: "Color",
  hexValue: "Hex value",
  invalidColor: "Enter a color such as #1a73e8.",
  contrastText: "Contrast on a white background: {ratio}:1",
  contrastBg: "Contrast with dark text: {ratio}:1",
  contrastPass: "Meets WCAG AA for normal text.",
  contrastFail: "Below the 4.5:1 minimum for normal text (WCAG 1.4.3).",
  colorBlack: "Black",
  colorDarkGray: "Dark gray",
  colorDarkRed: "Dark red",
  colorDarkOrange: "Dark orange",
  colorOlive: "Olive",
  colorDarkGreen: "Dark green",
  colorTeal: "Teal",
  colorBlue: "Blue",
  colorPurple: "Purple",
  colorMagenta: "Magenta",
  colorYellow: "Yellow",
  colorGreen: "Green",
  colorPink: "Pink",
  colorOrange: "Orange",
  colorGray: "Gray",
};

export type LabelKey = keyof typeof defaultLabels;
export type Labels = { [K in LabelKey]: Label };

export interface EditorLanguage {
  /** BCP 47 code, e.g. "en", "ar", "ar-EG". */
  code: string;
  /** Native name shown in pickers, e.g. "العربية". */
  name: string;
  dir?: "ltr" | "rtl";
  labels: Partial<Labels>;
}

export const arabicLabels: Partial<Labels> = {
  editorLabel: "محرر النصوص",
  toolbar: "التنسيق",
  more: "المزيد",
  bold: "عريض",
  italic: "مائل",
  underline: "تسطير",
  strike: "يتوسطه خط",
  code: "شيفرة سطرية",
  subscript: "منخفض",
  superscript: "مرتفع",
  link: "رابط",
  unlink: "إزالة الرابط",
  removeFormat: "مسح التنسيق",
  blockType: "نمط النص",
  paragraph: "فقرة",
  heading: "عنوان {level}",
  blockquote: "اقتباس",
  codeBlock: "كتلة شيفرة",
  horizontalRule: "خط أفقي",
  hardBreak: "سطر جديد",
  bulletList: "قائمة نقطية",
  orderedList: "قائمة مرقّمة",
  taskList: "قائمة مهام",
  task: "مهمة",
  toggleTask: "تعليم المهمة كمنجزة",
  indent: "زيادة المسافة البادئة",
  outdent: "إنقاص المسافة البادئة",
  align: "المحاذاة",
  alignStart: "محاذاة إلى البداية",
  alignCenter: "توسيط",
  alignEnd: "محاذاة إلى النهاية",
  alignJustify: "ضبط",
  direction: "اتجاه النص",
  dirLtr: "من اليسار إلى اليمين",
  dirRtl: "من اليمين إلى اليسار",
  dirAuto: "اتجاه تلقائي",
  undo: "تراجع",
  redo: "إعادة",
  image: "صورة",
  insertImage: "إدراج صورة",
  imageUrl: "عنوان الصورة (URL)",
  imageUpload: "رفع من الجهاز",
  altText: "النص البديل",
  altHelp: "صِف الصورة لمن لا يستطيع رؤيتها، دون كتابة \"صورة لـ\".",
  decorative: "صورة زخرفية (لا تحتاج إلى وصف)",
  caption: "تعليق",
  imageSize: "الحجم",
  sizeSmall: "صغير",
  sizeMedium: "متوسط",
  sizeLarge: "كبير",
  sizeOriginal: "الحجم الأصلي",
  table: "جدول",
  insertTable: "إدراج جدول",
  rows: "الصفوف",
  columns: "الأعمدة",
  headerRow: "صف العناوين",
  headerColumn: "عمود العناوين",
  tableCaption: "عنوان الجدول",
  addRowBefore: "إدراج صف أعلى",
  addRowAfter: "إدراج صف أسفل",
  addColumnBefore: "إدراج عمود قبل",
  addColumnAfter: "إدراج عمود بعد",
  deleteRow: "حذف الصف",
  deleteColumn: "حذف العمود",
  deleteTable: "حذف الجدول",
  mergeCells: "دمج الخلايا",
  splitCell: "تقسيم الخلية",
  tableSize: "جدول {rows} × {cols}",
  linkUrl: "عنوان الرابط (URL)",
  linkText: "النص المعروض",
  linkNewTab: "فتح في علامة تبويب جديدة",
  invalidUrl: "هذا العنوان غير مسموح. استخدم عنوان ويب (https://…) أو بريدًا (mailto:) أو هاتفًا (tel:).",
  insert: "إدراج",
  save: "حفظ",
  cancel: "إلغاء",
  close: "إغلاق",
  apply: "تطبيق",
  remove: "إزالة",
  find: "بحث",
  findAndReplace: "بحث واستبدال",
  replace: "استبدال",
  replaceWith: "استبدال بـ",
  replaceAll: "استبدال الكل",
  findNext: "التطابق التالي",
  findPrevious: "التطابق السابق",
  matchCase: "مطابقة حالة الأحرف",
  wholeWord: "كلمات كاملة",
  matchCount: {
    zero: "لا توجد نتائج",
    one: "{current} من نتيجة واحدة",
    two: "{current} من نتيجتين",
    few: "{current} من {n} نتائج",
    many: "{current} من {n} نتيجة",
    other: "{current} من {n} نتيجة",
  },
  replacedCount: {
    zero: "لم يُستبدل شيء",
    one: "تم استبدال نتيجة واحدة",
    two: "تم استبدال نتيجتين",
    few: "تم استبدال {n} نتائج",
    many: "تم استبدال {n} نتيجة",
    other: "تم استبدال {n} نتيجة",
  },
  wordCount: {
    zero: "لا كلمات",
    one: "كلمة واحدة",
    two: "كلمتان",
    few: "{n} كلمات",
    many: "{n} كلمة",
    other: "{n} كلمة",
  },
  charCount: {
    zero: "لا أحرف",
    one: "حرف واحد",
    two: "حرفان",
    few: "{n} أحرف",
    many: "{n} حرفًا",
    other: "{n} حرف",
  },
  charLimit: "{n} من {limit} حرف",
  charLimitReached: "تم الوصول إلى الحد الأقصى للأحرف",
  elementPath: "مسار العنصر",
  on: "{name}: مُفعّل",
  off: "{name}: غير مُفعّل",
  inserted: "تم إدراج {name}",
  pasteCleaned: "تم تنظيف المحتوى الملصق",
  pasteDropped: "بعض المحتوى الملصق غير مدعوم وتمت إزالته",
  shortcuts: "اختصارات لوحة المفاتيح",
  shortcutsHelp: "اضغط {shortcut} للانتقال إلى شريط الأدوات، وEscape للعودة إلى النص.",
  a11yChecker: "مدقق إمكانية الوصول",
  a11yIssues: {
    zero: "لا توجد مشكلات في إمكانية الوصول",
    one: "مشكلة واحدة في إمكانية الوصول",
    two: "مشكلتان في إمكانية الوصول",
    few: "{n} مشكلات في إمكانية الوصول",
    many: "{n} مشكلة في إمكانية الوصول",
    other: "{n} مشكلة في إمكانية الوصول",
  },
  placeholder: "ابدأ الكتابة…",
  listItem: "عنصر قائمة",
  tableRow: "صف",
  tableCell: "خلية",
  tableHeader: "خلية عنوان",
  selectElement: "تحديد {name}",
  editLink: "تعديل الرابط",
  editImage: "تعديل الصورة",
  required: "مطلوب",
  altRequired: "صِف الصورة، أو حدّدها كصورة زخرفية.",
  urlRequired: "أدخل عنوانًا.",
  tableOptions: "خيارات الجدول",
  tableProperties: "خصائص الجدول",
  closeFind: "إغلاق البحث والاستبدال",
  action: "الإجراء",
  shortcut: "الاختصار",
  leaveEditor: "اضغط Escape ثم Tab لمغادرة المحرر من داخل قائمة أو جدول.",
  markdownShortcuts: "اختصارات الكتابة",
  navigation: "التنقل",
  formatting: "التنسيق",
  blocks: "الكتل",
  focusToolbar: "نقل التركيز إلى شريط الأدوات",
  showShortcuts: "عرض اختصارات لوحة المفاتيح",
  openFind: "بحث واستبدال",
  insertLink: "إدراج رابط",
  sourceCode: "الشيفرة المصدرية",
  sourceCleaned: "بعض شيفرة HTML غير مدعومة وتمت إزالتها أو تبسيطها",
  textColor: "لون النص",
  highlight: "لون التمييز",
  automatic: "تلقائي",
  noHighlight: "بدون تمييز",
  customColor: "لون مخصص",
  color: "اللون",
  hexValue: "القيمة السداسية",
  invalidColor: "أدخل لونًا مثل ‎#1a73e8.",
  contrastText: "التباين على خلفية بيضاء: ‎{ratio}:1",
  contrastBg: "التباين مع نص داكن: ‎{ratio}:1",
  contrastPass: "يستوفي معيار WCAG AA للنص العادي.",
  contrastFail: "أقل من الحد الأدنى 4.5:1 للنص العادي (WCAG 1.4.3).",
  colorBlack: "أسود",
  colorDarkGray: "رمادي داكن",
  colorDarkRed: "أحمر داكن",
  colorDarkOrange: "برتقالي داكن",
  colorOlive: "زيتوني",
  colorDarkGreen: "أخضر داكن",
  colorTeal: "أزرق مخضر",
  colorBlue: "أزرق",
  colorPurple: "بنفسجي",
  colorMagenta: "أرجواني",
  colorYellow: "أصفر",
  colorGreen: "أخضر",
  colorPink: "وردي",
  colorOrange: "برتقالي",
  colorGray: "رمادي",
};

export const builtInLanguages: EditorLanguage[] = [
  { code: "en", name: "English", dir: "ltr", labels: {} },
  { code: "ar", name: "العربية", dir: "rtl", labels: arabicLabels },
];

export type Translate = (key: LabelKey, vars?: Record<string, string | number>) => string;

export interface I18n {
  lang: string;
  dir: "ltr" | "rtl";
  t: Translate;
}

const RTL_LANGS = /^(ar|arc|ckb|dv|fa|he|iw|ks|ps|sd|ug|ur|yi)(-|$)/i;

export function resolveLanguage(
  code: string | undefined,
  languages: EditorLanguage[] = builtInLanguages,
): EditorLanguage {
  const wanted =
    code ??
    (typeof document !== "undefined" ? document.documentElement.lang : "") ??
    "en";
  const lower = wanted.toLowerCase();
  return (
    languages.find((l) => l.code.toLowerCase() === lower) ??
    languages.find((l) => lower.split("-")[0] === l.code.toLowerCase().split("-")[0]) ??
    languages[0] ?? { code: "en", name: "English", dir: "ltr", labels: {} }
  );
}

export function createI18n(language: EditorLanguage, overrides: Partial<Labels> = {}): I18n {
  const labels: Labels = { ...defaultLabels, ...language.labels, ...overrides };
  let plural: Intl.PluralRules | null = null;
  try {
    plural = new Intl.PluralRules(language.code);
  } catch {
    plural = null;
  }
  const t: Translate = (key, vars = {}) => {
    const label = labels[key] ?? defaultLabels[key];
    let text: string;
    if (label === undefined) text = String(key); // unknown key: show it rather than crash
    else if (typeof label === "string") text = label;
    else {
      const n = Number(vars.n ?? 0);
      // Prefer an exact "zero" form when the language provides one (better UX than "0 words").
      const form = n === 0 && label.zero ? "zero" : (plural?.select(n) ?? "other");
      text = label[form] ?? label.other ?? Object.values(label)[0] ?? key;
    }
    return text.replace(/\{(\w+)\}/g, (m, name: string) =>
      name in vars ? formatVar(vars[name]!, language.code) : m,
    );
  };
  return {
    lang: language.code,
    dir: language.dir ?? (RTL_LANGS.test(language.code) ? "rtl" : "ltr"),
    t,
  };
}

function formatVar(value: string | number, lang: string): string {
  if (typeof value !== "number") return value;
  try {
    return new Intl.NumberFormat(lang).format(value);
  } catch {
    return String(value);
  }
}
