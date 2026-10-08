import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { GuideIcon, GuidePage } from "@/components/sections/Guides";
import { GUIDES } from "@/content/guides";
import { routing } from "@/i18n/routing";
import { resolveLocale } from "@/lib/page";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () =>
  routing.locales.flatMap((locale) => GUIDES.map((g) => ({ locale, slug: g.slug })));

async function load({ params }: Props) {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const guide = GUIDES.find((g) => g.slug === slug);
  if (!guide) notFound();
  const [pages, nav, guides] = await Promise.all([
    getTranslations({ locale, namespace: "Pages" }),
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "Guides" }),
  ]);
  return {
    locale,
    guide,
    pages,
    nav,
    guides,
    title: guides(guide.key + ".title"),
    summary: guides(guide.key + ".summary"),
    path: "guides/" + guide.slug + "/",
  };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale, pages, title, summary, path } = await load(props);
  return buildMetadata(locale, path, {
    title,
    description: pages("guide.description", { summary }),
  });
}

export default async function Page(props: Props) {
  const { guide, nav, guides, title, summary, path } = await load(props);
  return (
    <>
      <PageHeader
        crumbs={[
          { name: nav("guides"), path: "guides/" },
          { name: title, path },
        ]}
        eyebrow={guides("eyebrow")}
        title={title}
        lead={summary}
        icon={<GuideIcon slug={guide.slug} />}
      />
      <GuidePage guide={guide} />
    </>
  );
}
