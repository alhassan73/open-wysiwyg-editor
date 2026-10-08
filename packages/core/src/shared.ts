// Core
export { isActive, getAttributes } from "./core/editor";
export type { Editor, EditorOptions as CoreEditorOptions, EditorEvents, Content, SetContentOptions } from "./core/editor";
export { defineExtension, resolveExtensions } from "./core/extension";
export type {
  Extension,
  AnyExtension,
  ExtensionConfig,
  ExtensionContext,
  SchemaContext,
  GlobalAttributes,
  GlobalAttributeSpec,
  CommandFactory,
} from "./core/extension";
export type { CommandMap, CommandName, SingleCommands, ChainedCommands } from "./core/commands";
export type { JSONContent, TextAlign as TextAlignValue, TextDirection as TextDirectionValue, LinkAttrs, ImageAttrs, InsertTableOptions } from "./core/types";

// Content & security
export { docToHTML, escapeAttr, escapeText } from "./core/html";
export { sanitizeHTML, FORBIDDEN_TAGS, FORBIDDEN_ATTRS } from "./core/sanitize";
export { sanitizeUrl, DEFAULT_PROTOCOLS } from "./core/url";
export type { UrlPolicy } from "./core/url";
export { setTrustedTypesPolicy, TRUSTED_TYPES_POLICY_NAME } from "./core/trusted-types";
export type { PolicyLike } from "./core/trusted-types";

// i18n
export { defaultLabels, arabicLabels, builtInLanguages, createI18n, resolveLanguage } from "./core/i18n";
export type { Label, Labels, LabelKey, EditorLanguage, I18n, Translate } from "./core/i18n";

// Extensions
export { StarterKit } from "./extensions/starter-kit";
export type { StarterKitOptions } from "./extensions/starter-kit";
export {
  Document,
  Text,
  Paragraph,
  Heading,
  Blockquote,
  HardBreak,
  HorizontalRule,
  CodeBlock,
} from "./extensions/nodes";
export type { HeadingOptions, CodeBlockOptions } from "./extensions/nodes";
export { BulletList, OrderedList, ListItem, TaskList, TaskItem } from "./extensions/lists";
export { Bold, Italic, Underline, Strike, Code, Subscript, Superscript, Link } from "./extensions/marks";
export type { LinkOptions } from "./extensions/marks";
export { Image } from "./extensions/image";
export type { ImageOptions } from "./extensions/image";
export { Table } from "./extensions/table";
export type { TableOptions } from "./extensions/table";
export { TextAlign, TextDirection } from "./extensions/attributes";
export type { TextAlignOptions, TextDirectionOptions } from "./extensions/attributes";
export { History, Dropcursor, Gapcursor } from "./extensions/behaviour";
export type { HistoryOptions } from "./extensions/behaviour";
export {
  markInputRule,
  sequence,
  toggleList,
  toggleBlockType,
  toggleWrap,
  toggleMarkCommand,
  setBlockAttrs,
  markRange,
  findParent,
} from "./extensions/helpers";
export { FindReplace, findMatches, getSearchState, searchKey } from "./extensions/find-replace";
export type { SearchQuery, SearchMatch, SearchState } from "./extensions/find-replace";
export { CharacterCount, countCharacters, countWords, docText } from "./extensions/character-count";
export type { CharacterCountOptions } from "./extensions/character-count";
export { cleanPastedHTML } from "./core/paste";
export type { PasteResult } from "./core/paste";
export { stripInertBlocks, sanitizePastedHTML } from "./core/sanitize";
export {
  HtmlSupport,
  HTML_SAFE_RULES,
  HTML_CONTAINERS,
  HTML_TEXTBLOCKS,
  HTML_INLINE,
  createHtmlFilter,
} from "./extensions/html-support";
export type { HtmlRule, HtmlSupportOptions } from "./extensions/html-support";
export { TextColor, Highlight } from "./extensions/color";
export type { TextColorOptions, HighlightOptions } from "./extensions/color";
export {
  parseColor,
  normalizeColor,
  contrastRatio,
  luminance,
  toHex,
  TEXT_PALETTE,
  HIGHLIGHT_PALETTE,
} from "./core/color";
export type { RGB, PaletteColor } from "./core/color";
