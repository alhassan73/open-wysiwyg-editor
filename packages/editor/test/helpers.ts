import { afterEach } from "vitest";
import { TextSelection } from "prosemirror-state";
import { createEditor, StarterKit, type Editor, type EditorOptions } from "../src";

const live: Editor[] = [];

export function make(options: EditorOptions = {}): Editor {
  const element = document.createElement("div");
  document.body.append(element);
  const editor = createEditor({ element, extensions: [StarterKit], ...options });
  live.push(editor);
  return editor;
}

/** Selects the first occurrence of `text` in the document. */
export function selectText(editor: Editor, text: string): void {
  let found = -1;
  editor.state.doc.descendants((node, pos) => {
    if (found >= 0) return false;
    if (node.isText) {
      const i = node.text!.indexOf(text);
      if (i >= 0) found = pos + i;
    }
    return true;
  });
  if (found < 0) throw new Error(`text "${text}" not found`);
  editor.view.dispatch(
    editor.state.tr.setSelection(TextSelection.create(editor.state.doc, found, found + text.length)),
  );
}

/** Places a collapsed cursor right after the first occurrence of `text`. */
export function cursorAfter(editor: Editor, text: string): void {
  selectText(editor, text);
  const { to } = editor.state.selection;
  editor.view.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, to)));
}

afterEach(() => {
  while (live.length) live.pop()!.destroy();
  document.body.replaceChildren();
});
