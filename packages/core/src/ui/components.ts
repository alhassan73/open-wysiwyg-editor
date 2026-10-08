import { h, svg, uid } from "../core/dom";
import { FLIP_IN_RTL, icons, type IconName } from "./icons";
import { place } from "./position";
import { ariaShortcut, formatShortcut } from "./shortcuts";
import type { Tooltip } from "./tooltip";

export function icon(name: IconName): SVGSVGElement {
  return svg(icons[name], FLIP_IN_RTL.has(name) ? "owe-icon owe-flip" : "owe-icon");
}

export interface ButtonSpec {
  label: string;
  icon?: IconName;
  /** Visible text (in addition to, or instead of, the icon). */
  text?: string;
  shortcut?: string;
  toggle?: boolean;
  haspopup?: "menu" | "dialog";
  tooltip?: Tooltip;
  className?: string;
}

/** Toolbar/menu trigger button. Accessible name always contains any visible text (WCAG 2.5.3). */
export function iconButton(spec: ButtonSpec): HTMLButtonElement {
  const button = h(
    "button",
    {
      type: "button",
      className: `owe-btn${spec.className ? ` ${spec.className}` : ""}`,
      "aria-label": spec.text ? `${spec.label}: ${spec.text}` : spec.label,
      "aria-keyshortcuts": spec.shortcut ? ariaShortcut(spec.shortcut) : null,
      "aria-pressed": spec.toggle ? "false" : null,
      "aria-haspopup": spec.haspopup ?? null,
      "aria-expanded": spec.haspopup === "menu" ? "false" : null,
    },
    spec.icon ? icon(spec.icon) : null,
    spec.text ? h("span", { className: "owe-btn-text" }, spec.text) : null,
    spec.haspopup === "menu" ? icon("chevronDown") : null,
  );
  spec.tooltip?.attach(button, () =>
    spec.shortcut ? `${spec.label} (${formatShortcut(spec.shortcut)})` : spec.label,
  );
  // Keep the editor's selection when clicking toolbar controls.
  button.addEventListener("mousedown", (e) => e.preventDefault());
  return button;
}

export function setDisabled(el: HTMLElement, disabled: boolean): void {
  // aria-disabled (not `disabled`) keeps the control focusable and discoverable in the toolbar.
  if (disabled) el.setAttribute("aria-disabled", "true");
  else el.removeAttribute("aria-disabled");
}

export const isDisabled = (el: Element): boolean => el.getAttribute("aria-disabled") === "true";

// ---- Toolbar (APG toolbar pattern: one Tab stop, roving tabindex, arrows mirrored in RTL) ------

export function createToolbar(label: string, getDir: () => "ltr" | "rtl") {
  const element = h("div", { className: "owe-toolbar", role: "toolbar", "aria-label": label });
  let current: HTMLElement | null = null;

  const items = (): HTMLElement[] =>
    [...element.querySelectorAll<HTMLElement>(".owe-toolbar-item")].filter((el) => !el.hidden);

  const setCurrent = (el: HTMLElement | null) => {
    current = el;
    for (const item of element.querySelectorAll<HTMLElement>(".owe-toolbar-item")) {
      item.tabIndex = item === el ? 0 : -1;
    }
  };

  element.addEventListener("focusin", (e) => {
    const item = (e.target as HTMLElement).closest<HTMLElement>(".owe-toolbar-item");
    if (item && element.contains(item)) setCurrent(item);
  });

  element.addEventListener("keydown", (e) => {
    const list = items();
    const index = list.indexOf(document.activeElement as HTMLElement);
    if (index === -1) return;
    const rtl = getDir() === "rtl";
    let next: number;
    if (e.key === "ArrowRight") next = rtl ? index - 1 : index + 1;
    else if (e.key === "ArrowLeft") next = rtl ? index + 1 : index - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = list.length - 1;
    else return;
    e.preventDefault();
    next = (next + list.length) % list.length; // wrap
    list[next]!.focus();
  });

  return {
    element,
    add(el: HTMLElement) {
      el.classList.add("owe-toolbar-item");
      el.tabIndex = current ? -1 : 0;
      if (!current) current = el;
      element.append(el);
      return el;
    },
    separator() {
      element.append(h("div", { className: "owe-separator", role: "separator", "aria-orientation": "vertical" }));
    },
    /** Moves focus into the toolbar, to the last focused item (APG). */
    focus() {
      const list = items();
      const target = current && list.includes(current) ? current : list[0];
      target?.focus();
    },
    contains: (node: Node | null) => !!node && element.contains(node),
  };
}

