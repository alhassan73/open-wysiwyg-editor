"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** Must match NoFlashScript. */
const STORAGE_KEY = "owe-site-theme";
type Theme = "dark" | "light";

// <html data-theme> is the source of truth: the no-flash script sets it before React runs.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
const getTheme = (): Theme =>
  document.documentElement.dataset.theme === "light" ? "light" : "dark";
const getServerTheme = (): Theme | null => null;

export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("ThemeToggle");
  const theme = useSyncExternalStore<Theme | null>(subscribe, getTheme, getServerTheme);
  const label = t(theme === null ? "toggle" : theme === "dark" ? "toLight" : "toDark");

  const toggle = () => {
    const next: Theme = getTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be blocked; the theme still applies for this visit.
    }
  };

  // Icons are switched by CSS from <html data-theme>, so they are right before hydration too.
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("relative", className)}
          aria-label={label}
          onClick={toggle}
        >
          <Sun
            aria-hidden="true"
            className="absolute size-[1.15rem] scale-0 -rotate-90 opacity-0 transition-all duration-300 dark:scale-100 dark:rotate-0 dark:opacity-100"
          />
          <Moon
            aria-hidden="true"
            className="absolute size-[1.15rem] scale-100 rotate-0 opacity-100 transition-all duration-300 dark:scale-0 dark:rotate-90 dark:opacity-0"
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
