export const LIB = "open-wysiwyg-editor";

export const isBrowser = (): boolean =>
  typeof window !== "undefined" && typeof document !== "undefined";

export function assertBrowser(what: string): void {
  if (!isBrowser()) {
    throw new Error(
      `[${LIB}] ${what} needs a browser DOM. Call it on the client (e.g. in useEffect / onMounted / ` +
        `afterNextRender), or use "${LIB}/server" helpers for server-side rendering.`,
    );
  }
}

export const isMac = (): boolean =>
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad|iPod/.test(
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ??
      navigator.platform ??
      "",
  );

export function warn(message: string): void {
  if (typeof console !== "undefined") console.warn(`[${LIB}] ${message}`);
}
