import { afterEach, describe, expect, it, vi } from "vitest";
import { StrictMode, act, createElement, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { RichTextEditor, StarterKit, useEditor, type Editor } from "../src";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
const host = () => document.body.appendChild(document.createElement("div"));
const render = (el: ReturnType<typeof createElement>) => {
  root ??= createRoot(host());
  act(() => root!.render(createElement(StrictMode, null, el)));
};
const plain = (html: string) => html.replace(/ dir="auto"/g, "");
const type = (editor: Editor, text: string) =>
  act(() => {
    editor.commands.focus("end");
    editor.view.dispatch(editor.state.tr.insertText(text));
  });

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  document.body.replaceChildren();
});

describe("RichTextEditor", () => {
  it("mounts the full editor with the initial value and reports changes", () => {
    const onChange = vi.fn();
    let editor: Editor | null = null;
    render(createElement(RichTextEditor, { defaultValue: "<p>Hi</p>", onChange, onCreate: (e) => (editor = e) }));
    expect(document.querySelectorAll(".owe")).toHaveLength(1); // StrictMode remount leaves one editor
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
      return createElement(RichTextEditor, { value: html, onChange: set, onCreate: (e) => (editor = e) });
    }
    render(createElement(App));
    type(editor!, " two");
    expect(plain(editor!.getHTML())).toBe("<p>One two</p>");
    expect(editor!.state.selection.from).toBe(editor!.state.doc.content.size - 1); // cursor kept
    act(() => setHtml("<h2>Reset</h2>"));
    expect(plain(editor!.getHTML())).toBe("<h2>Reset</h2>");
  });

  it("applies runtime options and keeps a hidden form field in sync", () => {
    let editor: Editor | null = null;
    const props = { name: "body", defaultValue: "<p>A</p>", onCreate: (e: Editor) => (editor = e) };
    render(createElement(RichTextEditor, { ...props, editable: false }));
    expect(editor!.isEditable).toBe(false);
    render(createElement(RichTextEditor, { ...props, editable: true }));
    expect(editor!.isEditable).toBe(true);
    const field = document.querySelector<HTMLInputElement>('input[name="body"]')!;
    expect(plain(field.value)).toBe("<p>A</p>");
    type(editor!, "B");
    expect(plain(field.value)).toBe("<p>AB</p>");
  });

  it("renders on the server without touching the DOM", () => {
    const html = renderToString(createElement(RichTextEditor, { name: "body", defaultValue: "<p>x</p>" }));
    expect(html).toContain('name="body"');
    expect(html).not.toContain("owe-toolbar");
  });
});

describe("useEditor", () => {
  it("builds a headless editor for a custom UI and destroys it on unmount", () => {
    let instance: Editor | null = null;
    function Custom() {
      const { ref, editor } = useEditor({ extensions: [StarterKit], ui: false, content: "<p>x</p>" });
      instance = editor;
      return createElement("div", { ref });
    }
    render(createElement(Custom));
    expect(instance).not.toBeNull();
    expect(document.querySelector(".owe-toolbar")).toBeNull();
    const editor = instance!;
    act(() => root!.unmount());
    root = null;
    expect(editor.isDestroyed).toBe(true);
  });
});
