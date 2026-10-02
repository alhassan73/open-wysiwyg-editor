import {
  addColumnAfter,
  addColumnBefore,
  addRowAfter,
  addRowBefore,
  columnResizing,
  deleteColumn,
  deleteRow,
  deleteTable,
  goToNextCell,
  mergeCells,
  splitCell,
  tableEditing,
  tableNodes,
  toggleHeader,
} from "prosemirror-tables";
import { Plugin, TextSelection, type Command } from "prosemirror-state";
import type { NodeSpec } from "prosemirror-model";
import { defineExtension } from "../core/extension";
import type { InsertTableOptions } from "../core/types";
import { findParent } from "./helpers";

export interface TableOptions {
  /** Drag handles to resize columns (a keyboard alternative is in the table menu). Default true. */
  resizable: boolean;
  /** Max rows/cols accepted by insertTable. */
  maxSize: number;
}

export const Table = defineExtension<TableOptions>({
  name: "table",
  defaultOptions: { resizable: true, maxSize: 100 },
  nodes: () => {
    const base = tableNodes({
      tableGroup: "block",
      cellContent: "block+",
      cellAttributes: {
        scope: {
          default: null,
          getFromDOM: (dom) => {
            const scope = dom.getAttribute("scope");
            return scope === "col" || scope === "row" ? scope : null;
          },
          setDOMAttr: (value, attrs) => {
            if (value) attrs.scope = value as string;
          },
        },
      },
    });
    const table: NodeSpec = {
      ...base.table,
      content: "tableRow+",
      attrs: { caption: { default: null } },
      parseDOM: [
        {
          tag: "table",
          getAttrs: (el: HTMLElement) => ({
            caption: el.querySelector(":scope > caption")?.textContent?.trim() || null,
          }),
        },
        // The caption is stored as an attribute (read above); don't parse it as cell content.
        { tag: "caption", ignore: true },
      ],
      toDOM: (node) =>
        node.attrs.caption
          ? ["table", ["caption", node.attrs.caption as string], ["tbody", 0]]
          : ["table", ["tbody", 0]],
    };
    return {
      table,
      tableRow: { ...base.table_row, content: "(tableCell | tableHeader)*" },
      tableCell: base.table_cell,
      tableHeader: base.table_header,
    };
  },
  commands: ({ schema, options }) => {
    const insertTable =
      ({ rows = 3, cols = 3, withHeaderRow = true, caption = null }: InsertTableOptions = {}): Command =>
      (state, dispatch) => {
        const r = clamp(rows, 1, options.maxSize);
        const c = clamp(cols, 1, options.maxSize);
        const { table, tableRow, tableCell, tableHeader, paragraph } = schema.nodes;
        const cell = (header: boolean) =>
          (header ? tableHeader! : tableCell!).createAndFill(header ? { scope: "col" } : null)!;
        const rowNodes = Array.from({ length: r }, (_, i) =>
          tableRow!.create(null, Array.from({ length: c }, () => cell(withHeaderRow && i === 0))),
        );
        const node = table!.create({ caption: caption?.trim() || null }, rowNodes);
        if (!dispatch) return true;
        const tr = state.tr.replaceSelectionWith(node);
        let tablePos = -1;
        tr.doc.descendants((n, pos) => {
          if (n === node) tablePos = pos;
          return tablePos < 0;
        });
        if (tablePos < 0) return false;
        // Keep a paragraph after a trailing table so there's always somewhere to continue typing.
        if (tablePos + node.nodeSize === tr.doc.content.size && paragraph) {
          tr.insert(tr.doc.content.size, paragraph.create());
        }
        tr.setSelection(TextSelection.near(tr.doc.resolve(tablePos + 4))); // first cell's paragraph
        dispatch(tr.scrollIntoView());
        return true;
      };
    const setTableCaption =
      (caption: string | null): Command =>
      (state, dispatch) => {
        const found = findParent(state.selection.$from, (t) => t.name === "table");
        if (!found) return false;
        if (dispatch) {
          dispatch(state.tr.setNodeMarkup(found.pos, undefined, { ...found.node.attrs, caption: caption?.trim() || null }));
        }
        return true;
      };
    return {
      insertTable,
      addRowBefore: () => addRowBefore,
      addRowAfter: () => addRowAfter,
      addColumnBefore: () => addColumnBefore,
      addColumnAfter: () => addColumnAfter,
      deleteRow: () => deleteRow,
      deleteColumn: () => deleteColumn,
      deleteTable: () => deleteTable,
      mergeCells: () => mergeCells,
      splitCell: () => splitCell,
      // The non-deprecated toggle logic (the default exports use the legacy behaviour).
      toggleHeaderRow: () => toggleHeader("row"),
      toggleHeaderColumn: () => toggleHeader("column"),
      setTableCaption,
      goToNextCell: (direction: 1 | -1) => goToNextCell(direction),
    };
  },
  keymap: () => ({
    // Fails at the last/first cell, so Tab then moves focus out of the editor (no trap).
    Tab: goToNextCell(1),
    "Shift-Tab": goToNextCell(-1),
  }),
  plugins: ({ options }) => [
    ...(options.resizable ? [columnResizing({ cellMinWidth: 48 })] : []),
    tableEditing(),
    headerScopePlugin(),
  ],
});

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.floor(Number.isFinite(n) ? n : min)));
}

/**
 * Keeps `scope` on header cells correct (col for the first row, row for the first column)
 * whatever command created them, so published tables are navigable by screen readers.
 */
function headerScopePlugin(): Plugin {
  return new Plugin({
    appendTransaction(trs, _old, state) {
      if (!trs.some((tr) => tr.docChanged)) return null;
      const tr = state.tr;
      state.doc.descendants((node, pos) => {
        if (node.type.name !== "table") return node.isBlock;
        node.forEach((row, rowOffset, rowIndex) => {
          row.forEach((cell, cellOffset, cellIndex) => {
            const want =
              cell.type.name === "tableHeader" ? (rowIndex === 0 ? "col" : cellIndex === 0 ? "row" : "col") : null;
            if (cell.attrs.scope !== want) {
              tr.setNodeMarkup(pos + 1 + rowOffset + 1 + cellOffset, undefined, { ...cell.attrs, scope: want });
            }
          });
        });
        return false;
      });
      return tr.docChanged ? tr.setMeta("addToHistory", false) : null;
    },
  });
}
