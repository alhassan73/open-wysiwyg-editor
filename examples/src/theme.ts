import { useSyncExternalStore } from "react";

export type ThemeChoice = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

const KEY = "owe-site-theme";
const listeners = new Set<() => void>();
const media = typeof matchMedia === "function" ? matchMedia("(prefers-color-scheme: light)") : null;

export function getChoice(): ThemeChoice {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === "dark" || stored === "light" || stored === "system") return stored;
  } catch {
    /* storage blocked: fall back to the default */
  }
  return "dark"; // dark-first
}

export function resolve(choice: ThemeChoice = getChoice()): ResolvedTheme {
  return choice === "system" ? (media?.matches ? "light" : "dark") : choice;
}

function apply() {
  document.documentElement.dataset.theme = resolve();
  for (const fn of listeners) fn();
}

export function setChoice(choice: ThemeChoice) {
  try {
    localStorage.setItem(KEY, choice);
  } catch {
    /* ignore */
  }
  apply();
}

media?.addEventListener("change", () => {
  if (getChoice() === "system") apply();
});

/** Applies the stored theme before React renders. */
export function initTheme() {
  document.documentElement.dataset.theme = resolve();
}

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const useThemeChoice = () => useSyncExternalStore(subscribe, getChoice, () => "dark" as ThemeChoice);
export const useResolvedTheme = () => useSyncExternalStore(subscribe, () => resolve(), () => "dark" as ResolvedTheme);
