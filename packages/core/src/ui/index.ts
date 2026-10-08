import type { Editor } from "../core/editor";
import { h } from "../core/dom";
import { createToolbar } from "./components";
import { openColorDialog, openHelpDialog, openImageDialog, openLinkDialog, openTableCaptionDialog, openTableDialog } from "./dialogs";
import { createFindBar } from "./find";
import {
  BUILT_IN_ITEMS,
  DEFAULT_TOOLBAR,
  customItem,
  type CustomItemSpec,
  type DialogKind,
  type ItemContext,
  type ToolbarItem,
  type ToolbarItemFactory,
} from "./items";
import { matches } from "./shortcuts";
import { createStatusbar, type StatusbarOptions } from "./statusbar";
import { createSourceView } from "./source";
import { setDisabled } from "./components";
import { createTooltip } from "./tooltip";
import { THEME_TOKENS, applyTheme, type ThemeMode, type ThemeOptions, type ThemeToken } from "./theme";

export interface UIOptions extends ThemeOptions {
  /** Toolbar layout: item names and "|" separators. `false` hides the toolbar. */
  toolbar?: string[] | false;
  /** Extra/overriding toolbar items, referenced by name in `toolbar`. */
  items?: Record<string, CustomItemSpec | ToolbarItemFactory>;
  statusbar?: StatusbarOptions | false;
  /** Keep the toolbar visible while scrolling long documents. Default true. */
  stickyToolbar?: boolean;
  /** Keyboard shortcuts handled by the UI (set one to false to disable it). */
  shortcuts?: {
    toolbar?: string | false;
    help?: string | false;
    find?: string | false;
    link?: string | false;
  };
}

export interface EditorUI {
  focusToolbar(): void;
  openDialog(kind: DialogKind): void;
  openFind(): void;
  /** Switch between the rich text view and the HTML source view. */
  toggleSource(): void;
  isSourceMode(): boolean;
  /** Re-sync toolbar state (normally automatic). */
  update(): void;
  /** Changes `theme`, `brand` and `tokens` while the editor is running. It replaces the whole theme. */
  setTheme(theme: ThemeOptions): void;
  destroy(): void;
}

const uiRegistry = new WeakMap<Editor, EditorUI>();
export const getUI = (editor: Editor): EditorUI | undefined => uiRegistry.get(editor);

