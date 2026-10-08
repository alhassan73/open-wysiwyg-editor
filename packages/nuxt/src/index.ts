// Nuxt module (Nuxt 3 and 4): registers <RichTextEditor> for auto-import and adds the stylesheet.
//
//   // nuxt.config.ts
//   export default defineNuxtConfig({ modules: ["@open-wysiwyg-editor/nuxt"] });
//
// The component comes from @open-wysiwyg-editor/vue and is SSR-safe: the server renders an empty
// container, and the editor starts in the browser.
import { fileURLToPath } from "node:url";
import { addComponent, defineNuxtModule } from "@nuxt/kit";

export interface ModuleOptions {
  /** Add the editor stylesheet to every page. Default true. */
  css: boolean;
  /** Name of the auto-imported component. Default "RichTextEditor". */
  componentName: string;
}

// Resolved from this package, so it works under pnpm's strict node_modules too.
const resolve = (specifier: string) => fileURLToPath(import.meta.resolve(specifier));

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "@open-wysiwyg-editor/nuxt",
    configKey: "wysiwygEditor",
    compatibility: { nuxt: ">=3.0.0" },
  },
  defaults: { css: true, componentName: "RichTextEditor" },
  setup(options, nuxt) {
    if (options.css) nuxt.options.css.push(resolve("@open-wysiwyg-editor/vue/style.css"));
    addComponent({
      name: options.componentName,
      export: "RichTextEditor",
      filePath: resolve("@open-wysiwyg-editor/vue"),
    });
  },
});

declare module "@nuxt/schema" {
  interface NuxtConfig {
    wysiwygEditor?: Partial<ModuleOptions>;
  }
}
