// Headless build: engine + extensions, no UI code. Build your own interface on top of
// editor.commands / editor.can() / editor.isActive() / editor.subscribe().
export * from "./shared";
export { createEditor } from "./core/editor";
export { createEditor as createHeadlessEditor } from "./core/editor";
export type { EditorOptions } from "./core/editor";
