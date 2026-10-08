import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";
import { CopyButton } from "@/components/code/CopyButton";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { FRAMEWORKS } from "@/content/frameworks";
import { Link } from "@/i18n/navigation";
import { REPO } from "@/lib/site";
import { cn } from "@/lib/utils";
import { FrameworkLogo } from "./FrameworkLogo";
import { GithubMark } from "./GithubMark";
import { HeroGlow } from "./HeroGlow";
import { HeroPreview } from "./HeroPreview";
import { Marquee } from "./Marquee";
import { CONTAINER } from "./SectionShell";

/** Staggered entrance: CSS only (tw-animate-css), so the text is in the HTML and visible without JS. */
const enter =
  "animate-in fade-in slide-in-from-bottom-4 duration-[360ms] ease-out-expo fill-mode-both";
const after = (n: number) => ({ "--tw-animation-delay": `${n * 40}ms` }) as CSSProperties;

const LOGOS = FRAMEWORKS.filter((fw) => fw.slug !== "others");
const INSTALL = "npm install open-wysiwyg-editor";

export function Hero() {
  const t = useTranslations("Hero");
  const row = (duplicate: boolean) =>
    LOGOS.map((fw) => (
      <li
        key={fw.slug}
        aria-hidden={duplicate ? true : undefined}
        className={cn(
          "flex shrink-0 items-center gap-2.5 text-muted-foreground",
          duplicate && "motion-reduce:hidden",
        )}
      >
        <FrameworkLogo slug={fw.slug} decorative className="size-7" />
        <span lang="en" dir="ltr" className="text-body font-bold">
          {fw.name}
        </span>
      </li>
    ));

  return (
    <>
      <div className="relative isolate">
        <HeroGlow />
        <div className={cn(CONTAINER, "pt-12 pb-16 md:pt-20 md:pb-20")}>
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
            <div className="flex flex-col items-start text-start">
              <Badge
                variant="outline"
                className={cn(enter, "gap-2 rounded-full bg-card/60 px-3.5 py-1.5 backdrop-blur")}
              >
                <span aria-hidden="true" className="size-1.5 rounded-full bg-brand-teal" />
                <bdi dir="ltr" className="tabular-nums">
                  v1.0.0 · MIT
                </bdi>
              </Badge>

              <h1 id="hero-title" style={after(1)} className={cn(enter, "mt-6 text-display")}>
                {t.rich("title", {
                  em: (chunks) => (
                    <span className="text-gradient box-decoration-clone">{chunks}</span>
                  ),
                })}
              </h1>

              <p
                style={after(2)}
                className={cn(enter, "mt-6 max-w-[60ch] text-lead text-muted-foreground")}
              >
                {t("sub")}
              </p>

              <div style={after(3)} className={cn(enter, "mt-9 flex flex-wrap items-center gap-3")}>
                <Link
                  href="/getting-started/"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "shadow-[0_10px_30px_-8px_rgb(0_102_255/0.7)]",
                  )}
                >
                  {t("start")}
                  <ArrowRight aria-hidden="true" className="rtl:-scale-x-100" />
                </Link>
                <a
                  href={REPO}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                >
                  <GithubMark />
                  {t("github")}
                  <span className="sr-only">{t("newTab")}</span>
                </a>
              </div>

              <div style={after(4)} className={cn(enter, "mt-6 flex max-w-full")}>
                <div
                  dir="ltr"
                  className="inline-flex max-w-full items-center gap-3 rounded-xl border bg-card py-1.5 ps-4 pe-1.5 font-mono text-mono shadow-sm"
                >
                  <span aria-hidden="true" className="text-brand-teal select-none">
                    $
                  </span>
                  <code className="min-w-0 truncate text-foreground">{INSTALL}</code>
                  <CopyButton text={INSTALL} className="h-11 min-w-11" />
                </div>
              </div>
            </div>

            <div style={after(3)} className={enter}>
              <HeroPreview />
            </div>
          </div>
        </div>
      </div>

      {/* Below the hero's background glow, which fades out above it. */}
      <div>
        <div style={after(6)} className={cn(CONTAINER, enter, "pb-14 md:pb-16")}>
          <p className="mb-6 text-center text-small font-bold text-muted-foreground">
            {t("worksWith")}
          </p>
          <Marquee label={t("marquee")}>
            {row(false)}
            {row(true)}
          </Marquee>
        </div>
      </div>
    </>
  );
}
