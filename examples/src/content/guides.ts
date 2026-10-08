import type { Guide } from "@/types";

/** The guide pages, in menu order. `key` is the guide's namespace in the messages (`Guides.<key>`). */
export const GUIDES: Guide[] = [
  { slug: "theming", key: "theming" },
  { slug: "styling", key: "styling" },
  { slug: "accessibility", key: "a11y" },
  { slug: "security", key: "security" },
  { slug: "i18n", key: "languages" },
];
