import { NodeSelection } from "prosemirror-state";
import type { Node as PMNode } from "prosemirror-model";
import type { Editor } from "../core/editor";
import { h } from "../core/dom";
import type { LabelKey } from "../core/i18n";
import { countCharacters, countWords, docText, type CharacterCountOptions } from "../extensions/character-count";

export interface StatusbarOptions {
  /** Breadcrumb of the elements around the caret; each item selects that element (ATAG A.3.4.1). */
  elementPath?: boolean;
  wordCount?: boolean;
  characterCount?: boolean;
}

const NODE_LABELS: Record<string, LabelKey> = {
  paragraph: "paragraph",
  blockquote: "blockquote",
  codeBlock: "codeBlock",
  bulletList: "bulletList",
  orderedList: "orderedList",
  taskList: "taskList",
  listItem: "listItem",
  taskItem: "task",
  table: "table",
  tableRow: "tableRow",
  tableCell: "tableCell",
  tableHeader: "tableHeader",
  image: "image",
  horizontalRule: "horizontalRule",
};

export function nodeLabel(editor: Editor, node: PMNode): string {
  if (node.type.name === "heading") return editor.t("heading", { level: node.attrs.level as number });
  const key = NODE_LABELS[node.type.name];
  return key ? editor.t(key) : node.type.name;
}

export function createStatusbar(editor: Editor, options: StatusbarOptions) {
  const t = editor.t;
  const path = h("ol", { className: "owe-path" });
  const nav = options.elementPath === false ? null : h("nav", { className: "owe-path-nav", "aria-label": t("elementPath") }, path);
  const counts = h("div", { className: "owe-counts" });
  const element = h("div", { className: "owe-statusbar" }, nav, counts);
  const limit = (editor.extensions.find((e) => e.name === "characterCount")?.options as CharacterCountOptions | undefined)?.limit ?? null;
  const showWords = options.wordCount !== false;
  const showChars = options.characterCount !== false;
  const lang = (editor.view.dom as HTMLElement).getAttribute("lang") ?? undefined;

  let lastPathKey = "";
  function renderPath() {
    if (!nav) return;
    const { $from } = editor.state.selection;
    const sel = editor.state.selection;
    const items: Array<{ node: PMNode; pos: number }> = [];
    for (let d = 1; d <= $from.depth; d++) items.push({ node: $from.node(d), pos: $from.before(d) });
    if (sel instanceof NodeSelection) items.push({ node: sel.node, pos: sel.from });
    const key = items.map((i) => `${i.node.type.name}@${i.pos}:${i.node.attrs.level ?? ""}`).join("/");
    if (key === lastPathKey) return;
    lastPathKey = key;
    path.replaceChildren(
      ...items.map(({ node, pos }, i) => {
        const label = nodeLabel(editor, node);
        const button = h(
          "button",
          {
            type: "button",
            className: "owe-path-item",
            "aria-current": i === items.length - 1 ? "location" : null,
            "aria-label": t("selectElement", { name: label }),
          },
          label,
        );
        button.addEventListener("mousedown", (e) => e.preventDefault());
        button.addEventListener("click", () => {
          const doc = editor.state.doc;
          if (pos >= doc.content.size) return;
          editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(doc, pos)).scrollIntoView());
          editor.focus();
          editor.announce(t("selectElement", { name: label }));
        });
        return h("li", null, button);
      }),
    );
  }

  let countTimer: ReturnType<typeof setTimeout> | undefined;
  function renderCounts() {
    if (!showWords && !showChars) return;
    const text = docText(editor.state.doc);
    const parts: string[] = [];
    if (showWords) parts.push(t("wordCount", { n: countWords(text, lang) }));
    if (showChars) {
      const n = countCharacters(text, lang);
      parts.push(limit ? t("charLimit", { n, limit }) : t("charCount", { n }));
    }
    counts.textContent = parts.join(" · ");
  }

  renderPath();
  renderCounts();
  const off = editor.on("transaction", (tr) => {
    renderPath();
    if (tr.docChanged) {
      clearTimeout(countTimer);
      countTimer = setTimeout(renderCounts, 250);
    }
  });

  return {
    element,
    destroy() {
      off();
      clearTimeout(countTimer);
    },
  };
}
