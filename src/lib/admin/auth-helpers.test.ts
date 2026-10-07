import { describe, expect, it } from "vitest";
import { hasAuthCookie, looksLikeEmail, safeNextPath } from "./auth-helpers";

describe("hasAuthCookie", () => {
  it("spots the Supabase login cookie, whole or split into parts", () => {
    expect(hasAuthCookie(["theme", "sb-ckzhgqaalsgwiomlbbdf-auth-token"])).toBe(true);
    expect(hasAuthCookie(["sb-ckzhgqaalsgwiomlbbdf-auth-token.0"])).toBe(true);
  });

  it("ignores the site's own cookies", () => {
    expect(hasAuthCookie(["theme", "favorites", "cookie_notice"])).toBe(false);
    expect(hasAuthCookie([])).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("allows paths on this site", () => {
    expect(safeNextPath("/admin")).toBe("/admin");
    expect(safeNextPath("/admin/concurs/123?x=1")).toBe("/admin/concurs/123?x=1");
  });

  it("refuses other websites and odd paths", () => {
    expect(safeNextPath("https://evil.example")).toBe("/admin");
    expect(safeNextPath("//evil.example")).toBe("/admin");
    // Browsers treat "/\evil.example" like "//evil.example".
    expect(safeNextPath(String.raw`/\evil.example`)).toBe("/admin");
    expect(safeNextPath("admin")).toBe("/admin");
  });

  it("falls back when missing", () => {
    expect(safeNextPath(null)).toBe("/admin");
    expect(safeNextPath(undefined, "/")).toBe("/");
  });
});

describe("looksLikeEmail", () => {
  it("accepts normal addresses and rejects junk", () => {
    expect(looksLikeEmail("someone@example.com")).toBe(true);
    expect(looksLikeEmail("someone@example")).toBe(false);
    expect(looksLikeEmail("not an email")).toBe(false);
    expect(looksLikeEmail("")).toBe(false);
  });
});
