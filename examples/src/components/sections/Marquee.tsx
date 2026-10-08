"use client";

import { Pause, Play } from "lucide-react";
import { useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A looping row. Pass the items twice as `children` (the second set `aria-hidden`): the track moves by half
 * its width. It pauses on hover and with the button (WCAG 2.2.2), and is a static wrapped row with reduced motion.
 */
export function Marquee({
  label,
  pauseLabel,
  playLabel,
  children,
}: {
  label: string;
  pauseLabel: string;
  playLabel: string;
  children: ReactNode;
}) {
  const [paused, setPaused] = useState(false);
  return (
    <div>
      <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_10%,#000_90%,transparent)] motion-reduce:[mask-image:none]">
        <ul
          role="list"
          aria-label={label}
          style={{ "--marquee-duration": "55s" } as CSSProperties}
          className={cn(
            "flex w-max animate-marquee items-center gap-12 py-2 motion-reduce:w-auto motion-reduce:flex-wrap motion-reduce:justify-center",
            paused && "[animation-play-state:paused]!",
          )}
        >
          {children}
        </ul>
      </div>
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        className="mx-auto mt-4 flex min-h-11 items-center gap-1.5 rounded-full border bg-card px-4 py-1 text-caption font-bold text-muted-foreground transition-colors hover:text-foreground motion-reduce:hidden [&>svg]:size-3"
      >
        {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
        {paused ? playLabel : pauseLabel}
      </button>
    </div>
  );
}
