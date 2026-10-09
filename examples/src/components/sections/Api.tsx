import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DocSection } from "@/components/layout/DocSection";
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
import type { ApiGroup, ApiRow } from "@/types";
import { rich } from "./Rich";

type Cell = ReactNode;

function DataTable({
  caption,
  scroll,
  head,
  rows,
}: {
  caption: string;
  scroll: string;
  head: string[];
  rows: Cell[][];
}) {
  return (
    <Table scrollLabel={`${scroll} ${caption}`} className="min-w-152">
      <caption className="sr-only">{caption}</caption>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {head.map((h) => (
            <TableHead key={h} scope="col">
              {h}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((cells, i) => (
          <TableRow key={i}>
            {cells.map((cell, j) => (
              <TableCell
                key={j}
                className={j === 0 ? "font-bold text-foreground" : "text-muted-foreground"}
              >
                {cell}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Left-to-right code in a table cell. */
const Code = ({ children, strong = false }: { children: ReactNode; strong?: boolean }) => (
  <code
    dir="ltr"
    className={`inline-block font-mono text-mono wrap-break-word ${strong ? "text-foreground" : "text-muted-foreground"}`}
  >
    {children}
  </code>
);

/** Body of the API page: one section per table. Each id is a key of "Api.cards" in the messages. */
export function Api() {
  const t = useTranslations("Api");
  const desc = (group: ApiGroup, id: string) => t.rich(`rows.${group}.${id}`, rich);
  const withDefault = (group: ApiGroup, rows: ApiRow[]): Cell[][] =>
    rows.map((r) => [
      <Code key="n" strong>
        {r.name}
      </Code>,
      r.type ? <Code key="t">{r.type}</Code> : null,
      r.def ? <Code key="d">{r.def}</Code> : <span aria-hidden="true">–</span>,
      <span key="x">{desc(group, r.id)}</span>,
    ]);
  const noDefault = (group: ApiGroup, rows: ApiRow[]): Cell[][] =>
    rows.map((r) => [
      <Code key="n" strong>
        {r.name}
      </Code>,
      r.type ? <Code key="t">{r.type}</Code> : null,
      <span key="x">{desc(group, r.id)}</span>,
    ]);

  const table = (caption: string, head: string[], rows: Cell[][]) => (
    <DataTable caption={t(`captions.${caption}`)} scroll={t("scroll")} head={head} rows={rows} />
  );
  const card = (key: string, children: ReactNode) => (
    <DocSection id={key} title={t(`cards.${key}.title`)}>
      <p>{t.rich(`cards.${key}.description`, rich)}</p>
      {children}
    </DocSection>
  );
  const col = (...keys: string[]) => keys.map((k) => t(`cols.${k}`));

  return (
    <>
      {card(
        "options",
        table("options", col("option", "type", "def", "desc"), withDefault("options", OPTIONS)),
      )}
      {card("ui", table("ui", col("option", "type", "def", "desc"), withDefault("ui", UI_OPTIONS)))}
      {card(
        "callbacks",
        table("callbacks", col("name", "type", "desc"), noDefault("callbacks", CALLBACKS)),
      )}
      {card(
        "methods",
        table("methods", col("method", "returns", "desc"), noDefault("methods", METHODS)),
      )}
      {card(
        "commands",
        table(
          "commands",
          col("group", "commands"),
          COMMANDS.map((c) => [
            <bdi key="g">{t(`commandGroups.${c.id}`)}</bdi>,
            <Code key="c">{c.commands}</Code>,
          ]),
        ),
      )}
      {card(
        "attributes",
        table(
          "attributes",
          col("name", "type", "desc"),
          noDefault("attributes", ELEMENT_ATTRIBUTES),
        ),
      )}
      {card(
        "properties",
        table(
          "properties",
          col("name", "type", "desc"),
          noDefault("properties", ELEMENT_PROPERTIES),
        ),
      )}
      {card(
        "events",
        table("events", col("name", "type", "desc"), noDefault("events", ELEMENT_EVENTS)),
      )}
      {card(
        "entries",
        table("entries", col("where", "type", "desc"), noDefault("entries", ENTRY_POINTS)),
      )}
    </>
  );
}
