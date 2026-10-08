import type { Editor } from "../core/editor";
import { h, uid } from "../core/dom";
import { getSearchState } from "../extensions/find-replace";
import { iconButton, setDisabled } from "./components";
import { matches } from "./shortcuts";
import type { Tooltip } from "./tooltip";

/**
 * Non-modal find & replace panel (ATAG A.3.5.1). Focus moves between the panel and the text
 * freely; Escape closes it and puts the caret on the current match; results are announced.
 */
export function createFindBar(editor: Editor, tooltip: Tooltip) {
  const t = editor.t;
  const titleId = uid("owe-find-title");
  const findInput = h("input", { type: "text", className: "owe-input", spellcheck: "false", autocomplete: "off" });
  const replaceInput = h("input", { type: "text", className: "owe-input", spellcheck: "false", autocomplete: "off" });
  const findId = uid("owe-find");
  const replaceId = uid("owe-replace");
  findInput.id = findId;
  replaceInput.id = replaceId;
  const status = h("span", { className: "owe-find-status", "aria-hidden": "true" });
  const caseBox = h("input", { type: "checkbox" });
  const wordBox = h("input", { type: "checkbox" });
  const prev = iconButton({ label: t("findPrevious"), icon: "chevronUp", shortcut: "Shift-Enter", tooltip });
  const next = iconButton({ label: t("findNext"), icon: "chevronDown", shortcut: "Enter", tooltip });
  const replaceBtn = h("button", { type: "button", className: "owe-button" }, t("replace"));
  const replaceAllBtn = h("button", { type: "button", className: "owe-button" }, t("replaceAll"));
  const closeBtn = iconButton({ label: t("closeFind"), icon: "close", tooltip });

  const element = h(
    "div",
    { className: "owe-findbar", role: "dialog", "aria-labelledby": titleId, hidden: true },
    h("span", { id: titleId, className: "owe-sr-only" }, t("findAndReplace")),
    h(
      "div",
      { className: "owe-find-row" },
      h("label", { for: findId, className: "owe-find-label" }, t("find")),
      findInput,
      status,
      prev,
      next,
      h("label", { className: "owe-check" }, caseBox, t("matchCase")),
      h("label", { className: "owe-check" }, wordBox, t("wholeWord")),
      closeBtn,
    ),
    h(
      "div",
      { className: "owe-find-row" },
      h("label", { for: replaceId, className: "owe-find-label" }, t("replaceWith")),
      replaceInput,
      replaceBtn,
      replaceAllBtn,
    ),
  );

  let announceTimer: ReturnType<typeof setTimeout> | undefined;

  function describe(): string {
    const s = getSearchState(editor.state);
    if (!s.query) return "";
    return t("matchCount", { n: s.matches.length, current: s.index + 1 || (s.matches.length ? 1 : 0) });
  }

  function refresh(announce = false) {
    const text = describe();
    status.textContent = text;
    const s = getSearchState(editor.state);
    const none = !s.matches.length;
    for (const b of [prev, next, replaceBtn, replaceAllBtn]) setDisabled(b, none);
    if (announce && text) {
      clearTimeout(announceTimer);
      announceTimer = setTimeout(() => editor.announce(text), 350);
    }
  }

  function search() {
    editor.commands.setSearch({ query: findInput.value, caseSensitive: caseBox.checked, wholeWord: wordBox.checked });
    if (findInput.value) editor.commands.findNext();
    refresh(true);
  }

  findInput.addEventListener("input", search);
  caseBox.addEventListener("change", search);
  wordBox.addEventListener("change", search);
  prev.addEventListener("click", () => {
    editor.commands.findPrevious();
    refresh(true);
  });
  next.addEventListener("click", () => {
    editor.commands.findNext();
    refresh(true);
  });
  replaceBtn.addEventListener("click", () => {
    if (editor.commands.replaceCurrent(replaceInput.value)) refresh(true);
  });
  replaceAllBtn.addEventListener("click", () => {
    const n = getSearchState(editor.state).matches.length;
    if (editor.commands.replaceAll(replaceInput.value)) {
      editor.announce(t("replacedCount", { n }));
      refresh();
    }
  });
  closeBtn.addEventListener("click", () => close());

  element.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === "Enter" && e.target === findInput) {
      e.preventDefault();
      if (e.shiftKey) editor.commands.findPrevious();
      else editor.commands.findNext();
      refresh(true);
    } else if (e.key === "Enter" && e.target === replaceInput) {
      e.preventDefault();
      if (editor.commands.replaceCurrent(replaceInput.value)) refresh(true);
    } else if (matches(e, "Mod-f")) {
      e.preventDefault();
      findInput.select();
    }
  });

  editor.on("transaction", () => {
    if (!element.hidden) refresh();
  });

  function open() {
    const { empty, from, to } = editor.state.selection;
    const selected = empty ? "" : editor.state.doc.textBetween(from, to, " ");
    element.hidden = false;
    if (selected && selected.length < 200 && !selected.includes("\n")) findInput.value = selected;
    findInput.focus();
    findInput.select();
    if (findInput.value) search();
  }

  function close() {
    if (element.hidden) return;
    element.hidden = true;
    clearTimeout(announceTimer);
    // Keep the selection on the current match, drop the highlights.
    editor.commands.clearSearch();
    editor.focus();
  }

  return { element, open, close, isOpen: () => !element.hidden };
}
