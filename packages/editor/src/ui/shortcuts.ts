import { isMac } from "../core/env";

const KEY_NAMES: Record<string, string> = {
  arrowup: "ArrowUp",
  arrowdown: "ArrowDown",
  arrowleft: "ArrowLeft",
  arrowright: "ArrowRight",
  enter: "Enter",
  escape: "Escape",
  tab: "Tab",
  backspace: "Backspace",
  space: "Space",
};

function parts(shortcut: string): { mods: string[]; key: string } {
  // "Mod-Shift-b" | "Mod--" ; the key is whatever follows the last separator.
  const segs = shortcut.split(/-(?!$)/);
  const key = segs.pop()!;
  return { mods: segs.map((m) => m.toLowerCase()), key };
}

/** Human label: "Ctrl+Shift+B" on Windows/Linux, "⇧⌘B" on Apple platforms. */
export function formatShortcut(shortcut: string, mac = isMac()): string {
  const { mods, key } = parts(shortcut);
  const k = KEY_NAMES[key.toLowerCase()] ?? (key.length === 1 ? key.toUpperCase() : key);
  if (mac) {
    const symbols: Record<string, string> = { ctrl: "⌃", control: "⌃", alt: "⌥", shift: "⇧", mod: "⌘", cmd: "⌘", meta: "⌘" };
    const order = ["ctrl", "control", "alt", "shift", "mod", "cmd", "meta"];
    return order.filter((m) => mods.includes(m)).map((m) => symbols[m]).join("") + k;
  }
  const names: Record<string, string> = { mod: "Ctrl", ctrl: "Ctrl", control: "Ctrl", alt: "Alt", shift: "Shift", meta: "Win" };
  const order = ["mod", "ctrl", "control", "alt", "shift", "meta"];
  return [...order.filter((m) => mods.includes(m)).map((m) => names[m]), k].join("+");
}

/** Value for aria-keyshortcuts, e.g. "Control+Shift+B" / "Meta+Shift+B". */
export function ariaShortcut(shortcut: string, mac = isMac()): string {
  const { mods, key } = parts(shortcut);
  const map: Record<string, string> = {
    mod: mac ? "Meta" : "Control",
    ctrl: "Control",
    control: "Control",
    alt: "Alt",
    shift: "Shift",
    meta: "Meta",
    cmd: "Meta",
  };
  const k = KEY_NAMES[key.toLowerCase()] ?? (key.length === 1 ? key.toUpperCase() : key);
  return [...mods.map((m) => map[m] ?? m), k].join("+");
}

/** True when a keyboard event matches a "Mod-Shift-x" style shortcut. */
export function matches(event: KeyboardEvent, shortcut: string, mac = isMac()): boolean {
  const { mods, key } = parts(shortcut);
  const want = {
    ctrl: mods.includes("ctrl") || mods.includes("control") || (!mac && mods.includes("mod")),
    meta: mods.includes("meta") || mods.includes("cmd") || (mac && mods.includes("mod")),
    alt: mods.includes("alt"),
    shift: mods.includes("shift"),
  };
  if (event.ctrlKey !== want.ctrl || event.metaKey !== want.meta || event.altKey !== want.alt) return false;
  if (event.shiftKey !== want.shift) return false;
  const k = key.toLowerCase();
  // Match on the layout-independent code too, so shortcuts work with Arabic keyboard layouts.
  if (event.key.toLowerCase() === k) return true;
  if (/^[a-z]$/.test(k)) return event.code === `Key${k.toUpperCase()}`;
  if (/^[0-9]$/.test(k)) return event.code === `Digit${k}`;
  if (/^f\d+$/.test(k)) return event.key.toLowerCase() === k;
  return false;
}
