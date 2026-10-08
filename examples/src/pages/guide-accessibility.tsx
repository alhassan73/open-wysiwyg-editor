import { Layout } from "../components/Layout";
import { PageHead, Section, P, Kbd } from "../components/ui";
import { mount } from "../mount";

const SHORTCUTS: [string[], string][] = [
  [["Alt", "F10"], "Move focus to the toolbar"],
  [["Esc"], "Return from the toolbar to the text"],
  [["Alt", "0"], "Open the list of keyboard shortcuts"],
  [["Ctrl/⌘", "K"], "Insert or edit a link"],
  [["Ctrl/⌘", "F"], "Find & replace"],
  [["Ctrl/⌘", "B / I / U"], "Bold / italic / underline"],
  [["Ctrl/⌘", "Shift", "H"], "Highlight"],
  [["Ctrl/⌘", "Alt", "1…6 / 0"], "Heading 1 to 6 / paragraph"],
  [["Ctrl/⌘", "Shift", "7 / 8 / 9"], "Numbered, bulleted or task list"],
];

function Page() {
  return (
    <Layout path="guides/accessibility.html" docs>
      <PageHead
        eyebrow="Guides"
        title="Accessibility"
        lead="The editor targets WCAG 2.2 AA, ATAG 2.0 and WAI-ARIA authoring practices, and is checked with axe-core in every release."
      />

      <Section id="keyboard" title="Keyboard shortcuts">
        <P text="The editor is fully keyboard operable. The help dialog (`Alt + 0`) lists every shortcut for the current platform." />
        <div className="table-scroll" role="region" aria-label="Keyboard shortcuts" tabIndex={0}>
          <table className="table">
            <caption className="sr-only">Keyboard shortcuts</caption>
            <thead>
              <tr>
                <th scope="col">Shortcut</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {SHORTCUTS.map(([keys, action]) => (
                <tr key={action}>
                  <th scope="row">
                    {keys.map((k, i) => (
                      <span key={k}>
                        {i > 0 && <span aria-hidden="true"> + </span>}
                        <Kbd>{k}</Kbd>
                      </span>
                    ))}
                  </th>
                  <td>{action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="patterns" title="Patterns it follows">
        <ul className="plain-list bullets">
          <li><strong>Toolbar.</strong> The ARIA toolbar pattern with a single tab stop and a roving tabindex. Arrow keys, Home and End move between buttons, and the arrows follow RTL direction. Buttons announce their pressed or expanded state and their shortcuts.</li>
          <li><strong>Menus and dialogs.</strong> Menus follow the APG menu-button pattern. Dialogs are native <code className="ic">&lt;dialog&gt;</code> elements with labelled fields, inline error messages and focus returned to where you were.</li>
          <li><strong>No keyboard trap.</strong> In the text, Tab indents lists and moves between table cells. Press Esc and then Tab to leave the editor.</li>
          <li><strong>Announcements.</strong> Live regions announce results such as &quot;2 of 5 matches&quot;, &quot;Link inserted&quot; and a notice when the source view had to clean up HTML. <code className="ic">editor.announce()</code> sends your own messages.</li>
          <li><strong>Visual accessibility.</strong> Focus is always visible. Windows High Contrast (<code className="ic">forced-colors</code>) and <code className="ic">prefers-reduced-motion</code> are honored, and there is a dark theme. At narrow widths and 400% zoom the toolbar wraps instead of scrolling sideways.</li>
          <li><strong>Help for authors.</strong> Images prompt for alt text and offer a decorative option, tables get headers and a caption by default, and color pickers report contrast and warn below AA.</li>
        </ul>
      </Section>

      <Section id="tips" title="Making your own UI accessible">
        <P text="Give every editor an accessible name: a `<label for>` on a textarea or `<owe-editor>`, or `ariaLabel` / `ariaLabelledBy`. Use `ariaDescribedBy` for help text, set `contentLang` for content in another language, and put `lang` and `dir` on the content you display from storage." />
      </Section>
    </Layout>
  );
}

mount(<Page />);
