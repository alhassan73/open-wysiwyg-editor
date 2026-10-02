type Child = Node | string | number | null | undefined | false;
type Props = Record<string, unknown> & {
  className?: string;
  style?: Partial<Record<string, string>>;
};

/**
 * Tiny element factory. Never uses HTML strings: text is always inserted as text nodes and
 * styles go through the CSSOM, so it is safe under strict CSP and Trusted Types.
 */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: Props | null,
  ...children: Array<Child | Child[]>
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (props) {
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === "className") el.className = String(value);
      else if (key === "style") {
        for (const [prop, v] of Object.entries(value as Record<string, string>)) {
          if (v != null) el.style.setProperty(prop, v);
        }
      } else if (key.startsWith("on") && typeof value === "function") {
        el.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
      } else if (value === true) el.setAttribute(key, "");
      else el.setAttribute(key, String(value));
    }
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    el.append(typeof child === "object" ? child : String(child));
  }
  return el;
}

let counter = 0;
export const uid = (prefix = "owe"): string =>
  `${prefix}-${(++counter).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** SVG element factory for icons (paths are static strings shipped with the library). */
export function svg(paths: string[], className = "owe-icon"): SVGSVGElement {
  const ns = "http://www.w3.org/2000/svg";
  const el = document.createElementNS(ns, "svg");
  el.setAttribute("viewBox", "0 0 24 24");
  el.setAttribute("aria-hidden", "true");
  el.setAttribute("focusable", "false");
  el.setAttribute("class", className);
  for (const d of paths) {
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", d);
    el.append(path);
  }
  return el;
}
