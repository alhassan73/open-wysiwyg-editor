import type { Locale } from "@/types";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";

/**
 * Both message files, for the two pages that have no locale of their own (the root language chooser and the
 * global 404). Everything else gets its messages from next-intl.
 */
export const ALL_MESSAGES: Record<Locale, typeof en> = { en, ar };
