// jsdom has no layout engine. ProseMirror calls a few geometry APIs (scrollIntoView, coordsAtPos);
// give them inert implementations so editing logic can be tested. Real layout is covered by the
// Playwright suite in Chromium, Firefox and WebKit.
const rect = (): DOMRect =>
  ({ x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, toJSON: () => ({}) }) as DOMRect;
const rects = (): DOMRectList => {
  const list = [] as unknown as DOMRectList & DOMRect[];
  (list as unknown as { item: (i: number) => DOMRect | null }).item = () => null;
  return list;
};

Range.prototype.getBoundingClientRect ??= rect;
Range.prototype.getClientRects ??= rects;
Element.prototype.scrollIntoView ??= () => {};
document.elementFromPoint ??= () => null;
window.scrollBy ??= () => {};

// jsdom lacks <dialog> modality; emulate the bits our dialogs use.
const D = HTMLDialogElement.prototype as HTMLDialogElement & { showModal?: () => void };
D.showModal ??= function (this: HTMLDialogElement) {
  this.setAttribute("open", "");
};
D.close ??= function (this: HTMLDialogElement) {
  this.removeAttribute("open");
};

// jsdom has no ClipboardEvent; ProseMirror's view.pasteHTML() constructs one.
if (typeof globalThis.ClipboardEvent === "undefined") {
  class ClipboardEventPolyfill extends Event {
    clipboardData: DataTransfer | null;
    constructor(type: string, init: EventInit & { clipboardData?: DataTransfer | null } = {}) {
      super(type, init);
      this.clipboardData = init.clipboardData ?? null;
    }
  }
  (globalThis as { ClipboardEvent?: unknown }).ClipboardEvent = ClipboardEventPolyfill;
}
