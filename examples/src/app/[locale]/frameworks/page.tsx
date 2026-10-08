import { Layers } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { FrameworkCards } from "@/components/sections/Frameworks";
import { type LocaleParams, resolveLocale } from "@/lib/page";
import { buildMetadata } from "@/lib/seo";

const PATH = "frameworks/";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const [pages, fw] = await Promise.all([
    getTranslations({ locale, namespace: "Pages" }),
    getTranslations({ locale, namespace: "Frameworks" }),
  ]);
  return buildMetadata(locale, PATH, {
    title: pages("frameworks.title"),
    description: fw("description"),
  });
}

export default async function Page({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const [nav, fw] = await Promise.all([
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "Frameworks" }),
  ]);
  return (
    <>
      <PageHeader
        crumbs={[{ name: nav("frameworks"), path: PATH }]}
        eyebrow={fw("eyebrow")}
        title={fw("title")}
        lead={fw("description")}
        icon={<Layers aria-hidden="true" />}
      />
      <FrameworkCards />
    </>
  );
}
