import type { MetadataRoute } from "next";
import { siteDescription } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

// Absolute URLs: the site lives under a base path, and manifest URLs are not prefixed automatically.
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  return {
    id: SITE_URL,
    name: "Open WYSIWYG Editor",
    short_name: "Open WYSIWYG",
    description: await siteDescription("en"),
    lang: "en",
    dir: "ltr",
    start_url: SITE_URL,
    scope: SITE_URL,
    display: "browser",
    background_color: "#101112",
    theme_color: "#101112",
    categories: ["developer tools", "productivity"],
    icons: [{ src: `${SITE_URL}favicon.svg`, sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
