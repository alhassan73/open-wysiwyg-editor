// Search index of the docs, built at build time (the layout is prerendered) from the messages and the content
// tables. Only the current language is built and sent to the browser; nothing is fetched at runtime.
import {
  CALLBACKS,
  COMMANDS,
  ELEMENT_ATTRIBUTES,
  ELEMENT_EVENTS,
  ELEMENT_PROPERTIES,
  ENTRY_POINTS,
  METHODS,
  OPTIONS,
  UI_OPTIONS,
} from "@/content/api";
import { FRAMEWORKS } from "@/content/frameworks";
import { GUIDES } from "@/content/guides";
import type { ApiGroup, ApiRow, SearchEntry } from "@/types";

type Messages = Record<string, unknown>;

/** Longest summary kept per entry; the rest would only grow every page. */
const MAX_TEXT = 180;

/** Tables of the API page, in page order. `id` is both the `Api.rows` group and the section anchor. */
const API_TABLES: [ApiGroup, ApiRow[]][] = [
  ["options", OPTIONS],
  ["ui", UI_OPTIONS],
  ["callbacks", CALLBACKS],
  ["methods", METHODS],
  ["attributes", ELEMENT_ATTRIBUTES],
  ["properties", ELEMENT_PROPERTIES],
  ["events", ELEMENT_EVENTS],
  ["entries", ENTRY_POINTS],
];
/** Anchors of the API page's sections (the table of contents). */
const API_SECTIONS = [
  "options",
  "ui",
  "callbacks",
  "methods",
  "commands",
  "attributes",
  "properties",
  "events",
  "entries",
];

/**
 * Sections inside a guide: the message keys of the heading and of its text (if it has one), and the id of the
 * heading on the page (sections/Guides.tsx). Callouts have no heading id: those results open the guide.
 */
const GUIDE_SECTIONS: Record<string, [title: string, text: string | undefined, id: string | undefined][]> = {
  a11y: [
    ["shortcutsTitle", undefined, "shortcuts"],
    ["patternsTitle", undefined, "patterns"],
    ["tipTitle", "tip", undefined],
  ],
  security: [
    ["layersTitle", undefined, "layers"],
    ["cspTitle", "csp", "csp"],
    ["ttTitle", "tt", "trusted-types"],
    ["serverTitle", "server", undefined],
  ],
  styling: [
    ["filesTitle", "files", "files"],
    ["tokensTitle", "tokens", "tokens"],
    ["themeTitle", "theme", "theme"],
  ],
  theming: [
    ["oneTitle", "one", "one-color"],
    ["derivedTitle", "derived", "derived"],
    ["buttonsTitle", "buttons", "buttons"],
    ["dashboardTitle", "dashboard", "dashboard"],
    ["laterTitle", "later", "later"],
    ["contrastTitle", "contrast", undefined],
  ],
  languages: [
    ["arabicTitle", "arabic", "arabic"],
    ["customTitle", "custom", "custom"],
    ["displayTitle", "display", "display"],
  ],
};

/** Getting started: heading ids of its steps and sections (sections/Install.tsx). */
const STEP_IDS = ["install", "styles", "create"];

/** The message at a dotted path, as plain text; `undefined` when the key is missing. */
function read(messages: Messages, path: string): string | undefined {
  let node: unknown = messages;
  for (const key of path.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[key];
  }
  return typeof node === "string" ? plain(node) : undefined;
}

/** ICU message to plain text: drops the rich-text tags and the ICU quoting around < > { }. */
function plain(message: string): string {
  const text = message
    .replace(/<\/?[a-z]+(?:\s[^>]*)?>/gi, "")
    .replace(/'([<>{}])'/g, "$1")
    .replace(/''/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= MAX_TEXT) return text;
  return text.slice(0, MAX_TEXT).replace(/\s+\S*$/, "") + "…";
}

export function buildSearchIndex(messages: Messages): SearchEntry[] {
  const m = (path: string) => read(messages, path);
  const out: SearchEntry[] = [];
  const add = (entry: Omit<SearchEntry, "title" | "text"> & { title?: string; text?: string }) => {
    if (entry.title) out.push({ ...entry, title: entry.title, text: entry.text ?? "" });
  };

  const start = m("Pages.gettingStarted.title");
  add({ href: "/getting-started/", title: start, text: m("Install.description"), group: "start" });
  const steps = STEP_IDS.map((id, i) => [m(`Install.steps.${i}.title`), m(`Install.steps.${i}.text`), id]);
  const startSections = [
    ...steps,
    [m("Install.saveTitle"), m("Install.saveText"), "save"],
    [m("Install.showTitle"), m("Install.showText"), "display"],
    [m("Install.serverTitle"), m("Install.serverNote"), undefined],
  ];
  for (const [title, text, id] of startSections) {
    add({ href: `/getting-started/${id ? `#${id}` : ""}`, title, text, group: "start", parent: start });
  }

  const frameworks = m("Pages.frameworks.title");
  add({
    href: "/frameworks/",
    title: frameworks,
    text: m("Frameworks.description"),
    group: "frameworks",
  });
  for (const fw of FRAMEWORKS) {
    add({
      href: `/frameworks/${fw.slug}/`,
      title: m(`Frameworks.items.${fw.slug}.name`) ?? fw.name,
      text: m(`Frameworks.items.${fw.slug}.blurb`),
      group: "frameworks",
      keywords: `${fw.pkg} ${fw.install}`,
    });
  }

  const api = m("Pages.api.title");
  add({ href: "/api/", title: api, text: m("Api.description"), group: "reference" });
  for (const id of API_SECTIONS) {
    add({
      href: `/api/#${id}`,
      title: m(`Api.cards.${id}.title`),
      text: m(`Api.cards.${id}.description`),
      group: "reference",
      parent: api,
    });
  }
  for (const [group, rows] of API_TABLES) {
    for (const row of rows) {
      add({
        href: `/api/#${group}`,
        title: row.name,
        text: m(`Api.rows.${group}.${row.id}`),
        group: "reference",
        parent: api,
        keywords: row.type,
      });
    }
  }
  for (const { id, commands } of COMMANDS) {
    add({
      href: "/api/#commands",
      title: m(`Api.commandGroups.${id}`),
      text: plain(commands),
      group: "reference",
      parent: api,
      keywords: commands,
    });
  }

  const guides = m("Pages.guides.title");
  add({ href: "/guides/", title: guides, text: m("Guides.description"), group: "guides" });
  for (const { slug, key } of GUIDES) {
    const title = m(`Guides.${key}.title`);
    add({ href: `/guides/${slug}/`, title, text: m(`Guides.${key}.summary`), group: "guides" });
    for (const [head, body, id] of GUIDE_SECTIONS[key] ?? []) {
      add({
        href: `/guides/${slug}/${id ? `#${id}` : ""}`,
        title: m(`Guides.${key}.${head}`),
        text: body && m(`Guides.${key}.${body}`),
        group: "guides",
        parent: title,
      });
    }
  }

  add({
    href: "/changelog/",
    title: m("Changelog.title"),
    text: m("Changelog.description"),
    group: "changelog",
  });
  return out;
}
