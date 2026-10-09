import { wrappingInputRule } from "prosemirror-inputrules";
import { liftListItem, sinkListItem, splitListItem } from "prosemirror-schema-list";
import { Plugin, type Command } from "prosemirror-state";
import type { EditorView, NodeView } from "prosemirror-view";
import type { Node as PMNode, NodeType } from "prosemirror-model";
import type { Editor } from "../core/editor";
import { defineExtension } from "../core/extension";
import { h } from "../core/dom";
import { findParent, toggleList } from "./helpers";

const itemTypes = ["listItem", "taskItem"];

/** Run a list-item command for whichever item type the cursor is in. */
const forItem =
  (make: (type: NodeType) => Command): Command =>
  (state, dispatch, view) => {
    const item = findParent(state.selection.$from, (t) => itemTypes.includes(t.name));
    return item ? make(item.node.type)(state, dispatch, view) : false;
  };

/** Backspace at the very start of a list item lifts it out instead of joining blocks. */
const liftAtStart: Command = (state, dispatch, view) => {
  const { $from, empty } = state.selection;
  if (!empty || $from.parentOffset > 0) return false;
  const item = findParent($from, (t) => itemTypes.includes(t.name));
  if (!item || $from.index(item.depth) !== 0) return false;
  return liftListItem(item.node.type)(state, dispatch, view);
};

export const ListItem = defineExtension({
  name: "listItem",
  nodes: () => ({
    listItem: {
      content: "paragraph block*",
      defining: true,
      parseDOM: [{ tag: "li", priority: 40 }],
      toDOM: () => ["li", 0],
    },
  }),
  commands: () => ({
    sinkListItem: () => forItem(sinkListItem),
    liftListItem: () => forItem(liftListItem),
  }),
  keymap: () => ({
    Enter: forItem(splitListItem),
    // Tab only acts inside lists and fails at the first item, so focus can always leave the editor.
    Tab: forItem(sinkListItem),
    "Shift-Tab": forItem(liftListItem),
    Backspace: liftAtStart,
  }),
});

export const BulletList = defineExtension({
  name: "bulletList",
  extensions: () => [ListItem],
  nodes: () => ({
    bulletList: {
      content: "listItem+",
      group: "block list",
      parseDOM: [{ tag: "ul", getAttrs: (el: HTMLElement) => (el.dataset.type === "taskList" ? false : null) }],
      toDOM: () => ["ul", 0],
    },
  }),
  commands: ({ schema }) => ({
    toggleBulletList: () => toggleList(schema.nodes.bulletList!, schema.nodes.listItem!),
  }),
  keymap: ({ schema }) => ({ "Mod-Shift-8": toggleList(schema.nodes.bulletList!, schema.nodes.listItem!) }),
  inputRules: ({ schema }) => [wrappingInputRule(/^\s*([-+*])\s$/, schema.nodes.bulletList!)],
});

export const OrderedList = defineExtension({
  name: "orderedList",
  extensions: () => [ListItem],
  nodes: () => ({
    orderedList: {
      attrs: { start: { default: 1 }, type: { default: null } },
      content: "listItem+",
      group: "block list",
      parseDOM: [
        {
          tag: "ol",
          getAttrs: (el: HTMLElement) => {
            const start = Number.parseInt(el.getAttribute("start") ?? "1", 10);
            const type = el.getAttribute("type");
            return {
              start: Number.isFinite(start) ? start : 1,
              type: type && /^[1aAiI]$/.test(type) ? type : null,
            };
          },
        },
      ],
      // Re-checked here: JSON content and clipboard slice context skip getAttrs.
      toDOM: (node) => {
        const start = Number(node.attrs.start);
        const type = node.attrs.type as unknown;
        return [
          "ol",
          {
            start: Number.isInteger(start) && start !== 1 ? String(start) : null,
            type: typeof type === "string" && /^[1aAiI]$/.test(type) ? type : null,
          },
          0,
        ];
      },
    },
  }),
  commands: ({ schema }) => ({
    toggleOrderedList: () => toggleList(schema.nodes.orderedList!, schema.nodes.listItem!),
  }),
  keymap: ({ schema }) => ({ "Mod-Shift-7": toggleList(schema.nodes.orderedList!, schema.nodes.listItem!) }),
  inputRules: ({ schema }) => [
    wrappingInputRule(
      /^(\d+)\.\s$/,
      schema.nodes.orderedList!,
      (match) => ({ start: Number(match[1]) }),
      (match, node) => node.childCount + (node.attrs.start as number) === Number(match[1]),
    ),
  ],
});

