import { ArrowRight, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { npmUrl, REPO } from "@/lib/site";
import { cn } from "@/lib/utils";
import { GithubMark } from "./GithubMark";
import { Reveal } from "./Reveal";
import { CONTAINER } from "./SectionShell";

export function Cta() {
  const t = useTranslations("Cta");
  return (
    <section aria-labelledby="cta-title" className="relative pb-20 md:pb-28">
      <div className={CONTAINER}>
        <Reveal className="relative isolate overflow-hidden rounded-3xl border bg-card px-6 py-16 text-center shadow-elevated sm:px-12 md:py-20">
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-glow" />
          <h2 id="cta-title" className="mx-auto max-w-3xl text-h2">
            {t("title")}
          </h2>
          <p className="mx-auto mt-4 max-w-[56ch] text-lead text-muted-foreground">{t("text")}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
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
            <a
              href={npmUrl("open-wysiwyg-editor")}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "ghost", size: "lg" })}
            >
              {t("npm")}
              <ExternalLink aria-hidden="true" />
              <span className="sr-only">{t("newTab")}</span>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
