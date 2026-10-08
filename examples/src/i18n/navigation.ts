import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/** Locale-aware Link and usePathname: the language prefix (and, through next/link, the base path) is handled. */
export const { Link, usePathname, getPathname } = createNavigation(routing);
