import { getTranslations } from "next-intl/server";
import { LOCALES } from "@/i18n/config";
import { REPO } from "@/lib/site";
import type { Locale, PlaygroundText } from "@/types";
import { PlaygroundClient } from "./PlaygroundClient";

/**
 * Reads the sample document of every language from the messages (the sample links to the repository through
 * `{repo}`) and hands them to the interactive playground.
 */
export async function Playground() {
  const entries = await Promise.all(
    LOCALES.map(async (locale) => {
      const t = await getTranslations({ locale, namespace: "Playground" });
      const text: PlaygroundText = {
        sample: String(t.raw("sample")).replaceAll("{repo}", REPO),
        editorLabel: t("editorLabel"),
      };
      return [locale, text] as const;
    }),
  );
  return <PlaygroundClient text={Object.fromEntries(entries) as Record<Locale, PlaygroundText>} />;
}
