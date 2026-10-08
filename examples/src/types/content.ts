import type { Lang } from "./highlight";

export type FrameworkSlug =
  | "react"
  | "next"
  | "preact"
  | "vue"
  | "nuxt"
  | "angular"
  | "svelte"
  | "solid"
  | "astro"
  | "web-component"
  | "vanilla"
  | "others";

export interface Snippet {
  /** Key of the tab. Its translated label is `Frameworks.items.<slug>.snippets.<id>` unless `label` is set. */
  id: string;
  /** Language-neutral tab label (a file name or a product name). */
  label?: string;
  lang: Lang;
  code: string;
}

/** Code and facts of one framework. Its name, blurb and notes are in the messages (`Frameworks.items.<slug>`). */
export interface Framework {
  slug: FrameworkSlug;
  /** English or brand name, used where the page shows the logos. */
  name: string;
  /** npm package to install. */
  pkg: string;
  /** Shell command that installs it. */
  install: string;
  /** Peer requirement, e.g. "React 18+". */
  requires?: string;
  snippets: Snippet[];
}

/** One row of an API table. Its description is `Api.rows.<group>.<id>` in the messages. */
export interface ApiRow {
  id: string;
  name: string;
  type?: string;
  def?: string;
}

/** One line of the commands table. Its group name is `Api.commandGroups.<id>` in the messages. */
export interface CommandGroup {
  id: string;
  commands: string;
}

/** Tables of the API section: the keys of `Api.rows` in the messages. */
export type ApiGroup =
  "options" | "ui" | "callbacks" | "methods" | "attributes" | "properties" | "events" | "entries";

/** URL segment of a guide page. */
export type GuideSlug = "theming" | "styling" | "accessibility" | "security" | "i18n";

/** Key of a guide in the messages (`Guides.<key>`). */
export type GuideKey = "theming" | "styling" | "a11y" | "security" | "languages";

export interface Guide {
  slug: GuideSlug;
  key: GuideKey;
}

/** One step of a page's breadcrumb trail. `path` is the route after the language ("" is the home page). */
export interface Crumb {
  name: string;
  path: string;
}
