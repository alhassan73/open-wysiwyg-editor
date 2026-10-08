import { Download } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Install } from "@/components/sections/Install";
import { type LocaleParams, resolveLocale } from "@/lib/page";
import { buildMetadata } from "@/lib/seo";

const PATH = "getting-started/";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const [pages, install] = await Promise.all([
    getTranslations({ locale, namespace: "Pages" }),
    getTranslations({ locale, namespace: "Install" }),
  ]);
  return buildMetadata(locale, PATH, {
    title: pages("gettingStarted.title"),
    description: install("description"),
  });
}

export default async function Page({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const [nav, install] = await Promise.all([
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "Install" }),
  ]);
  return (
    <>
      <PageHeader
        crumbs={[{ name: nav("gettingStarted"), path: PATH }]}
        eyebrow={install("eyebrow")}
        title={install("title")}
        lead={install("description")}
        icon={<Download aria-hidden="true" />}
      />
      <Install />
    </>
  );
}
