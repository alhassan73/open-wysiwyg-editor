// Svelte action (Svelte 3, 4 and 5, SvelteKit). Actions only run in the browser, so it is SSR-safe.
// It has no dependency on Svelte itself.
import {
  createEditor,
  forwardCallbacks,
  pickRuntimeOptions,
  sameRuntimeOptions,
  syncContent,
  type Editor,
  type EditorOptions,
} from "open-wysiwyg-editor";

// One install gives the whole API: StarterKit, getUI, types…
export * from "open-wysiwyg-editor";

export type RichTextOptions = Omit<EditorOptions, "element">;

export interface RichTextAction {
  update(options: RichTextOptions): void;
  destroy(): void;
}

/**
 * Mounts the full editor in the element it is used on.
 *
 * ```svelte
 * <div use:richText={{ content: html, onUpdate: (e) => (html = e.getHTML()) }}></div>
 * ```
 *
 * When `content` changes, the editor loads it, unless it is the HTML the editor just produced.
 * Callbacks and the runtime options (`editable`, `placeholder`, `aria*`, `dir`, `contentLang`)
 * follow changes; the rest is read once. `onCreate` receives the editor instance.
 */
export function richText(node: HTMLElement, options: RichTextOptions = {}): RichTextAction {
  let current = options;
  let applied = options.content;
  let runtime = pickRuntimeOptions(options);
  const editor: Editor = createEditor({
    ...options,
    element: node,
    ...forwardCallbacks(() => current),
    onUpdate: (e) => {
      applied = e.getHTML();
      current.onUpdate?.(e);
    },
  });

  return {
    update(next) {
      current = next;
      if (next.content !== applied) {
        applied = next.content;
        syncContent(editor, next.content);
      }
      const nextRuntime = pickRuntimeOptions(next);
      if (!sameRuntimeOptions(runtime, nextRuntime)) {
        runtime = nextRuntime;
        editor.setOptions(nextRuntime);
      }
    },
    destroy() {
      editor.destroy();
    },
  };
}
