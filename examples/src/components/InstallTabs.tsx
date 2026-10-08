import { CodeBlock } from "./CodeBlock";
import { Tabs } from "./Tabs";

/** npm / pnpm / yarn install commands for a package. */
export function InstallTabs({ pkg }: { pkg: string }) {
  const commands = [
    { id: "npm", label: "npm", code: `npm install ${pkg}` },
    { id: "pnpm", label: "pnpm", code: `pnpm add ${pkg}` },
    { id: "yarn", label: "yarn", code: `yarn add ${pkg}` },
  ];
  return (
    <Tabs
      label="Package manager"
      tabs={commands.map((c) => ({ id: c.id, label: c.label, panel: <CodeBlock lang="bash" code={c.code} /> }))}
    />
  );
}
