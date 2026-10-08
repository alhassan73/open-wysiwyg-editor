"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { siGithub, siNpm } from "simple-icons";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { LanguageSwitch } from "./LanguageSwitch";
import { CONTAINER, isCurrent, LINKS, PAGES } from "./nav";
import { ThemeToggle } from "./ThemeToggle";
import { Wordmark } from "./Wordmark";

/** Page scrolled more than this many px: the bar gains a border and the wordmark condenses. */
const COMPACT_AFTER = 8;

const desktopLink =
  "relative inline-flex min-h-11 items-center rounded-md px-3 py-2 text-small font-bold text-muted-foreground transition-colors duration-160 hover:text-foreground aria-[current=page]:text-foreground after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:scale-x-0 after:rounded-full after:bg-brand-gradient after:transition-transform after:duration-[360ms] after:ease-out-expo aria-[current=page]:after:scale-x-100";
const sheetLink =
  "flex min-h-11 items-center rounded-md px-3 py-3 text-body font-bold text-muted-foreground transition-colors duration-160 hover:bg-accent hover:text-accent-foreground aria-[current=page]:bg-accent aria-[current=page]:text-accent-foreground";

function BrandIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="size-5 fill-current">
      <path d={path} />
    </svg>
  );
}

/** Icon-only link to the repository or the npm package, with a tooltip. */
function ProjectIcon({
  kind,
  label,
  className,
}: {
  kind: "github" | "npm";
  label: string;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button asChild variant="ghost" size="icon" className={className}>
          <a href={LINKS[kind]} aria-label={label} rel="noreferrer">
            <BrandIcon path={kind === "github" ? siGithub.path : siNpm.path} />
          </a>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function Header() {
  const t = useTranslations("Header");
  const nav = useTranslations("Nav");
  const [compact, setCompact] = useState(false);
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > COMPACT_AFTER);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-compact={compact ? "" : undefined}
      className="sticky top-0 z-40 border-b border-transparent bg-header backdrop-blur-2xl backdrop-saturate-150 transition-colors data-compact:border-border"
    >
      <div
        className={cn(
          CONTAINER,
          "flex h-16 items-center justify-between gap-3 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-6",
        )}
      >
        <Link
          href="/"
          aria-label={t("home")}
          className="-ms-1 inline-flex w-fit justify-self-start rounded-lg p-1"
        >
          <Wordmark compact={compact} />
        </Link>

        <nav aria-label={t("nav")} className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {PAGES.map(({ key, href }) => (
              <li key={key}>
                <Link
                  href={href}
                  aria-current={isCurrent(pathname, href) ? "page" : undefined}
                  className={desktopLink}
                >
                  {nav(key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1 lg:justify-self-end">
          <LanguageSwitch className="hidden sm:inline-flex" />
          <ThemeToggle />
          <ProjectIcon kind="github" label={t("github")} className="hidden xl:inline-flex" />
          <ProjectIcon kind="npm" label={t("npm")} className="hidden xl:inline-flex" />

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label={t("openMenu")}
              >
                <Menu aria-hidden="true" className="size-5" />
              </Button>
            </SheetTrigger>
            {/* "end" is the side the button is on: right in English, left in Arabic. */}
            <SheetContent side="end" closeLabel={t("close")} className="gap-0">
              <SheetHeader className="border-b">
                <SheetTitle>{t("menu")}</SheetTitle>
                <SheetDescription className="sr-only">{t("menuDescription")}</SheetDescription>
              </SheetHeader>
              <nav aria-label={t("nav")} className="flex-1 overflow-y-auto p-3">
                <ul className="grid gap-1">
                  {PAGES.map(({ key, href }) => (
                    <li key={key}>
                      <SheetClose asChild>
                        <Link
                          href={href}
                          aria-current={isCurrent(pathname, href) ? "page" : undefined}
                          className={sheetLink}
                        >
                          {nav(key)}
                        </Link>
                      </SheetClose>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="flex flex-wrap items-center gap-2 border-t p-4">
                <LanguageSwitch className="border border-input" />
                <Button asChild variant="outline" size="sm">
                  <a href={LINKS.github} rel="noreferrer">
                    <BrandIcon path={siGithub.path} />
                    GitHub
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href={LINKS.npm} rel="noreferrer">
                    <BrandIcon path={siNpm.path} />
                    npm
                  </a>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
