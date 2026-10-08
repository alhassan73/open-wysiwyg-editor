// SolidJS directive (Solid 1.6+, SolidStart). Directives only run in the browser, so it is SSR-safe.
//
//   import { richText } from "@open-wysiwyg-editor/solid";
//   <div use:richText={{ content: html(), onUpdate: (e) => setHtml(e.getHTML()) }} />
import { createEffect, onCleanup, untrack, type Accessor } from "solid-js";
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

/**
 * Mounts the full editor in the element it is used on, and destroys it with the owner.
 * When `content` changes, the editor loads it, unless it is the HTML the editor just produced.
 * Callbacks and the runtime options (`editable`, `placeholder`, `aria*`, `dir`, `contentLang`)
 * follow changes; the rest is read once. `onCreate` receives the editor instance.
 */
export function richText(node: HTMLElement, accessor: Accessor<RichTextOptions | undefined>): Editor {
  const current = () => accessor() ?? {};
  const initial = untrack(current);
  let applied = initial.content;
  let runtime = pickRuntimeOptions(initial);
  const editor = createEditor({
    ...initial,
    element: node,
    ...forwardCallbacks(current),
    onUpdate: (e) => {
      applied = e.getHTML();
      current().onUpdate?.(e);
    },
  });

  createEffect(() => {
    const next = current();
    if (next.content !== applied) {
      applied = next.content;
      syncContent(editor, next.content);
    }
    const nextRuntime = pickRuntimeOptions(next);
    if (!sameRuntimeOptions(runtime, nextRuntime)) {
      runtime = nextRuntime;
      editor.setOptions(nextRuntime);
    }
  });

  onCleanup(() => editor.destroy());
  return editor;
}

// Types `use:richText={…}` in JSX.
declare module "solid-js" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface Directives {
      richText: RichTextOptions;
    }
  }
}
