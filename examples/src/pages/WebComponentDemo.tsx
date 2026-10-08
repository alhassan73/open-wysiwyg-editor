import { useRef, useState, type FormEvent } from "react";
import "open-wysiwyg-editor/element";

/** A real <form> with <owe-editor name="body">. Submit is prevented and the FormData value is shown. */
export function WebComponentDemo() {
  const [submitted, setSubmitted] = useState<string | null>(null);
  const field = useRef<HTMLElement & { value: string }>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(String(new FormData(event.currentTarget).get("body") ?? ""));
  };

  return (
    <form className="card demo-form" onSubmit={onSubmit} onReset={() => setSubmitted(null)}>
      <label htmlFor="wc-body" className="field-label">
        Article
      </label>
      <owe-editor
        id="wc-body"
        name="body"
        ref={field as never}
        placeholder="Write something…"
        value="<p>Edit me, then press <strong>Save</strong>. The form posts this HTML under the name <code>body</code>.</p>"
      />
      <div className="demo-actions">
        <button type="submit" className="btn btn-primary">
          Save
        </button>
        <button type="reset" className="btn btn-ghost">
          Reset
        </button>
      </div>
      <div aria-live="polite" className="demo-result">
        {submitted !== null && (
          <>
            <p className="demo-result-title">FormData value of &quot;body&quot; (submit was prevented):</p>
            <pre className="code-pre result" data-testid="form-result">
              <code>{submitted}</code>
            </pre>
          </>
        )}
      </div>
    </form>
  );
}
