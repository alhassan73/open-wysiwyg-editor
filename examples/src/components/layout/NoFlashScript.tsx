/**
 * Runs before first paint: marks the page as script-enabled (so `.reveal` content may start hidden) and
 * applies the saved theme, or the OS preference when nothing is saved. The text is hashed into the CSP
 * by scripts/export.mjs, so keep it deterministic. The key must match ThemeToggle.
 */
const SCRIPT =
  'try{var d=document.documentElement;d.classList.add("js");var t;try{t=localStorage.getItem("owe-site-theme")}catch(e){}' +
  'if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";' +
  'd.setAttribute("data-theme",t)}catch(e){}';

export function NoFlashScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
