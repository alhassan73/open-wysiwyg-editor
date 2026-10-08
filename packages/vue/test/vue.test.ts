import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp, createSSRApp, h, nextTick, ref, type App } from "vue";
import { renderToString } from "vue/server-renderer";
import { RichTextEditor, type Editor } from "../src/index";

const mounted: { app: App; root: HTMLElement }[] = [];

function mount(render: () => ReturnType<typeof h>) {
  const root = document.createElement("div");
  document.body.append(root);
  const app = createApp({ render });
  app.mount(root);
  mounted.push({ app, root });
  return { app, root };
}

const content = (root: HTMLElement) => root.querySelector<HTMLElement>("[contenteditable]")!;

afterEach(() => {
  for (const { app, root } of mounted.splice(0)) {
    app.unmount();
    root.remove();
  }
});

describe("RichTextEditor (Vue)", () => {
  it("mounts the full editor with modelValue", () => {
    const { root } = mount(() => h(RichTextEditor, { modelValue: "<p>Hello</p>" }));
    expect(root.querySelector('[role="toolbar"]')).toBeTruthy();
    expect(content(root).textContent).toBe("Hello");
  });

  it("emits update:modelValue on typing and the parent ref follows", async () => {
    const html = ref("<p>Hello</p>");
    const editorRef = ref<{ editor: Editor | null }>();
    const { root } = mount(() =>
      h(RichTextEditor, {
        ref: editorRef,
        modelValue: html.value,
        "onUpdate:modelValue": (v: string) => (html.value = v),
      }),
    );
    const editor = editorRef.value!.editor!;
    editor.setContent("<p>Hello world</p>", { emitUpdate: true });
    await nextTick();
    expect(html.value).toContain("Hello world");
    // The parent echo must not reset the content (and the cursor with it).
    const node = content(root).firstElementChild;
    await nextTick();
    expect(content(root).firstElementChild).toBe(node);
  });

  it("loads new content when the parent value changes", async () => {
    const html = ref("<p>One</p>");
    const { root } = mount(() => h(RichTextEditor, { modelValue: html.value }));
    html.value = "<p>Two</p>";
    await nextTick();
    expect(content(root).textContent).toBe("Two");
  });

  it("toggles editor.isEditable with the editable prop", async () => {
    const editable = ref(true);
    const editorRef = ref<{ editor: Editor | null }>();
    mount(() => h(RichTextEditor, { ref: editorRef, modelValue: "<p>x</p>", editable: editable.value }));
    expect(editorRef.value!.editor!.isEditable).toBe(true);
    editable.value = false;
    await nextTick();
    expect(editorRef.value!.editor!.isEditable).toBe(false);
  });

  it("does not call setOptions when an inline options object re-renders", async () => {
    const tick = ref(0);
    const editorRef = ref<{ editor: Editor | null }>();
    mount(() => {
      void tick.value; // re-render dependency
      return h(RichTextEditor, { ref: editorRef, modelValue: "<p>x</p>", options: { language: "ar" } });
    });
    const spy = vi.spyOn(editorRef.value!.editor!, "setOptions");
    tick.value++;
    await nextTick();
    tick.value++;
    await nextTick();
    expect(spy).not.toHaveBeenCalled();
  });

  it("keeps the hidden name input in sync", async () => {
    const html = ref("<p>A</p>");
    const { root } = mount(() => h(RichTextEditor, { modelValue: html.value, name: "body" }));
    const input = root.querySelector<HTMLInputElement>('input[type="hidden"][name="body"]')!;
    expect(input.value).toContain(">A</p>");
    html.value = "<p>B</p>";
    await nextTick();
    expect(input.value).toContain(">B</p>");
  });

  it("emits ready with the editor and exposes it on the template ref", () => {
    const onReady = vi.fn();
    const editorRef = ref<{ editor: Editor | null }>();
    mount(() => h(RichTextEditor, { ref: editorRef, onReady }));
    expect(onReady).toHaveBeenCalledTimes(1);
    expect(onReady.mock.calls[0][0]).toBe(editorRef.value!.editor);
    expect(typeof editorRef.value!.editor!.getHTML).toBe("function");
  });

  it("destroys the editor on unmount", () => {
    const onDestroy = vi.fn();
    const { app, root } = mount(() => h(RichTextEditor, { options: { onDestroy } }));
    app.unmount();
    expect(onDestroy).toHaveBeenCalledTimes(1);
    expect(root.querySelector("[contenteditable]")).toBeNull();
    mounted.length = 0;
    root.remove();
  });

  it("renders on the server without touching the DOM", async () => {
    const createElement = vi.spyOn(document, "createElement");
    const html = await renderToString(
      createSSRApp({ render: () => h(RichTextEditor, { modelValue: "<p>x</p>", name: "body" }) }),
    );
    expect(createElement).not.toHaveBeenCalled();
    createElement.mockRestore();
    expect(html).toContain('name="body"');
    expect(html).not.toContain("contenteditable");
  });
});
