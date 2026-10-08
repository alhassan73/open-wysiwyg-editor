import { chainCommands, exitCode, setBlockType } from "prosemirror-commands";
import { textblockTypeInputRule, wrappingInputRule, InputRule } from "prosemirror-inputrules";
import { TextSelection, type Command } from "prosemirror-state";
import { defineExtension } from "../core/extension";
import { toggleBlockType, toggleWrap } from "./helpers";

export const Document = defineExtension({
  name: "doc",
  nodes: () => ({ doc: { content: "block+" } }),
});

export const Text = defineExtension({
  name: "text",
  nodes: () => ({ text: { group: "inline" } }),
});

export const Paragraph = defineExtension({
  name: "paragraph",
  priority: 1000,
  nodes: () => ({
    paragraph: {
      content: "inline*",
      group: "block",
      parseDOM: [{ tag: "p" }],
      toDOM: () => ["p", 0],
    },
  }),
  commands: ({ schema }) => ({
    setParagraph: () => setBlockType(schema.nodes.paragraph!),
  }),
  keymap: ({ schema }) => ({ "Mod-Alt-0": setBlockType(schema.nodes.paragraph!) }),
});

export interface HeadingOptions {
  /** Allowed heading levels. Default 1–6. */
  levels: number[];
}

export const Heading = defineExtension<HeadingOptions>({
  name: "heading",
  defaultOptions: { levels: [1, 2, 3, 4, 5, 6] },
  nodes: ({ levels }) => ({
    heading: {
      attrs: { level: { default: levels[0] ?? 1, validate: "number" } },
      content: "inline*",
      group: "block",
      defining: true,
      parseDOM: [1, 2, 3, 4, 5, 6].map((n) => ({
        tag: `h${n}`,
        // Levels that aren't enabled collapse to the nearest allowed one (structure is kept).
        attrs: { level: nearest(levels, n) },
      })),
      toDOM: (node) => [`h${nearest(levels, node.attrs.level as number)}`, 0],
    },
  }),
  commands: ({ schema, options }) => {
    const type = schema.nodes.heading!;
    const valid = (level: number) => options.levels.includes(level);
    return {
      setHeading: (level: number) => (valid(level) ? setBlockType(type, { level }) : () => false),
      toggleHeading: (level: number) =>
        valid(level) ? toggleBlockType(type, schema.nodes.paragraph!, { level }) : () => false,
    };
  },
  keymap: ({ schema, options }) =>
    Object.fromEntries(
      options.levels.map((level) => [
        `Mod-Alt-${level}`,
        toggleBlockType(schema.nodes.heading!, schema.nodes.paragraph!, { level }),
      ]),
    ),
  inputRules: ({ schema, options }) => [
    textblockTypeInputRule(/^(#{1,6})\s$/, schema.nodes.heading!, (match) => ({
      level: nearest(options.levels, match[1]!.length),
    })),
  ],
});

function nearest(levels: number[], level: number): number {
  if (levels.includes(level)) return level;
  return levels.reduce((best, l) => (Math.abs(l - level) < Math.abs(best - level) ? l : best), levels[0] ?? 1);
}

export const Blockquote = defineExtension({
  name: "blockquote",
  nodes: () => ({
    blockquote: {
      content: "block+",
      group: "block",
      defining: true,
      parseDOM: [{ tag: "blockquote" }],
      toDOM: () => ["blockquote", 0],
    },
  }),
  commands: ({ schema }) => ({ toggleBlockquote: () => toggleWrap(schema.nodes.blockquote!) }),
  keymap: ({ schema }) => ({ "Mod-Shift-b": toggleWrap(schema.nodes.blockquote!) }),
  inputRules: ({ schema }) => [wrappingInputRule(/^\s*>\s$/, schema.nodes.blockquote!)],
});

const insertHardBreak: Command = (state, dispatch) => {
  const type = state.schema.nodes.hardBreak;
  if (!type) return false;
  if (dispatch) dispatch(state.tr.replaceSelectionWith(type.create()).scrollIntoView());
  return true;
};

