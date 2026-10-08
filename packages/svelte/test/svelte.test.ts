import { afterEach, describe, expect, it, vi } from "vitest";
import { richText, type Editor } from "../src";

const nodes: HTMLElement[] = [];
const host = () => {
  const el = document.body.appendChild(document.createElement("div"));
  nodes.push(el);
  return el;
};
const plain = (html: string) => html.replace(/ dir="auto"/g, "");
const type = (editor: Editor, text: string) => {
  editor.commands.focus("end");
  editor.view.dispatch(editor.state.tr.insertText(text));
};

afterEach(() => {
  document.body.replaceChildren();
  nodes.length = 0;
});

describe("richText action", () => {
  it("mounts the full editor into the node with the initial content", () => {
    let editor!: Editor;
    const node = host();
    const action = richText(node, { content: "<p>Hi</p>", onCreate: (e) => (editor = e) });
    expect(node.querySelector(".owe-toolbar")).not.toBeNull();
    expect(plain(editor.getHTML())).toBe("<p>Hi</p>");
    action.destroy();
  });

  it("ignores its own echo and keeps the cursor, but loads new content", () => {
    let editor!: Editor;
    const node = host();
    let html = "<p>One</p>";
    const options = () => ({
      content: html,
      onCreate: (e: Editor) => (editor = e),
      onUpdate: (e: Editor) => (html = e.getHTML()),
    });
    const action = richText(node, options());
    const setContent = vi.spyOn(editor, "setContent");
    type(editor, " two");
    action.update(options()); // content === the editor's own HTML
    expect(setContent).not.toHaveBeenCalled();
    expect(plain(editor.getHTML())).toBe("<p>One two</p>");

    action.update({ ...options(), content: "<p>Other</p>" });
    expect(setContent).toHaveBeenCalledTimes(1);
    expect(plain(editor.getHTML())).toBe("<p>Other</p>");
    action.destroy();
  });

  it("calls setOptions only when runtime options change", () => {
    let editor!: Editor;
    const node = host();
    const base = { content: "<p>x</p>", onCreate: (e: Editor) => (editor = e) };
    const action = richText(node, { ...base, placeholder: "A" });
    const setOptions = vi.spyOn(editor, "setOptions");
    action.update({ ...base, placeholder: "A" });
    expect(setOptions).not.toHaveBeenCalled();
    action.update({ ...base, placeholder: "B" });
    expect(setOptions).toHaveBeenCalledTimes(1);
    action.update({ ...base, placeholder: "B", editable: false });
    expect(setOptions).toHaveBeenCalledTimes(2);
    action.destroy();
  });

  it("always calls the latest callback", () => {
    let editor!: Editor;
    const node = host();
    const first = vi.fn();
    const second = vi.fn();
    const action = richText(node, { onCreate: (e) => (editor = e), onUpdate: first });
    action.update({ onUpdate: second });
    type(editor, "a");
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalled();
    action.destroy();
  });

  it("cleans up on destroy", () => {
    const node = host();
    const onDestroy = vi.fn();
    const action = richText(node, { content: "<p>x</p>", onDestroy });
    expect(node.querySelector(".owe")).not.toBeNull();
    action.destroy();
    expect(onDestroy).toHaveBeenCalledTimes(1);
    expect(node.querySelector(".owe")).toBeNull();
  });
});
