import { afterEach, describe, expect, it, vi } from "vitest";
import { h, render as mount, type ComponentChild } from "preact";
import { useState } from "preact/hooks";
import { act } from "preact/test-utils";
import { RichTextEditor, StarterKit, useEditor, type Editor } from "../src";

let container: HTMLElement | null = null;
const render = (el: ComponentChild) => {
  container ??= document.body.appendChild(document.createElement("div"));
  act(() => mount(el, container!));
};
const unmount = () =>
  act(() => {
    if (container) mount(null, container);
  });
const plain = (html: string) => html.replace(/ dir="auto"/g, "");
const type = (editor: Editor, text: string) =>
  act(() => {
    editor.commands.focus("end");
    editor.view.dispatch(editor.state.tr.insertText(text));
  });

afterEach(() => {
  unmount();
  container = null;
  document.body.replaceChildren();
});

describe("RichTextEditor", () => {
  it("mounts the full editor with the initial value and reports changes", () => {
    const onChange = vi.fn();
    let editor: Editor | null = null;
    render(h(RichTextEditor, { defaultValue: "<p>Hi</p>", onChange, onCreate: (e) => (editor = e) }));
    expect(document.querySelectorAll(".owe")).toHaveLength(1);
    expect(document.querySelector(".owe-toolbar")).not.toBeNull();
    expect(plain(editor!.getHTML())).toBe("<p>Hi</p>");
    type(editor!, " there");
    expect(plain(onChange.mock.lastCall![0])).toBe("<p>Hi there</p>");
  });

  it("is controlled by value without resetting on its own echo", () => {
    let editor: Editor | null = null;
    let setHtml: (html: string) => void = () => {};
    function App() {
      const [html, set] = useState("<p>One</p>");
      setHtml = set;
      return h(RichTextEditor, { value: html, onChange: set, onCreate: (e) => (editor = e) });
    }
    render(h(App, null));
    type(editor!, " two");
    expect(plain(editor!.getHTML())).toBe("<p>One two</p>");
    expect(editor!.state.selection.from).toBe(editor!.state.doc.content.size - 1);
    act(() => setHtml("<h2>Reset</h2>"));
    expect(plain(editor!.getHTML())).toBe("<h2>Reset</h2>");
  });

  it("applies runtime options and keeps a hidden form field in sync", () => {
    let editor: Editor | null = null;
    const props = { name: "body", defaultValue: "<p>A</p>", onCreate: (e: Editor) => (editor = e) };
    render(h(RichTextEditor, { ...props, editable: false }));
    expect(editor!.isEditable).toBe(false);
    render(h(RichTextEditor, { ...props, editable: true }));
    expect(editor!.isEditable).toBe(true);
    const field = document.querySelector<HTMLInputElement>('input[name="body"]')!;
    expect(plain(field.value)).toBe("<p>A</p>");
    type(editor!, "B");
    expect(plain(field.value)).toBe("<p>AB</p>");
  });

  // Server rendering needs preact-render-to-string, which is not installed in this workspace.
  it.skip("renders on the server without touching the DOM", () => {});
});

describe("useEditor", () => {
  it("builds a headless editor for a custom UI and destroys it on unmount", () => {
    let instance: Editor | null = null;
    function Custom() {
      const { ref, editor } = useEditor({ extensions: [StarterKit], ui: false, content: "<p>x</p>" });
      instance = editor;
      return h("div", { ref });
    }
    render(h(Custom, null));
    expect(instance).not.toBeNull();
    expect(document.querySelector(".owe-toolbar")).toBeNull();
    const editor = instance!;
    unmount();
    expect(editor.isDestroyed).toBe(true);
  });
});
