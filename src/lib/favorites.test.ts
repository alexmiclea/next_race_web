import { afterEach, describe, expect, it } from "vitest";
import {
  favoritesCookie,
  MAX_FAVORITES,
  parseFavorites,
  readFavoritesFromDocument,
  toggleFavorite,
} from "./favorites";

const A = "3f2b8c1e-9a4d-4e7f-8b2a-1c5d6e7f8a9b";
const B = "da78ecc7-54dd-4fd1-851f-fa5b4d41f019";
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

describe("parseFavorites", () => {
  it("reads comma-separated event ids", () => {
    expect(parseFavorites(`${A},${B}`)).toEqual([A, B]);
  });

  it("is empty for a missing or empty cookie", () => {
    expect(parseFavorites(undefined)).toEqual([]);
    expect(parseFavorites("")).toEqual([]);
  });

  it("ignores junk, duplicates and case differences", () => {
    expect(parseFavorites(`${A},not-an-id,${A.toUpperCase()},,${B}`)).toEqual([A, B]);
  });

  it("decodes a URL-encoded cookie value", () => {
    expect(parseFavorites(`${A}%2C${B}`)).toEqual([A, B]);
  });

  it("keeps only the newest favourites when over the limit", () => {
    const many = Array.from({ length: MAX_FAVORITES + 5 }, (_, n) => id(n));
    const parsed = parseFavorites(many.join(","));
    expect(parsed).toHaveLength(MAX_FAVORITES);
    expect(parsed[0]).toBe(id(5));
  });
});

describe("toggleFavorite", () => {
  it("adds a new favourite at the end", () => {
    expect(toggleFavorite([A], B)).toEqual([A, B]);
  });

  it("removes an existing favourite", () => {
    expect(toggleFavorite([A, B], A)).toEqual([B]);
    expect(toggleFavorite([A, B], A.toUpperCase())).toEqual([B]);
  });

  it("drops the oldest when full", () => {
    const full = Array.from({ length: MAX_FAVORITES }, (_, n) => id(n));
    const next = toggleFavorite(full, A);
    expect(next).toHaveLength(MAX_FAVORITES);
    expect(next[0]).toBe(id(1));
    expect(next.at(-1)).toBe(A);
  });
});

describe("favoritesCookie", () => {
  it("stores the ids site-wide for a year", () => {
    const cookie = favoritesCookie([A, B]);
    expect(cookie).toMatch(new RegExp(`^favorites=${A},${B};`));
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("Max-Age=31536000");
  });

  it("stays under the 4 KB cookie limit when full", () => {
    const full = Array.from({ length: MAX_FAVORITES }, (_, n) => id(n));
    expect(favoritesCookie(full).length).toBeLessThan(4096);
  });
});

describe("readFavoritesFromDocument", () => {
  afterEach(() => {
    document.cookie = "favorites=; Path=/; Max-Age=0";
  });

  it("round-trips through document.cookie", () => {
    document.cookie = favoritesCookie([A, B]);
    expect(readFavoritesFromDocument()).toEqual([A, B]);
  });

  it("is empty when there is no cookie", () => {
    expect(readFavoritesFromDocument()).toEqual([]);
  });
});
