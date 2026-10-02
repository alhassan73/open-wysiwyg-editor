import { defineExtension, type AnyExtension, type Extension } from "../core/extension";
import { TextAlign, TextDirection, type TextAlignOptions, type TextDirectionOptions } from "./attributes";
import { Dropcursor, Gapcursor, History, type HistoryOptions } from "./behaviour";
import { Image, type ImageOptions } from "./image";
import { BulletList, OrderedList, TaskList } from "./lists";
import { Bold, Code, Italic, Link, Strike, Subscript, Superscript, Underline, type LinkOptions } from "./marks";
import {
  Blockquote,
  CodeBlock,
  Document,
  HardBreak,
  Heading,
  HorizontalRule,
  Paragraph,
  Text,
  type CodeBlockOptions,
  type HeadingOptions,
} from "./nodes";
import { Table, type TableOptions } from "./table";
import { FindReplace } from "./find-replace";
import { Highlight, TextColor, type HighlightOptions, type TextColorOptions } from "./color";
import { CharacterCount, type CharacterCountOptions } from "./character-count";

type Toggle<O> = Partial<O> | false;

export interface StarterKitOptions {
  heading: Toggle<HeadingOptions>;
  blockquote: Toggle<object>;
  codeBlock: Toggle<CodeBlockOptions>;
  hardBreak: Toggle<object>;
  horizontalRule: Toggle<object>;
  bulletList: Toggle<object>;
  orderedList: Toggle<object>;
  taskList: Toggle<object>;
  image: Toggle<ImageOptions>;
  table: Toggle<TableOptions>;
  bold: Toggle<object>;
  italic: Toggle<object>;
  underline: Toggle<object>;
  strike: Toggle<object>;
  code: Toggle<object>;
  subscript: Toggle<object>;
  superscript: Toggle<object>;
  link: Toggle<LinkOptions>;
  textAlign: Toggle<TextAlignOptions>;
  textDirection: Toggle<TextDirectionOptions>;
  history: Toggle<HistoryOptions>;
  dropcursor: Toggle<object>;
  gapcursor: Toggle<object>;
  textColor: Toggle<TextColorOptions>;
  highlight: Toggle<HighlightOptions>;
  findReplace: Toggle<object>;
  characterCount: Toggle<CharacterCountOptions>;
}

const parts: Array<[keyof StarterKitOptions, AnyExtension]> = [
  ["link", Link],
  ["heading", Heading],
  ["blockquote", Blockquote],
  ["codeBlock", CodeBlock],
  ["hardBreak", HardBreak],
  ["horizontalRule", HorizontalRule],
  ["bulletList", BulletList],
  ["orderedList", OrderedList],
  ["taskList", TaskList],
  ["image", Image],
  ["table", Table],
  ["bold", Bold],
  ["italic", Italic],
  ["underline", Underline],
  ["strike", Strike],
  ["code", Code],
  ["subscript", Subscript],
  ["superscript", Superscript],
  ["textColor", TextColor],
  ["highlight", Highlight],
  ["textAlign", TextAlign],
  ["textDirection", TextDirection],
  ["history", History],
  ["dropcursor", Dropcursor],
  ["gapcursor", Gapcursor],
  ["findReplace", FindReplace],
  ["characterCount", CharacterCount],
];

/**
 * Everything needed for a complete document editor. Disable or configure parts:
 *   StarterKit.configure({ table: false, heading: { levels: [2, 3] } })
 */
export const StarterKit: Extension<Partial<StarterKitOptions>> = defineExtension<Partial<StarterKitOptions>>({
  name: "starterKit",
  defaultOptions: {},
  extensions: (options) => [
    Document,
    Text,
    Paragraph,
    ...parts
      .filter(([key]) => options[key] !== false)
      .map(([key, ext]) => {
        const config = options[key];
        return config ? ext.configure(config as never) : ext;
      }),
  ],
});
