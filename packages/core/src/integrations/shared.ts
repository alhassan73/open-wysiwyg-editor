// Helpers for framework integrations: the <owe-editor> element and the @open-wysiwyg-editor/*
// packages use them, and so can your own wrapper (Solid, Lit, Qwik…).
import type { Content, Editor, EditorOptions } from "../core/editor";

/** Options an existing editor applies through `setOptions()`, without being recreated. */
export const RUNTIME_OPTIONS = [
  "editable",
  "placeholder",
  "ariaLabel",
  "ariaLabelledBy",
  "ariaDescribedBy",
  "dir",
  "contentLang",
] as const;

export type RuntimeOptions = Pick<EditorOptions, (typeof RUNTIME_OPTIONS)[number]>;

export type EditorCallbacks = Pick<
  EditorOptions,
  "onCreate" | "onUpdate" | "onSelectionUpdate" | "onFocus" | "onBlur" | "onDestroy" | "onContentError"
>;

export function pickRuntimeOptions(options: EditorOptions): RuntimeOptions {
  const picked: Record<string, unknown> = {};
  for (const key of RUNTIME_OPTIONS) picked[key] = options[key];
  return picked as RuntimeOptions;
}

export function sameRuntimeOptions(a: RuntimeOptions, b: RuntimeOptions): boolean {
  return RUNTIME_OPTIONS.every((key) => a[key] === b[key]);
}

/** Callbacks that always call the latest options' handlers, so a wrapper never recreates the editor for them. */
export function forwardCallbacks(get: () => EditorOptions): Required<EditorCallbacks> {
  return {
    onCreate: (editor) => get().onCreate?.(editor),
    onUpdate: (editor) => get().onUpdate?.(editor),
    onSelectionUpdate: (editor) => get().onSelectionUpdate?.(editor),
    onFocus: (editor, event) => get().onFocus?.(editor, event),
    onBlur: (editor, event) => get().onBlur?.(editor, event),
    onDestroy: () => get().onDestroy?.(),
    onContentError: (error) => get().onContentError?.(error),
  };
}

/**
 * Loads bound content into the editor. HTML the editor itself just produced (echoed back by a
 * two-way binding) is skipped, so typing never resets the cursor.
 */
export function syncContent(editor: Editor, content: Content): void {
  if (typeof content === "string" && content === editor.getHTML()) return;
  editor.setContent(content);
}