export const TaskItem = defineExtension({
  name: "taskItem",
  nodes: (_o, { t }) => ({
    taskItem: {
      attrs: { checked: { default: false } },
      content: "paragraph block*",
      defining: true,
      parseDOM: [
        {
          tag: 'li[data-type="taskItem"]',
          priority: 51,
          getAttrs: (el: HTMLElement) => ({
            checked:
              el.getAttribute("data-checked") === "true" ||
              !!el.querySelector(':scope > input[type="checkbox"][checked], :scope > label > input[checked]'),
          }),
        },
      ],
      // Output keeps a real, labelled checkbox so readers of the published page get the state.
      toDOM: (node) => [
        "li",
        { "data-type": "taskItem", "data-checked": node.attrs.checked ? "true" : "false" },
        [
          "input",
          {
            type: "checkbox",
            disabled: "",
            checked: node.attrs.checked ? "" : null,
            "aria-label": t("task"),
          },
        ],
        ["div", 0],
      ],
    },
  }),
  commands: () => ({}),
  keymap: () => ({
    // Ctrl/Cmd+Enter toggles the task at the cursor.
    "Mod-Enter": (state, dispatch) => {
      const item = findParent(state.selection.$from, (t) => t.name === "taskItem");
      if (!item) return false;
      if (dispatch) dispatch(state.tr.setNodeMarkup(item.pos, undefined, { checked: !item.node.attrs.checked }));
      return true;
    },
  }),
  plugins: ({ editor }) => [
    new Plugin({
      props: {
        nodeViews: {
          taskItem: (node, view, getPos) => new TaskItemView(node, view, getPos, editor),
        },
      },
    }),
  ],
});

class TaskItemView implements NodeView {
  dom: HTMLLIElement;
  contentDOM: HTMLDivElement;
  private checkbox: HTMLInputElement;

  constructor(
    private node: PMNode,
    view: EditorView,
    getPos: () => number | undefined,
    editor: Editor,
  ) {
    this.checkbox = h("input", {
      type: "checkbox",
      className: "owe-task-checkbox",
      "aria-label": editor.t("toggleTask"),
    });
    this.checkbox.checked = node.attrs.checked as boolean;
    this.checkbox.addEventListener("mousedown", (e) => e.preventDefault()); // keep the text selection
    this.checkbox.addEventListener("change", () => {
      const pos = getPos();
      if (pos === undefined || !editor.isEditable) {
        this.checkbox.checked = this.node.attrs.checked as boolean;
        return;
      }
      view.dispatch(view.state.tr.setNodeMarkup(pos, undefined, { checked: this.checkbox.checked }));
    });
    const label = h("span", { contenteditable: "false", className: "owe-task-control" }, this.checkbox);
    this.contentDOM = h("div", { className: "owe-task-content" });
    this.dom = h("li", { "data-type": "taskItem" }, label, this.contentDOM);
    this.sync();
  }

  private sync() {
    this.dom.dataset.checked = String(this.node.attrs.checked);
    this.checkbox.checked = this.node.attrs.checked as boolean;
  }

  update(node: PMNode): boolean {
    if (node.type !== this.node.type) return false;
    this.node = node;
    this.sync();
    return true;
  }

  stopEvent(event: Event): boolean {
    return event.target === this.checkbox;
  }

  ignoreMutation(mutation: MutationRecord | { type: "selection"; target: Node }): boolean {
    return mutation.type !== "selection" && !this.contentDOM.contains(mutation.target);
  }
}

export const TaskList = defineExtension({
  name: "taskList",
  extensions: () => [TaskItem],
  nodes: () => ({
    taskList: {
      content: "taskItem+",
      group: "block list",
      parseDOM: [{ tag: 'ul[data-type="taskList"]', priority: 51 }],
      toDOM: () => ["ul", { "data-type": "taskList" }, 0],
    },
  }),
  commands: ({ schema }) => ({
    toggleTaskList: () => toggleList(schema.nodes.taskList!, schema.nodes.taskItem!),
  }),
  keymap: ({ schema }) => ({ "Mod-Shift-9": toggleList(schema.nodes.taskList!, schema.nodes.taskItem!) }),
  inputRules: ({ schema }) => [
    wrappingInputRule(/^\s*\[( |x|X)?\]\s$/, schema.nodes.taskList!),
  ],
});
