import { history, redo, undo } from "prosemirror-history";
import { dropCursor } from "prosemirror-dropcursor";
import { gapCursor } from "prosemirror-gapcursor";
import { defineExtension } from "../core/extension";

export interface HistoryOptions {
  depth: number;
  /** Changes closer together than this (ms) are undone as one step. */
  newGroupDelay: number;
}

export const History = defineExtension<HistoryOptions>({
  name: "history",
  defaultOptions: { depth: 200, newGroupDelay: 500 },
  commands: () => ({ undo: () => undo, redo: () => redo }),
  keymap: () => ({ "Mod-z": undo, "Shift-Mod-z": redo, "Mod-y": redo }),
  plugins: ({ options }) => [history(options)],
});

export const Dropcursor = defineExtension({
  name: "dropcursor",
  plugins: () => [dropCursor({ class: "owe-dropcursor", width: 2 })],
});

export const Gapcursor = defineExtension({
  name: "gapcursor",
  plugins: () => [gapCursor()],
});
