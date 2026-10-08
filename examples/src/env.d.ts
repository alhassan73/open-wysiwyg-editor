import type { DetailedHTMLProps, HTMLAttributes } from "react";
import type { EditorElement } from "open-wysiwyg-editor/element";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "owe-editor": DetailedHTMLProps<HTMLAttributes<EditorElement>, EditorElement> & {
        name?: string;
        value?: string;
        placeholder?: string;
        language?: string;
        toolbar?: string;
        label?: string;
        readonly?: boolean;
        "content-lang"?: string;
      };
    }
  }
}