export function attachUI(editor: Editor, options: UIOptions = {}): EditorUI {
  const root = editor.root;
  const body = editor.view.dom.parentElement!;
  const getDir = () => (root.getAttribute("dir") === "rtl" ? "rtl" : "ltr");
  const popups = h("div", { className: "owe-popups" });
  root.append(popups);
  const tooltip = createTooltip(popups, getDir);
  const shortcuts = {
    toolbar: "Alt-F10",
    help: "Alt-0",
    find: "Mod-f",
    link: "Mod-k",
    ...options.shortcuts,
  };
  applyTheme(root, options);

  const findBar = "setSearch" in editor.commands ? createFindBar(editor, tooltip) : null;

  function openDialog(kind: DialogKind, returnTo?: HTMLElement) {
    const ctx = {
      editor,
      container: popups,
      restoreFocus: () => {
        if (returnTo?.isConnected && !returnTo.hidden) returnTo.focus();
        else editor.focus();
      },
    };
    if (kind === "link") openLinkDialog(ctx);
    else if (kind === "image") openImageDialog(ctx);
    else if (kind === "table") openTableDialog(ctx);
    else if (kind === "tableCaption") openTableCaptionDialog(ctx);
    else if (kind === "textColor" || kind === "highlight") openColorDialog(ctx, kind);
    else openHelpDialog(ctx);
  }

  const source = createSourceView(editor);
  const toggleSource = () => {
    if (source.isOpen()) source.close();
    else {
      findBar?.close();
      source.open();
    }
    schedule();
  };

  const itemCtx: ItemContext = {
    editor,
    tooltip,
    popups,
    getDir,
    openDialog,
    openFind: () => findBar?.open(),
    toggleSource,
    isSourceMode: source.isOpen,
  };

  // ---- toolbar -------------------------------------------------------------------------------
  const items: ToolbarItem[] = [];
  const sourceItems = new Set<ToolbarItem>();
  const toolbar = options.toolbar === false ? null : createToolbar(editor.t("toolbar"), getDir);
  if (toolbar) {
    let pendingSeparator = false;
    for (const name of options.toolbar || DEFAULT_TOOLBAR) {
      if (name === "|") {
        pendingSeparator = items.length > 0;
        continue;
      }
      const custom = options.items?.[name];
      const factory = typeof custom === "function" ? custom : custom ? customItem(custom) : BUILT_IN_ITEMS[name];
      const item = factory?.(itemCtx);
      if (!item) continue; // unknown name or the feature isn't enabled
      if (pendingSeparator) toolbar.separator();
      pendingSeparator = false;
      toolbar.add(item.element);
      items.push(item);
      if (name === "sourceCode" || name === "help") sourceItems.add(item);
    }
    const wrap = h("div", { className: `owe-toolbar-wrap${options.stickyToolbar === false ? "" : " owe-sticky"}` }, toolbar.element);
    root.insertBefore(wrap, body);
  }
  if (findBar) root.insertBefore(findBar.element, body);

  const statusbar = options.statusbar === false ? null : createStatusbar(editor, options.statusbar ?? {});
  if (statusbar) body.after(statusbar.element);

  // ---- state sync ----------------------------------------------------------------------------
  let frame = 0;
  const update = () => {
    frame = 0;
    if (editor.isDestroyed) return;
    const sourceMode = source.isOpen();
    for (const item of items) {
      item.update?.();
      // Formatting controls don't apply to raw HTML.
      if (sourceMode && !sourceItems.has(item)) setDisabled(item.element, true);
    }
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  update();
  const offs = [editor.on("transaction", schedule), editor.on("options", schedule), editor.on("focus", schedule)];

  // ---- keyboard model ------------------------------------------------------------------------
  const onKeyDown = (e: KeyboardEvent) => {
    const target = e.target as Node;
    const inContent = editor.view.dom.contains(target);
    if (e.key === "Escape" && tooltip.dismiss()) {
      e.stopPropagation();
      return;
    }
    if (toolbar && shortcuts.toolbar && matches(e, shortcuts.toolbar) && !toolbar.contains(target)) {
      e.preventDefault();
      toolbar.focus();
    } else if (toolbar && e.key === "Escape" && toolbar.contains(target)) {
      e.preventDefault();
      if (source.isOpen()) source.focus();
      else editor.focus(); // back to the text with the previous selection
    } else if (shortcuts.help && matches(e, shortcuts.help)) {
      e.preventDefault();
      openDialog("help", inContent ? undefined : (document.activeElement as HTMLElement));
    } else if (inContent && shortcuts.link && matches(e, shortcuts.link) && editor.schema.marks.link) {
      e.preventDefault();
      openDialog("link");
    } else if (findBar && shortcuts.find && matches(e, shortcuts.find) && (inContent || toolbar?.contains(target))) {
      e.preventDefault();
      findBar.open();
    }
  };
  root.addEventListener("keydown", onKeyDown);

  const ui: EditorUI = {
    focusToolbar: () => toolbar?.focus(),
    openDialog: (kind) => openDialog(kind),
    openFind: () => findBar?.open(),
    toggleSource,
    isSourceMode: source.isOpen,
    update,
    setTheme: (theme) => applyTheme(root, theme),
    destroy() {
      cancelAnimationFrame(frame);
      source.destroy();
      offs.forEach((off) => off());
      root.removeEventListener("keydown", onKeyDown);
      for (const item of items) item.destroy?.();
      statusbar?.destroy();
      tooltip.destroy();
      popups.remove();
      uiRegistry.delete(editor);
    },
  };
  uiRegistry.set(editor, ui);
  editor.on("destroy", ui.destroy);
  return ui;
}

export { BUILT_IN_ITEMS, DEFAULT_TOOLBAR, THEME_TOKENS, applyTheme, customItem };
export type {
  CustomItemSpec,
  ItemContext,
  StatusbarOptions,
  ThemeMode,
  ThemeOptions,
  ThemeToken,
  ToolbarItem,
  ToolbarItemFactory,
};
