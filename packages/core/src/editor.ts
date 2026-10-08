import { createEditor as createHeadlessEditor, type Editor, type EditorOptions as CoreOptions } from "./core/editor";
import { StarterKit } from "./extensions/starter-kit";
import { attachUI, type UIOptions } from "./ui";

export interface EditorOptions extends CoreOptions {
  /**
   * The built-in accessible UI (toolbar, dialogs, find & replace, status bar). Pass `false` for a
   * headless editor and build your own UI with `editor.commands` / `editor.isActive`.
   */
  ui?: UIOptions | false;
}

/**
 * Creates an editor. With no options beyond `element` you get the complete experience:
 * StarterKit (every built-in feature) plus the accessible UI.
 *
 * ```ts
 * import { createEditor } from "open-wysiwyg-editor";
 * import "open-wysiwyg-editor/style.css";
 * const editor = createEditor({ element: document.querySelector("#editor") });
 * ```
 */
export function createEditor(options: EditorOptions = {}): Editor {
  const { ui, ...core } = options;
  const editor = createHeadlessEditor({ ...core, extensions: core.extensions ?? [StarterKit] });
  if (ui !== false) attachUI(editor, ui ?? {});
  return editor;
}

export { createHeadlessEditor };
