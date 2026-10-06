import { describe, expect, it } from "vitest";
import { nextTheme, parseTheme, themeCookie } from "./theme";

describe("parseTheme", () => {
  it("accepts the three themes", () => {
    expect(parseTheme("system")).toBe("system");
    expect(parseTheme("light")).toBe("light");
    expect(parseTheme("dark")).toBe("dark");
  });

  it("falls back to system for missing or unknown values", () => {
    expect(parseTheme(undefined)).toBe("system");
    expect(parseTheme("")).toBe("system");
    expect(parseTheme("blue")).toBe("system");
  });
});

describe("nextTheme", () => {
  it("cycles system → light → dark → system", () => {
    expect(nextTheme("system")).toBe("light");
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("system");
  });
});

describe("themeCookie", () => {
  it("stores the theme site-wide for a year", () => {
    const cookie = themeCookie("dark");
    expect(cookie).toMatch(/^theme=dark;/);
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("Max-Age=31536000");
  });
});