// ---- Menu button (APG menu button + menu) ---------------------------------------------------

export interface MenuItemSpec {
  label: string;
  icon?: IconName;
  shortcut?: string;
  kind?: "item" | "radio" | "checkbox";
  checked?: boolean;
  disabled?: boolean;
  separatorBefore?: boolean;
  /** Color swatch shown before the label (`null` = "no color" swatch). */
  swatch?: string | null;
  run: () => void;
}

/** Decorative color sample, painted through the CSSOM (strict-CSP safe). */
export function swatch(color: string | null): HTMLSpanElement {
  const el = h("span", { className: color ? "owe-swatch" : "owe-swatch owe-swatch-none", "aria-hidden": "true" });
  if (color) el.style.setProperty("background-color", color);
  return el;
}

export interface MenuButtonOptions {
  button: HTMLButtonElement;
  label: string;
  items: () => MenuItemSpec[];
  container: HTMLElement;
  getDir: () => "ltr" | "rtl";
  /** Where focus goes after an item runs. Default: back to the button. */
  afterRun?: () => void;
}

export function createMenuButton(opts: MenuButtonOptions) {
  const { button, container } = opts;
  const menuId = uid("owe-menu");
  if (!button.id) button.id = uid("owe-btn");
  const menu = h("div", {
    className: "owe-menu",
    role: "menu",
    id: menuId,
    "aria-labelledby": button.id,
    hidden: true,
    tabindex: "-1",
  });
  button.setAttribute("aria-controls", menuId);
  container.append(menu);

  let specs: MenuItemSpec[] = [];
  let typeahead = "";
  let typeaheadTimer: ReturnType<typeof setTimeout> | undefined;

  const itemEls = () => [...menu.querySelectorAll<HTMLElement>("[role^=menuitem]")];
  const isOpen = () => !menu.hidden;

  function render() {
    specs = opts.items();
    menu.replaceChildren();
    for (const spec of specs) {
      if (spec.separatorBefore && menu.childElementCount) {
        menu.append(h("div", { role: "separator", className: "owe-menu-separator" }));
      }
      const role = spec.kind === "radio" ? "menuitemradio" : spec.kind === "checkbox" ? "menuitemcheckbox" : "menuitem";
      const el = h(
        "div",
        {
          role,
          tabindex: "-1",
          className: "owe-menu-item",
          "aria-checked": spec.kind && spec.kind !== "item" ? String(!!spec.checked) : null,
          "aria-disabled": spec.disabled ? "true" : null,
          "aria-keyshortcuts": spec.shortcut ? ariaShortcut(spec.shortcut) : null,
        },
        h("span", { className: "owe-menu-check", "aria-hidden": "true" }, spec.kind && spec.kind !== "item" && spec.checked ? icon("check") : null),
        spec.icon ? icon(spec.icon) : null,
        spec.swatch !== undefined ? swatch(spec.swatch) : null,
        h("span", { className: "owe-menu-label" }, spec.label),
        spec.shortcut ? h("span", { className: "owe-menu-shortcut", "aria-hidden": "true" }, formatShortcut(spec.shortcut)) : null,
      );
      el.addEventListener("mousedown", (e) => e.preventDefault());
      el.addEventListener("click", () => activate(el));
      el.addEventListener("pointermove", () => {
        if (document.activeElement !== el) el.focus();
      });
      menu.append(el);
    }
  }

  function open(focus: "first" | "last" = "first") {
    if (isOpen()) return;
    render();
    menu.hidden = false;
    button.setAttribute("aria-expanded", "true");
    place(menu, button, { placement: "bottom", align: "start", dir: opts.getDir() });
    const els = itemEls();
    const checked = els.find((el) => el.getAttribute("aria-checked") === "true");
    (focus === "last" ? els[els.length - 1] : (checked ?? els[0]))?.focus();
    document.addEventListener("pointerdown", onOutside, true);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
  }

  function close(returnFocus = true) {
    if (!isOpen()) return;
    menu.hidden = true;
    button.setAttribute("aria-expanded", "false");
    document.removeEventListener("pointerdown", onOutside, true);
    window.removeEventListener("resize", reposition);
    window.removeEventListener("scroll", reposition, true);
    if (returnFocus) button.focus();
  }

  const reposition = () => place(menu, button, { placement: "bottom", align: "start", dir: opts.getDir() });

  function onOutside(e: Event) {
    const target = e.target as Node;
    if (!menu.contains(target) && !button.contains(target)) close(false);
  }

  function activate(el: HTMLElement) {
    if (isDisabled(el)) return;
    const spec = specs[itemEls().indexOf(el)];
    if (!spec) return;
    close(!opts.afterRun);
    spec.run();
    opts.afterRun?.();
  }

  button.addEventListener("click", () => (isOpen() ? close() : open("first")));
  button.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open("first");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      open("last");
    }
  });

  menu.addEventListener("keydown", (e) => {
    const els = itemEls();
    const index = els.indexOf(document.activeElement as HTMLElement);
    const go = (i: number) => els[(i + els.length) % els.length]?.focus();
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        go(index + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        go(index - 1);
        break;
      case "Home":
        e.preventDefault();
        go(0);
        break;
      case "End":
        e.preventDefault();
        go(els.length - 1);
        break;
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        close();
        break;
      case "Tab":
        e.preventDefault();
        close();
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (index >= 0) activate(els[index]!);
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          // Type-ahead: jump to the next item whose label starts with the typed characters.
          clearTimeout(typeaheadTimer);
          typeahead += e.key.toLowerCase();
          typeaheadTimer = setTimeout(() => (typeahead = ""), 500);
          const order = [...els.slice(index + 1), ...els.slice(0, index + 1)];
          order.find((el) => el.textContent?.trim().toLowerCase().startsWith(typeahead))?.focus();
        }
    }
  });

  return {
    open,
    close,
    isOpen,
    destroy() {
      close(false);
      clearTimeout(typeaheadTimer);
      menu.remove();
    },
  };
}

