/**
 * Origin serving `/uploads/*`, derived from the API base URL.
 *
 * Single definition — this was duplicated (with different fallbacks) in two
 * components.
 */
export const ASSET_ORIGIN = (import.meta.env.VITE_API_URL ?? "").replace(/\/api\/?$/, "");

/** Resolves a possibly-relative upload path to an absolute URL. */
export const assetUrl = (url) => {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `${ASSET_ORIGIN}${url}`;
};
