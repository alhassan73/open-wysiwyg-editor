// Vue 3 adapter (Vue 3.3+, Nuxt, Vite, Quasar). The editor is created in onMounted, which never
// runs on the server, so the component is SSR-safe without <ClientOnly>.
import { defineComponent, h, onBeforeUnmount, onMounted, shallowRef, watch, type PropType } from "vue";
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

export type RichTextEditorOptions = Omit<EditorOptions, "element">;

/**
 * The full editor (toolbar, dialogs, status bar) as a component with `v-model` (HTML).
 *
 * ```vue
 * <RichTextEditor v-model="html" placeholder="Write…" :options="{ language: 'ar' }" />
 * ```
 *
 * `options` takes everything `createEditor()` accepts. Callbacks and the runtime options
 * (`editable`, `placeholder`, `aria*`, `dir`, `contentLang`) follow changes; the rest is read once at
 * mount. The template ref exposes `editor`.
 */
export const RichTextEditor = defineComponent({
  name: "RichTextEditor",
  props: {
    /** The content as HTML (`v-model`). */
    modelValue: { type: String, default: undefined },
    /** Everything else `createEditor()` accepts. */
    options: { type: Object as PropType<RichTextEditorOptions>, default: () => ({}) },
    editable: { type: Boolean, default: true },
    placeholder: { type: String, default: undefined },
    /** Form field name: the HTML is kept in a hidden input for plain form posts. */
    name: { type: String, default: undefined },
  },
  emits: {
    "update:modelValue": (html: string) => typeof html === "string",
    ready: (editor: Editor) => !!editor,
  },
  setup(props, { emit, expose }) {
    const host = shallowRef<HTMLElement>();
    const field = shallowRef<HTMLInputElement>();
    const editor = shallowRef<Editor | null>(null);
    let applied = props.modelValue;

    const resolved = (): EditorOptions => ({
      ...props.options,
      editable: props.editable && props.options.editable !== false,
      placeholder: props.placeholder ?? props.options.placeholder,
    });
    const syncField = (html: string) => {
      if (field.value) field.value.value = html;
    };

    onMounted(() => {
      const instance = createEditor({
        ...resolved(),
        element: host.value,
        content: props.modelValue ?? props.options.content,
        ...forwardCallbacks(resolved),
        onUpdate: (e) => {
          applied = e.getHTML();
          syncField(applied);
          props.options.onUpdate?.(e);
          emit("update:modelValue", applied);
        },
      });
      editor.value = instance;
      syncField(instance.getHTML());
      emit("ready", instance);
    });

    watch(
      () => props.modelValue,
      (value) => {
        if (!editor.value || value === undefined || value === applied) return;
        applied = value;
        syncContent(editor.value, value);
        syncField(editor.value.getHTML());
      },
    );

    watch(
      () => pickRuntimeOptions(resolved()),
      (next, previous) => {
        if (!sameRuntimeOptions(next, previous)) editor.value?.setOptions(next);
      },
    );

    onBeforeUnmount(() => {
      editor.value?.destroy();
      editor.value = null;
    });

    expose({ editor });
    return () =>
      h("div", null, [
        h("div", { ref: host }),
        props.name
          ? h("input", { ref: field, type: "hidden", name: props.name, value: props.modelValue ?? "" })
          : null,
      ]);
  },
});
