// Minimal Node typings so the module type-checks without @types/node.
declare module "node:url" {
  export function fileURLToPath(url: string | URL): string;
}
interface ImportMeta {
  resolve(specifier: string): string;
}