// ---- Dialogs & form fields ------------------------------------------------------------------

export interface FieldOptions {
  label: string;
  input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  help?: string;
  required?: boolean;
  requiredLabel?: string;
}

export function field(opts: FieldOptions) {
  const { input } = opts;
  if (!input.id) input.id = uid("owe-field");
  const helpId = opts.help ? uid("owe-help") : null;
  const errorId = uid("owe-error");
  const error = h("div", { id: errorId, className: "owe-field-error", hidden: true });
  const isCheck = input instanceof HTMLInputElement && (input.type === "checkbox" || input.type === "radio");
  input.setAttribute("aria-describedby", [helpId, errorId].filter(Boolean).join(" "));
  if (opts.required) input.setAttribute("aria-required", "true");
  const label = h(
    "label",
    { for: input.id, className: "owe-label" },
    opts.label,
    opts.required ? h("span", { className: "owe-required" }, ` (${opts.requiredLabel ?? "required"})`) : null,
  );
  const element = h(
    "div",
    { className: isCheck ? "owe-field owe-field-check" : "owe-field" },
    ...(isCheck ? [input, label] : [label, input]),
    helpId ? h("div", { id: helpId, className: "owe-field-help" }, opts.help) : null,
    error,
  );
  return {
    element,
    input,
    setError(message: string | null) {
      error.hidden = !message;
      error.textContent = message ?? "";
      if (message) {
        input.setAttribute("aria-invalid", "true");
        input.focus();
      } else input.removeAttribute("aria-invalid");
    },
  };
}

