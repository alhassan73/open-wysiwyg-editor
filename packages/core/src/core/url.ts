export interface UrlPolicy {
  /** Allowed URL schemes for links (without the colon). Default: http, https, mailto, tel. */
  protocols?: string[];
  /** Allow `data:image/(png|jpeg|gif|webp|avif);base64,...` in image `src`. Default: false. */
  allowDataImages?: boolean;
  /** Allow relative and fragment URLs (`/path`, `page.html`, `#id`). Default: true. */
  allowRelative?: boolean;
}

export const DEFAULT_PROTOCOLS = ["http", "https", "mailto", "tel"];

// C0 controls, DEL, C1 controls and Unicode whitespace/invisible characters browsers ignore in schemes.
// eslint-disable-next-line no-control-regex
const STRIP = new RegExp("[\u0000-\u001F\u007F-\u009F\u00AD\u200B-\u200F\u2028\u2029\u2060\uFEFF]", "g");
const SCHEME = /^([a-z][a-z0-9+.-]*):/i;
const SAFE_DATA_IMAGE = /^data:image\/(?:png|jpe?g|gif|webp|avif);base64,[a-z0-9+/]+=*$/i;

/**
 * Returns a safe URL string, or `null` when the URL must not be used.
 * Blocks javascript:, vbscript:, data: (except allowed raster images), file:, blob: and any
 * scheme not in the allowlist — including obfuscated forms like "java\tscript:" or "JaVaScRiPt:".
 */
export function sanitizeUrl(
  input: unknown,
  policy: UrlPolicy = {},
  kind: "link" | "image" = "link",
): string | null {
  if (typeof input !== "string") return null;
  const url = input.replace(STRIP, "").trim();
  if (!url) return null;

  // Schemes are matched after removing interior whitespace, as browsers do.
  const scheme = SCHEME.exec(url.replace(/\s+/g, ""));
  if (!scheme) {
    if (policy.allowRelative === false) return null;
    // Protocol-relative URLs inherit http(s); anything else without a scheme is relative.
    return url;
  }
  const name = scheme[1]!.toLowerCase();
  if (name === "data") {
    return kind === "image" && policy.allowDataImages && SAFE_DATA_IMAGE.test(url) ? url : null;
  }
  const allowed = kind === "image" ? ["http", "https"] : (policy.protocols ?? DEFAULT_PROTOCOLS);
  return allowed.includes(name) ? url : null;
}
