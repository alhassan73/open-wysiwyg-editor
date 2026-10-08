"use client";

import { useSyncExternalStore } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Dir, PickerItem } from "@/types";

const DESKTOP = "(min-width: 1024px)";

function useIsDesktop() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(DESKTOP);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(DESKTOP).matches,
    () => false,
  );
}

/**
 * Framework tabs: a column on desktop (arrow up/down), a scrolling row on mobile (arrow left/right).
 * Every panel is in the HTML (inactive ones are hidden with CSS) so the docs are indexable.
 */
export function FrameworkPicker({
  items,
  label,
  dir,
  defaultValue,
}: {
  items: PickerItem[];
  label: string;
  dir: Dir;
  defaultValue: string;
}) {
  const desktop = useIsDesktop();
  return (
    <Tabs
      defaultValue={defaultValue}
      dir={dir}
      orientation={desktop ? "vertical" : "horizontal"}
      className="gap-6 lg:flex-row lg:items-start lg:gap-6"
    >
      <TabsList
        aria-label={label}
        className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl border bg-card p-2 lg:sticky lg:top-24 lg:w-64 lg:shrink-0 lg:flex-col lg:items-stretch lg:overflow-visible"
      >
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            className="h-auto min-h-14 flex-none justify-start gap-3 rounded-xl px-2.5 py-2 text-start text-small transition-colors duration-160 hover:bg-accent data-[state=active]:border-primary/50 data-[state=active]:bg-primary/10 data-[state=active]:shadow-none lg:w-full"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-lg border bg-background [&>svg]:size-6">
              {item.logo}
            </span>
            <span>{item.name}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      <div className="min-w-0 flex-1">
        {items.map((item) => (
          <TabsContent
            key={item.value}
            value={item.value}
            forceMount
            className="rounded-3xl border bg-card p-5 data-[state=active]:animate-in data-[state=active]:duration-[360ms] data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2 data-[state=inactive]:hidden sm:p-8"
          >
            {item.panel}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}
