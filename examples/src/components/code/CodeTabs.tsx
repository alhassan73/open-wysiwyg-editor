import { CodeBlock } from "@/components/code/CodeBlock";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { CodeTabItem } from "@/types";

/** One code block per tab. Server component: the highlighting happens at build time. */
export function CodeTabs({
  items,
  label,
  className,
}: {
  items: CodeTabItem[];
  /** Accessible name of the tab list. */
  label?: string;
  className?: string;
}) {
  if (items.length === 1) {
    const only = items[0]!;
    return <CodeBlock code={only.code} lang={only.lang} title={only.label} className={className} />;
  }
  return (
    <Tabs
      defaultValue="0"
      dir="ltr"
      className={cn(
        "min-w-0 gap-0 overflow-hidden rounded-[16px] border border-code-border bg-code",
        className,
      )}
    >
      <TabsList
        aria-label={label}
        className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-code-border bg-code-bar p-1.5"
      >
        {items.map((item, i) => (
          <TabsTrigger key={i} value={String(i)} className="h-9 flex-none px-3.5 text-caption">
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map((item, i) => (
        <TabsContent key={i} value={String(i)} className="flex min-h-0 flex-1 flex-col">
          <CodeBlock code={item.code} lang={item.lang} flush className="flex-1" />
        </TabsContent>
      ))}
    </Tabs>
  );
}