export interface DialogOptions {
  title: string;
  container: HTMLElement;
  body: HTMLElement[];
  submitLabel?: string;
  cancelLabel: string;
  closeLabel: string;
  /** Extra buttons placed before Cancel (e.g. "Remove link"). */
  extraActions?: Array<{ label: string; run: () => void; danger?: boolean }>;
  /** Return (or resolve) false to keep the dialog open (validation failed). */
  onSubmit?: () => boolean | Promise<boolean>;
  /** Element that receives focus on open. Default: first field. */
  initialFocus?: HTMLElement;
  /** Called after the dialog closes (focus restoration lives here). */
  onClose: () => void;
  wide?: boolean;
  /** Body is long read-only content: make it a focusable, labelled scroll region. */
  scrollable?: boolean;
}

/**
 * Modal dialog built on native <dialog>.showModal(): the browser provides the focus trap, inert
 * background, top-layer stacking and Escape handling (APG dialog pattern).
 */
export function openDialog(opts: DialogOptions) {
  const titleId = uid("owe-dlg-title");
  const form = h("form", { className: "owe-dialog-form", method: "dialog", novalidate: true });
  const closeBtn = h(
    "button",
    { type: "button", className: "owe-btn owe-dialog-close", "aria-label": opts.closeLabel },
    icon("close"),
  );
  const actions = h("div", { className: "owe-dialog-actions" });
  for (const action of opts.extraActions ?? []) {
    const b = h("button", { type: "button", className: `owe-button${action.danger ? " owe-button-danger" : ""}` }, action.label);
    b.addEventListener("click", () => {
      action.run();
      close();
    });
    actions.append(b);
  }
  const cancel = h("button", { type: "button", className: "owe-button" }, opts.cancelLabel);
  actions.append(cancel);
  if (opts.submitLabel) actions.append(h("button", { type: "submit", className: "owe-button owe-button-primary" }, opts.submitLabel));

  form.append(
    h("div", { className: "owe-dialog-header" }, h("h2", { id: titleId, className: "owe-dialog-title" }, opts.title), closeBtn),
    h(
      "div",
      // Long, read-only content (e.g. the shortcuts list) scrolls: keyboard users must be able to
      // focus the region to scroll it (WCAG 2.1.1), and it gets the dialog title as its name.
      opts.scrollable
        ? { className: "owe-dialog-body", tabindex: "0", role: "region", "aria-labelledby": titleId }
        : { className: "owe-dialog-body" },
      ...opts.body,
    ),
    actions,
  );
  const dialog = h("dialog", { className: `owe-dialog${opts.wide ? " owe-dialog-wide" : ""}`, "aria-labelledby": titleId }, form);
  opts.container.append(dialog);

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    if (dialog.open) dialog.close();
    dialog.remove();
    opts.onClose();
  }

  closeBtn.addEventListener("click", close);
  cancel.addEventListener("click", close);
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault(); // we close ourselves so cleanup + focus restoration always run
    close();
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (form.getAttribute("aria-busy") === "true") return;
    const result = opts.onSubmit ? opts.onSubmit() : true;
    if (result instanceof Promise) {
      form.setAttribute("aria-busy", "true");
      result
        .then((ok) => ok && close())
        .finally(() => form.removeAttribute("aria-busy"));
    } else if (result) close();
  });

  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
  const first =
    opts.initialFocus ??
    form.querySelector<HTMLElement>(".owe-dialog-body input:not([disabled]), .owe-dialog-body textarea, .owe-dialog-body select, .owe-dialog-body button");
  first?.focus();
  if (first instanceof HTMLInputElement && first.type === "text") first.select();

  return { dialog, close };
}
