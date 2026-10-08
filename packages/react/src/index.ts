// React adapter (React 18+, Next.js App and Pages Router, Remix, Gatsby, Vite). The build marks
// this file "use client", so Server Components can render <RichTextEditor> directly.
import { createElement, useEffect, useRef, useState, type ReactElement, type RefObject } from "react";
import {
  RUNTIME_OPTIONS,
  createEditor,
  forwardCallbacks,
  pickRuntimeOptions,
  syncContent,
  type Content,
  type Editor,
  type EditorOptions,
} from "open-wysiwyg-editor";

// One install gives the whole API: StarterKit, getUI, types…
export * from "open-wysiwyg-editor";

export interface UseEditorResult {
  /** Attach to the element the editor mounts in: `<div ref={ref} />`. */
  ref: RefObject<HTMLDivElement | null>;
  /** The live editor, or `null` before mount and during server rendering. */
  editor: Editor | null;
}

/**
 * Creates an editor in the element behind `ref` and destroys it on unmount.
 * Callbacks and the runtime options (`editable`, `placeholder`, `aria*`, `dir`, `contentLang`)
 * follow every render; everything else (`extensions`, `ui`, `language`…) is read once at mount.
 * Give the component a new `key` to apply those.
 */
export function useEditor(options: EditorOptions = {}): UseEditorResult {
  const ref = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const latest = useRef(options);

  useEffect(() => {
    latest.current = options;
  });

  useEffect(() => {
    const instance = createEditor({
      ...latest.current,
      element: ref.current,
      ...forwardCallbacks(() => latest.current),
    });
    setEditor(instance);
    return () => {
      instance.destroy();
      setEditor(null);
    };
  }, []);

  const runtime = RUNTIME_OPTIONS.map((key) => options[key]);
  useEffect(() => {
    editor?.setOptions(pickRuntimeOptions(latest.current));
  }, [editor, ...runtime]);

  return { ref, editor };
}

export interface RichTextEditorProps extends Omit<EditorOptions, "element" | "content"> {
  /** Controlled HTML. The editor loads it whenever it differs from what the editor last produced. */
  value?: string;
  /** Initial content (HTML or JSON) for an uncontrolled editor. */
  defaultValue?: Content;
  /** Called with the new HTML on every change. */
  onChange?: (html: string, editor: Editor) => void;
  /**
   * Form field name. The HTML is kept in a hidden input, so `<form action={serverAction}>`
   * (Next.js, React 19) and plain form posts receive it.
   */
  name?: string;
  className?: string;
  id?: string;
}

/**
 * The full editor (toolbar, dialogs, status bar) as a component.
 *
 * ```tsx
 * const [html, setHtml] = useState("<p>Hello</p>");
 * <RichTextEditor value={html} onChange={setHtml} />
 * ```
 */
export function RichTextEditor(props: RichTextEditorProps): ReactElement {
  const { value, defaultValue, onChange, name, className, id, ...options } = props;
  const applied = useRef<Content>(value);
  const field = useRef<HTMLInputElement>(null);
  const { ref, editor } = useEditor({
    ...options,
    content: value ?? defaultValue,
    onCreate: (instance) => {
      if (field.current) field.current.value = instance.getHTML();
      options.onCreate?.(instance);
    },
    onUpdate: (instance) => {
      const html = instance.getHTML();
      applied.current = html;
      if (field.current) field.current.value = html;
      options.onUpdate?.(instance);
      onChange?.(html, instance);
    },
  });

  useEffect(() => {
    if (!editor || value === undefined || value === applied.current) return;
    applied.current = value;
    syncContent(editor, value);
    if (field.current) field.current.value = editor.getHTML();
  }, [editor, value]);

  // Uncontrolled hidden input: the server renders the initial HTML, the editor keeps it current.
  const initial = typeof (value ?? defaultValue) === "string" ? ((value ?? defaultValue) as string) : "";
  return createElement(
    "div",
    { className, id },
    createElement("div", { ref }),
    name ? createElement("input", { ref: field, type: "hidden", name, defaultValue: initial }) : null,
  );
}
