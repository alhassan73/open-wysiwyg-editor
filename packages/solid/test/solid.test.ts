import { afterEach, describe, expect, it, vi } from "vitest";
import { createRoot, createSignal } from "solid-js";
import { richText, type Editor, type RichTextOptions } from "../src";

const plain = (html: string) => html.replace(/ dir="auto"/g, "");
const type = (editor: Editor, text: string) => {
  editor.commands.focus("end");
  editor.view.dispatch(editor.state.tr.insertText(text));
};
const flush = () => Promise.resolve();

afterEach(() => document.body.replaceChildren());

function mount(initial: RichTextOptions) {
  const node = document.body.appendChild(document.createElement("div"));
  let editor!: Editor;
  let set!: (o: RichTextOptions) => void;
  let dispose!: () => void;
  createRoot((d) => {
    dispose = d;
    const [options, setOptions] = createSignal<RichTextOptions>(initial);
    set = setOptions;
    editor = richText(node, options);
  });
  return { node, editor, set, dispose };
}

describe("richText directive", () => {
  it("mounts the full editor with the initial content", () => {
    const { node, editor, dispose } = mount({ content: "<p>Hi</p>" });
    expect(node.querySelector(".owe-toolbar")).not.toBeNull();
    expect(plain(editor.getHTML())).toBe("<p>Hi</p>");
    dispose();
  });

  it("syncs content without echoing its own HTML", async () => {
    let html = "<p>One</p>";
    const { editor, set, dispose } = mount({ content: html });
    const setContent = vi.spyOn(editor, "setContent");
    const onUpdate = (e: Editor) => {
      html = e.getHTML();
      set({ content: html, onUpdate });
    };
    set({ content: html, onUpdate });
    await flush();
    type(editor, " two");
    await flush();
    expect(setContent).not.toHaveBeenCalled();
    expect(plain(editor.getHTML())).toBe("<p>One two</p>");
    set({ content: "<p>Other</p>", onUpdate });
    await flush();
    expect(plain(editor.getHTML())).toBe("<p>Other</p>");
    dispose();
  });

  it("applies runtime options only when they change", async () => {
    const { editor, set, dispose } = mount({ placeholder: "A" });
    const setOptions = vi.spyOn(editor, "setOptions");
    set({ placeholder: "A" });
    await flush();
    expect(setOptions).not.toHaveBeenCalled();
    set({ placeholder: "B" });
    await flush();
    expect(setOptions).toHaveBeenCalledTimes(1);
    dispose();
  });

  it("destroys the editor when the owner is disposed", () => {
    const onDestroy = vi.fn();
    const { node, dispose } = mount({ content: "<p>x</p>", onDestroy });
    expect(node.querySelector(".owe")).not.toBeNull();
    dispose();
    expect(onDestroy).toHaveBeenCalledTimes(1);
    expect(node.querySelector(".owe")).toBeNull();
  });
});
