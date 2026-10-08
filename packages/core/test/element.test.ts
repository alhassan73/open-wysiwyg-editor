import { afterEach, describe, expect, it, vi } from "vitest";
import { createEditor, StarterKit } from "../src";
import { EDITOR_TAG, type EditorElement } from "../src/element";

const plain = (html: string) => html.replace(/ dir="auto"/g, "");

afterEach(() => document.body.replaceChildren());

describe("createEditor({ element: selector })", () => {
  it("mounts into the element a CSS selector matches", () => {
    document.body.append(Object.assign(document.createElement("div"), { id: "host" }));
    const editor = createEditor({ element: "#host", extensions: [StarterKit], content: "<p>x</p>" });
    expect(document.querySelector("#host")!.contains(editor.root)).toBe(true);
    editor.destroy();
  });

  it("throws a clear error when nothing matches", () => {
    expect(() => createEditor({ element: "#missing" })).toThrow(/No element matches "#missing"/);
  });
});

describe("<owe-editor>", () => {
  const mount = (markup: string): EditorElement => {
    const wrapper = document.createElement("div");
    // Test fixture markup, not user content.
    wrapper.innerHTML = markup;
    document.body.append(wrapper);
    return wrapper.querySelector(EDITOR_TAG)!;
  };

  it("is defined on import and turns its children into the initial content", () => {
    const el = mount(`<owe-editor placeholder="Write…"><p>Hello</p></owe-editor>`);
    expect(customElements.get(EDITOR_TAG)).toBeDefined();
    expect(el.editor).not.toBeNull();
    expect(plain(el.value)).toBe("<p>Hello</p>");
    expect(el.querySelector(".owe-toolbar")).not.toBeNull();
  });

  it("reads inert <template> content (safe for server-rendered HTML)", () => {
    const el = mount(`<owe-editor><template><p>Safe<img src=x onerror="alert(1)"></p></template></owe-editor>`);
    expect(el.value).not.toContain("onerror");
    expect(plain(el.value)).toContain("<p>Safe");
  });

  it("reads the value attribute (escaped, so safe for server-rendered HTML)", () => {
    const el = mount(`<owe-editor value="&lt;h2&gt;From attr&lt;/h2&gt;&lt;img src=x onerror=alert(1)&gt;"></owe-editor>`);
    expect(el.value).toContain("<h2");
    expect(el.value).not.toContain("onerror");
  });

  it("fires its own input event, which carries .value, and change on blur", () => {
    const el = mount(`<owe-editor><p>A</p></owe-editor>`);
    const onInput = vi.fn((event: Event) => (event.target as EditorElement).value);
    const onChange = vi.fn();
    el.addEventListener("input", onInput);
    el.addEventListener("change", onChange);
    const editor = el.editor!;
    editor.commands.focus("end");
    editor.view.dispatch(editor.state.tr.insertText("B"));
    expect(onInput).toHaveBeenCalledOnce();
    expect(onInput.mock.results[0]!.value).toContain("AB");
    editor.view.dom.dispatchEvent(new FocusEvent("blur"));
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("maps attributes to options and follows changes", () => {
    const el = mount(`<owe-editor readonly toolbar="bold italic" label="Bio"></owe-editor>`);
    const editor = el.editor!;
    expect(editor.isEditable).toBe(false);
    expect(editor.view.dom.getAttribute("aria-label")).toBe("Bio");
    expect(el.querySelectorAll(".owe-toolbar button")).toHaveLength(2);
    el.removeAttribute("readonly");
    expect(editor.isEditable).toBe(true);
  });

  it("loads content from .value and keeps it when moved in the DOM", () => {
    const el = mount(`<owe-editor></owe-editor>`);
    el.value = "<h2>Title</h2>";
    expect(plain(el.value)).toBe("<h2>Title</h2>");
    document.body.append(el); // disconnect + connect
    expect(el.editor).not.toBeNull();
    expect(plain(el.value)).toBe("<h2>Title</h2>");
  });

  it("destroys the editor when removed", () => {
    const el = mount(`<owe-editor><p>x</p></owe-editor>`);
    const editor = el.editor!;
    el.remove();
    expect(editor.isDestroyed).toBe(true);
    expect(el.editor).toBeNull();
  });
});
