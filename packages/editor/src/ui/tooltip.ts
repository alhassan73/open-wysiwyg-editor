import { h } from "../core/dom";
import { place } from "./position";

/**
 * One shared tooltip per editor (WCAG 1.4.13): appears on hover and keyboard focus, can be
 * dismissed with Escape without moving focus, stays while the pointer is over it, and never
 * carries information that isn't also in the control's accessible name / aria-keyshortcuts
 * (hence aria-hidden — screen readers would otherwise hear it twice).
 */
export function createTooltip(container: HTMLElement, getDir: () => "ltr" | "rtl") {
  const el = h("div", { className: "owe-tooltip", "aria-hidden": "true", hidden: true });
  container.append(el);
  let anchor: HTMLElement | null = null;
  let showTimer: ReturnType<typeof setTimeout> | undefined;
  let hideTimer: ReturnType<typeof setTimeout> | undefined;

  const show = (target: HTMLElement, text: string, delay: number) => {
    clearTimeout(hideTimer);
    clearTimeout(showTimer);
    showTimer = setTimeout(() => {
      anchor = target;
      el.textContent = text;
      el.hidden = false;
      place(el, target, { placement: "top", align: "center", dir: getDir() });
    }, delay);
  };
  const hide = (delay = 0) => {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      el.hidden = true;
      anchor = null;
    }, delay);
  };

  el.addEventListener("pointerenter", () => clearTimeout(hideTimer));
  el.addEventListener("pointerleave", () => hide(100));

  return {
    attach(target: HTMLElement, text: () => string) {
      target.addEventListener("pointerenter", () => show(target, text(), 500));
      target.addEventListener("pointerleave", () => hide(150));
      target.addEventListener("focus", () => {
        if (target.matches(":focus-visible")) show(target, text(), 300);
      });
      target.addEventListener("blur", () => hide());
      target.addEventListener("pointerdown", () => hide());
    },
    /** Returns true if a visible tooltip was dismissed (so Escape shouldn't do anything else). */
    dismiss(): boolean {
      const visible = !el.hidden;
      hide();
      if (visible) el.hidden = true;
      return visible;
    },
    get anchor() {
      return anchor;
    },
    destroy() {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      el.remove();
    },
  };
}

export type Tooltip = ReturnType<typeof createTooltip>;