export const HardBreak = defineExtension({
  name: "hardBreak",
  nodes: () => ({
    hardBreak: {
      inline: true,
      group: "inline",
      selectable: false,
      leafText: () => "\n",
      parseDOM: [{ tag: "br" }],
      toDOM: () => ["br"],
    },
  }),
  commands: () => ({ setHardBreak: () => insertHardBreak }),
  keymap: () => ({
    "Shift-Enter": chainCommands(exitCode, insertHardBreak),
    "Mod-Enter": chainCommands(exitCode, insertHardBreak),
  }),
});

const insertHorizontalRule: Command = (state, dispatch) => {
  const { horizontalRule, paragraph } = state.schema.nodes;
  if (!horizontalRule) return false;
  if (dispatch) {
    const tr = state.tr.replaceSelectionWith(horizontalRule.create());
    // Make sure there is somewhere to keep typing after the rule.
    const after = tr.selection.$from;
    if (!after.nodeAfter && paragraph) {
      tr.insert(after.pos, paragraph.create());
      tr.setSelection(TextSelection.create(tr.doc, after.pos + 1));
    }
    dispatch(tr.scrollIntoView());
  }
  return true;
};

export const HorizontalRule = defineExtension({
  name: "horizontalRule",
  nodes: () => ({
    horizontalRule: {
      group: "block",
      parseDOM: [{ tag: "hr" }],
      toDOM: () => ["hr"],
    },
  }),
  commands: () => ({ setHorizontalRule: () => insertHorizontalRule }),
  inputRules: ({ schema }) => [
    new InputRule(/^(?:---|___\s|\*\*\*\s)$/, (state, _match, start, end) => {
      const type = schema.nodes.horizontalRule!;
      const $start = state.doc.resolve(start);
      if (!$start.node(-1).canReplaceWith($start.index(-1), $start.indexAfter(-1), type)) return null;
      const tr = state.tr.delete(start, end);
      const pos = tr.mapping.map($start.before());
      tr.insert(pos, type.create());
      return tr;
    }),
  ],
});

const LANGUAGE = /^[a-zA-Z0-9_+#.-]{1,32}$/;

export interface CodeBlockOptions {
  /** Prefix for the language class on <code>. Default "language-", the class most syntax highlighters look for. */
  languageClassPrefix: string;
}

export const CodeBlock = defineExtension<CodeBlockOptions>({
  name: "codeBlock",
  defaultOptions: { languageClassPrefix: "language-" },
  nodes: ({ languageClassPrefix }) => ({
    codeBlock: {
      attrs: { language: { default: null } },
      content: "text*",
      marks: "",
      group: "block",
      code: true,
      defining: true,
      parseDOM: [
        {
          tag: "pre",
          preserveWhitespace: "full",
          getAttrs: (dom: HTMLElement) => {
            const cls = (dom.querySelector("code")?.className ?? dom.className) || "";
            const match = /(?:^|\s)(?:language|lang)-([^\s]+)/.exec(cls);
            const language = match?.[1] ?? dom.getAttribute("data-language");
            return { language: language && LANGUAGE.test(language) ? language : null };
          },
        },
      ],
      toDOM: (node) => {
        const language = node.attrs.language as string | null;
        const valid = language && LANGUAGE.test(language);
        return ["pre", ["code", valid ? { class: `${languageClassPrefix}${language}` } : {}, 0]];
      },
    },
  }),
  commands: ({ schema }) => ({
    toggleCodeBlock: (attrs: { language?: string | null } = {}) =>
      toggleBlockType(
        schema.nodes.codeBlock!,
        schema.nodes.paragraph!,
        { language: attrs.language && LANGUAGE.test(attrs.language) ? attrs.language : null },
        {}, // any code block counts as active, whatever its language
      ),
  }),
  keymap: ({ schema }) => ({
    "Mod-Alt-c": toggleBlockType(schema.nodes.codeBlock!, schema.nodes.paragraph!),
    // Backspace at the start of an empty code block turns it back into a paragraph.
    Backspace: (state, dispatch) => {
      const { $from, empty } = state.selection;
      if (!empty || $from.parent.type !== schema.nodes.codeBlock || $from.parent.content.size) return false;
      return setBlockType(schema.nodes.paragraph!)(state, dispatch);
    },
  }),
  inputRules: ({ schema }) => [
    textblockTypeInputRule(/^```([a-zA-Z0-9_+#.-]{1,32})?[\s\n]$/, schema.nodes.codeBlock!, (match) => ({
      language: match[1] ?? null,
    })),
  ],
});
