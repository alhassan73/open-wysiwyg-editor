import type { PropsSpec } from "../content/frameworks";
import { Rich } from "./Rich";

const HEAD: Record<PropsSpec["kind"], string> = {
  props: "Prop",
  inputs: "Input",
  outputs: "Output",
  events: "Event",
  options: "Name",
  attributes: "Attribute",
  properties: "Property",
  members: "Member",
};

export function PropsTable({ title, kind, rows }: PropsSpec) {
  const hasDefault = rows.some((r) => r.def !== undefined);
  return (
    <div className="table-scroll" role="region" aria-label={title} tabIndex={0}>
      <table className="table">
        <caption className="sr-only">{title}</caption>
        <thead>
          <tr>
            <th scope="col">{HEAD[kind]}</th>
            <th scope="col">Type</th>
            {hasDefault && <th scope="col">Default</th>}
            <th scope="col">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <th scope="row">
                <code className="ic">{row.name}</code>
              </th>
              <td>{row.type && <code className="ic ic-type">{row.type}</code>}</td>
              {hasDefault && <td>{row.def ? <code className="ic ic-type">{row.def}</code> : null}</td>}
              <td>
                <Rich text={row.desc} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
