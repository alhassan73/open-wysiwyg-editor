import { describe, expect, it } from "vitest";
// Needs `npm run build` first: the module is tested through its built output.
import module from "../dist/index.js";

describe("Nuxt module", () => {
  it("has the documented meta and defaults", async () => {
    const meta = await module.getMeta?.();
    expect(meta?.name).toBe("@open-wysiwyg-editor/nuxt");
    expect(meta?.configKey).toBe("wysiwygEditor");
    expect(await module.getOptions?.({}, { options: {} } as never)).toEqual({ css: true, componentName: "RichTextEditor" });
  });
});
