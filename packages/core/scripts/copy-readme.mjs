// The root README is the single documentation for GitHub and for the npm page of this package.
// `npm pack` / `npm publish` run this (through `prepack`) so the tarball carries the same file.
import { copyFileSync } from "node:fs";

copyFileSync(new URL("../../../README.md", import.meta.url), new URL("../README.md", import.meta.url));
