/**
 * Favourite races, kept in a cookie on the visitor's device (no account needed).
 * The cookie holds event ids, comma-separated; the server reads it to mark stars
 * and to build the favourites page.
 */

export const FAVORITES_COOKIE = "favorites";

/** 100 ids × 37 characters stays well under the 4 KB browsers allow per cookie. */
export const MAX_FAVORITES = 100;

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Valid, unique event ids from the cookie value, oldest first; junk is ignored. */
export function parseFavorites(value: string | undefined): string[] {
  if (!value) return [];
  const ids = decodeURIComponent(value)
    .split(",")
    .map((id) => id.trim().toLowerCase())
    .filter((id) => ID.test(id));
  return [...new Set(ids)].slice(-MAX_FAVORITES);
}

/** Adds or removes one event; when full, the oldest favourite makes room. */
export function toggleFavorite(ids: string[], id: string): string[] {
  const key = id.toLowerCase();
  if (ids.includes(key)) return ids.filter((existing) => existing !== key);
  return [...ids, key].slice(-MAX_FAVORITES);
}

/** Cookie string that keeps the favourites for a year, on every page. */
export function favoritesCookie(ids: string[]): string {
  return `${FAVORITES_COOKIE}=${ids.join(",")}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

/** Reads the favourites from document.cookie (browser only). */
export function readFavoritesFromDocument(): string[] {
  const entry = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${FAVORITES_COOKIE}=`));
  return parseFavorites(entry?.slice(FAVORITES_COOKIE.length + 1));
}

/** Browser event fired whenever the favourites change; `detail` is the new id list. */
export const FAVORITES_EVENT = "favorites-change";

/** Saves the favourites in the cookie and tells the rest of the page (e.g. the count). */
export function saveFavorites(ids: string[]): void {
  document.cookie = favoritesCookie(ids);
  window.dispatchEvent(new CustomEvent<string[]>(FAVORITES_EVENT, { detail: ids }));
}
