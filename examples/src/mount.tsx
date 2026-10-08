import "@fontsource/almarai/400.css";
import "@fontsource/almarai/700.css";
import "@fontsource/almarai/800.css";
import "@open-wysiwyg-editor/react/style.css";
import "./styles/site.css";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { initTheme } from "./theme";

/** Mounts a page into `#root`. Every HTML file calls this through its own entry module. */
export function mount(page: ReactNode) {
  initTheme();
  const el = document.getElementById("root");
  if (el) createRoot(el).render(page);
}

/** `data-slug` of `#root`, for entries shared by several HTML files. */
export const slug = () => document.getElementById("root")?.dataset.slug ?? "";
