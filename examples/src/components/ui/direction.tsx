"use client";

import * as React from "react";
import { Direction } from "radix-ui";

// Radix primitives (Tabs, Accordion, ScrollArea, Tooltip, menus) default to `dir="ltr"` and even write
// dir="ltr" onto their DOM nodes, which breaks RTL layouts and arrow-key navigation. Wrap the app once.
function DirectionProvider({ dir, children }: { dir: "ltr" | "rtl"; children: React.ReactNode }) {
  return <Direction.Provider dir={dir}>{children}</Direction.Provider>;
}

export { DirectionProvider };
