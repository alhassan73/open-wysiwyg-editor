// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyListener = (...args: any[]) => void;

export interface Emitter<E extends { [K in keyof E]: unknown[] }> {
  on<K extends keyof E>(event: K, listener: (...args: E[K]) => void): () => void;
  off<K extends keyof E>(event: K, listener: (...args: E[K]) => void): void;
  emit<K extends keyof E>(event: K, ...args: E[K]): void;
  clear(): void;
}

export function createEmitter<E extends { [K in keyof E]: unknown[] }>(): Emitter<E> {
  const listeners = new Map<keyof E, Set<AnyListener>>();
  const off = (event: keyof E, listener: AnyListener) => {
    listeners.get(event)?.delete(listener);
  };
  return {
    on(event, listener) {
      let set = listeners.get(event);
      if (!set) listeners.set(event, (set = new Set()));
      set.add(listener);
      return () => off(event, listener);
    },
    off,
    emit(event, ...args) {
      for (const listener of [...(listeners.get(event) ?? [])]) {
        try {
          listener(...args);
        } catch (error) {
          // One faulty listener must not break the editor or other listeners.
          console.error("[open-wysiwyg-editor] listener error", error);
        }
      }
    },
    clear() {
      listeners.clear();
    },
  };
}
