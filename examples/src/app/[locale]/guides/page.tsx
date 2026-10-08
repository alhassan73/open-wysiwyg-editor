import { Compass } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { GuideCards } from "@/components/sections/Guides";
import { type LocaleParams, resolveLocale } from "@/lib/page";
import { buildMetadata } from "@/lib/seo";

const PATH = "guides/";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const [pages, guides] = await Promise.all([
    getTranslations({ locale, namespace: "Pages" }),
    getTranslations({ locale, namespace: "Guides" }),
  ]);
  return buildMetadata(locale, PATH, {
    title: pages("guides.title"),
    description: guides("description"),
  });
}

export default async function Page({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const [nav, guides] = await Promise.all([
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "Guides" }),
  ]);
  return (
    <>
      <PageHeader
        crumbs={[{ name: nav("guides"), path: PATH }]}
        eyebrow={guides("eyebrow")}
        title={guides("title")}
        lead={guides("description")}
        icon={<Compass aria-hidden="true" />}
      />
      <GuideCards />
    </>
  );
}
