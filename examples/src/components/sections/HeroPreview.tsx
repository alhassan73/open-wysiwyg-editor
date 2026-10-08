import { Bold, Code, Italic, Link, List, Quote, Underline } from "lucide-react";

// Brand swatches shown in the footer of the mock: a hint that the whole UI follows one color.
const DOTS = ["bg-primary", "bg-brand-cyan", "bg-brand-teal", "bg-foreground/30"];

const toolButton = "grid size-9 place-items-center rounded-lg [&>svg]:size-[1.125rem]";
const idle = toolButton + " text-muted-foreground";

/**
 * A static picture of the editor for the hero: toolbar with a pressed button, a heading, text, a selection
 * and a caret, drawn with plain elements (no text, nothing focusable). The real editor is the playground below.
 */
export function HeroPreview() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-lg lg:max-w-none">
      <div className="absolute -inset-3 -z-10 rounded-[2rem] bg-brand-gradient opacity-25 blur-2xl" />
      <div className="overflow-hidden rounded-3xl border bg-card shadow-elevated">
        <div className="flex items-center gap-1 border-b bg-background/50 p-2">
          <span className={toolButton + " bg-primary text-primary-foreground"}>
            <Bold />
          </span>
          <span className={idle}>
            <Italic />
          </span>
          <span className={idle}>
            <Underline />
          </span>
          <span className="mx-1 h-5 w-px bg-border" />
          <span className={idle}>
            <Link />
          </span>
          <span className={idle}>
            <List />
          </span>
          <span className={idle}>
            <Quote />
          </span>
          <span className={idle}>
            <Code />
          </span>
        </div>

        <div className="space-y-4 p-6 sm:p-8">
          <div className="h-7 w-2/3 rounded-md bg-foreground" />
          <div className="space-y-2.5">
            <div className="h-3 w-full rounded-full bg-muted-foreground/35" />
            <div className="flex items-center gap-2">
              <div className="h-3 w-1/3 rounded-full bg-muted-foreground/35" />
              <div className="h-5 w-2/5 rounded-md bg-primary/30" />
              <div className="h-3 flex-1 rounded-full bg-muted-foreground/35" />
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3/5 rounded-full bg-muted-foreground/35" />
              <div className="h-5 w-0.5 rounded-full bg-link motion-safe:animate-pulse" />
            </div>
          </div>
          <div className="flex gap-3 border-s-4 border-brand-teal ps-4">
            <div className="h-3 w-1/2 rounded-full bg-muted-foreground/25" />
          </div>
        </div>

        <div className="flex items-center justify-between border-t bg-background/50 px-4 py-3">
          <div className="h-2.5 w-20 rounded-full bg-muted-foreground/25" />
          <div className="flex items-center gap-1.5">
            {DOTS.map((dot) => (
              <span key={dot} className={`size-3.5 rounded-full ${dot}`} />
            ))}
          </div>
        </div>
        <div className="h-1 bg-brand-gradient" />
      </div>
    </div>
  );
}
