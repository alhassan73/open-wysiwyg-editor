import { describe, expect, it } from "vitest";
import * as next from "../src";

describe("@open-wysiwyg-editor/next", () => {
  it("re-exports the React API", () => {
    expect(typeof next.RichTextEditor).toBe("function");
    expect(typeof next.useEditor).toBe("function");
    expect(typeof next.createEditor).toBe("function");
  });
});
