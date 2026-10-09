import styles from "./Wordmark.module.css";

const NAME = "Open WYSIWYG Editor";

/**
 * The "owe" mark: lowercase owe on a selection highlight, the name, and a text caret that blinks a few
 * times after load and then stays (blinking stops within 5 s, WCAG 2.2.2). `full` is the lockup, `mark`
 * is just "owe". Decorative: the link around it carries the accessible name.
 */
export function Wordmark({ variant = "full" }: { variant?: "full" | "mark" }) {
  return (
    <span className={styles.wm} dir="ltr" aria-hidden="true">
      <span className={styles.sel}>owe</span>
      {variant === "full" && <span className={styles.name}>{NAME}</span>}
      <i className={styles.caret} />
    </span>
  );
}
