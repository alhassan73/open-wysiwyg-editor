import { Selection, type Command, type EditorState, type Transaction } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import type { CommandFactory } from "./extension";
import type { TextAlign, TextDirection, ImageAttrs, LinkAttrs, InsertTableOptions } from "./types";
import type { SearchQuery } from "../extensions/find-replace";

/**
 * Argument lists of every built-in command. Third-party extensions add theirs with:
 *   declare module "open-wysiwyg-editor" { interface CommandMap { myCommand: [value: string] } }
 */
export interface CommandMap {
  focus: [position?: "start" | "end" | number];
  blur: [];
  selectAll: [];
  undo: [];
  redo: [];
  // marks
  toggleBold: [];
  toggleItalic: [];
  toggleUnderline: [];
  toggleStrike: [];
  toggleCode: [];
  toggleSubscript: [];
  toggleSuperscript: [];
  setLink: [attrs: LinkAttrs];
  unsetLink: [];
  unsetAllMarks: [];
  // blocks
  setParagraph: [];
  setHeading: [level: number];
  toggleHeading: [level: number];
  toggleBlockquote: [];
  toggleCodeBlock: [attrs?: { language?: string | null }];
  setHardBreak: [];
  setHorizontalRule: [];
  toggleBulletList: [];
  toggleOrderedList: [];
  toggleTaskList: [];
  sinkListItem: [];
  liftListItem: [];
  clearNodes: [];
  // image
  setImage: [attrs: ImageAttrs];
  updateImage: [attrs: Partial<ImageAttrs>];
  // table
  insertTable: [options?: InsertTableOptions];
  addRowBefore: [];
  addRowAfter: [];
  addColumnBefore: [];
  addColumnAfter: [];
  deleteRow: [];
  deleteColumn: [];
  deleteTable: [];
  mergeCells: [];
  splitCell: [];
  toggleHeaderRow: [];
  toggleHeaderColumn: [];
  setTableCaption: [caption: string | null];
  goToNextCell: [direction: 1 | -1];
  // global attributes
  setTextAlign: [align: TextAlign];
  unsetTextAlign: [];
  setTextDirection: [dir: TextDirection];
  unsetTextDirection: [];
  // colors
  setTextColor: [color: string];
  unsetTextColor: [];
  setHighlight: [color?: string];
  unsetHighlight: [];
  toggleHighlight: [color?: string];
  // find & replace
  setSearch: [query: SearchQuery];
  clearSearch: [];
  findNext: [];
  findPrevious: [];
  replaceCurrent: [replacement: string];
  replaceAll: [replacement: string];
}

export type CommandName = keyof CommandMap;
export type SingleCommands = { [K in CommandName]: (...args: CommandMap[K]) => boolean };
export type ChainedCommands = { [K in CommandName]: (...args: CommandMap[K]) => ChainedCommands } & {
  run(): boolean;
};

interface Host {
  view: () => EditorView;
  focus: (position?: "start" | "end" | number) => void;
}

export function createCommandManager(factories: Record<string, CommandFactory>, host: Host) {
  const names = Object.keys(factories) as CommandName[];
  const get = (name: string, args: unknown[]): Command =>
    (factories[name] as (...a: unknown[]) => Command)(...args);

  const commands = {} as SingleCommands;
  const can = {} as SingleCommands;
  for (const name of names) {
    (commands as Record<string, unknown>)[name] = (...args: unknown[]) => {
      const view = host.view();
      return get(name, args)(view.state, view.dispatch, view);
    };
    (can as Record<string, unknown>)[name] = (...args: unknown[]) => {
      const view = host.view();
      return get(name, args)(view.state, undefined, view);
    };
  }

  /** Runs commands against successive states and folds all their steps into one transaction. */
  function chain(): ChainedCommands {
    const queue: Array<{ name: string; args: unknown[] }> = [];
    const api = {} as ChainedCommands;
    for (const name of names) {
      (api as Record<string, unknown>)[name] = (...args: unknown[]) => {
        queue.push({ name, args });
        return api;
      };
    }
    api.run = () => {
      const view = host.view();
      let state: EditorState = view.state;
      const tr = state.tr;
      let focusTo: "start" | "end" | number | undefined | null = null;
      for (const { name, args } of queue) {
        if (name === "focus") {
          focusTo = args[0] as typeof focusTo;
          continue;
        }
        let applied: Transaction | null = null;
        const ok = get(name, args)(state, (t) => (applied = t), view);
        if (!ok) return false;
        if (applied) state = foldInto(tr, applied, state);
      }
      if (tr.docChanged || tr.selectionSet || tr.storedMarksSet) view.dispatch(tr.scrollIntoView());
      if (focusTo !== null) host.focus(focusTo);
      return true;
    };
    return api;
  }

  return { commands, can, chain };
}

function foldInto(target: Transaction, source: Transaction, before: EditorState): EditorState {
  for (const step of source.steps) target.step(step);
  if (source.selectionSet) {
    target.setSelection(Selection.fromJSON(target.doc, source.selection.toJSON()));
  }
  if (source.storedMarksSet) target.setStoredMarks(source.storedMarks);
  return before.apply(source);
}
