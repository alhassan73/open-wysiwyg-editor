/* global OpenWysiwygEditor */
// Test harness (external file — inline scripts are blocked by the page's CSP).
window.__violations = [];
document.addEventListener("securitypolicyviolation", (e) => {
  window.__violations.push(`${e.violatedDirective}: ${e.blockedURI || e.sample || ""}`);
});
window.__errors = [];
window.addEventListener("error", (e) => window.__errors.push(String(e.message)));
window.__xss = 0; // incremented by any payload that manages to execute

const params = new URLSearchParams(location.search);
const language = params.get("lang") || undefined;
if (language === "ar") {
  document.documentElement.lang = "ar";
  document.documentElement.dir = "rtl";
}

window.editor = OpenWysiwygEditor.createEditor({
  element: document.getElementById("body"),
  language,
  dir: language === "ar" ? "rtl" : undefined,
  editable: params.get("readonly") !== "1",
  ui: { theme: params.get("theme") || "auto" },
});
window.__ready = true;
