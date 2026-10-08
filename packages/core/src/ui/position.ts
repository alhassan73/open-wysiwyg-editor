export interface PlaceOptions {
  placement?: "bottom" | "top";
  align?: "start" | "center" | "end";
  offset?: number;
  dir?: "ltr" | "rtl";
}

const MARGIN = 8;

/**
 * Positions a floating element (fixed) next to an anchor, flipping above/below to stay on screen
 * and clamping to the viewport. Uses the CSSOM only — safe under strict CSP.
 */
export function place(floating: HTMLElement, anchor: Element | DOMRect, opts: PlaceOptions = {}): void {
  const { placement = "bottom", align = "start", offset = 6, dir = "ltr" } = opts;
  const a = anchor instanceof Element ? anchor.getBoundingClientRect() : anchor;
  floating.style.setProperty("position", "fixed");
  floating.style.setProperty("inset", "auto");
  const f = floating.getBoundingClientRect();
  const vw = document.documentElement.clientWidth || window.innerWidth;
  const vh = window.innerHeight;

  const below = a.bottom + offset;
  const above = a.top - offset - f.height;
  let top = placement === "bottom" ? below : above;
  if (placement === "bottom" && below + f.height > vh - MARGIN && above >= MARGIN) top = above;
  if (placement === "top" && above < MARGIN && below + f.height <= vh - MARGIN) top = below;

  const startLeft = dir === "rtl" ? a.right - f.width : a.left;
  const endLeft = dir === "rtl" ? a.left : a.right - f.width;
  let left = align === "center" ? a.left + a.width / 2 - f.width / 2 : align === "end" ? endLeft : startLeft;

  left = Math.max(MARGIN, Math.min(left, vw - f.width - MARGIN));
  top = Math.max(MARGIN, Math.min(top, vh - f.height - MARGIN));
  floating.style.setProperty("left", `${Math.round(left)}px`);
  floating.style.setProperty("top", `${Math.round(top)}px`);
}
