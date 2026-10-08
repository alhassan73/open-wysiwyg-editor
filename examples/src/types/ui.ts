import type { ReactNode } from "react";
import type { Lang } from "./highlight";

export type CodeTabItem = { label: string; code: string; lang: Lang };

export interface PickerItem {
  value: string;
  name: string;
  /** Logo, rendered on the server. */
  logo: ReactNode;
  /** The framework's docs, rendered on the server. */
  panel: ReactNode;
}

/** The playground's sample document and editor name in one language. */
export type PlaygroundText = { sample: string; editorLabel: string };
