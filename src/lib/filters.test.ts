import { afterEach, describe, expect, it, vi } from "vitest";
import { hasFilters, parseFilters, today } from "./filters";

describe("parseFilters", () => {
  it("reads every filter from the URL", () => {
    expect(
      parseFilters({
        sport: "running",
        county: "CJ",
        distance: "long",
        from: "2027-04-01",
        to: "2027-04-30",
      }),
    ).toEqual({
      sport: "running",
      county: "CJ",
      distance: "long",
      from: "2027-04-01",
      to: "2027-04-30",
    });
  });

  it("returns no filters for an empty URL", () => {
    expect(parseFilters({})).toEqual({});
    expect(hasFilters(parseFilters({}))).toBe(false);
  });

  it("ignores empty values, like an unselected dropdown", () => {
    expect(parseFilters({ sport: "", county: "  " })).toEqual({});
  });

  it("uses the first value when a key is repeated", () => {
    expect(parseFilters({ sport: ["cycling", "running"] }).sport).toBe("cycling");
  });

  it("drops unknown distance buckets and malformed dates", () => {
    const filters = parseFilters({ distance: "marathon", from: "1 aprilie", to: "2027-4-1" });
    expect(filters.distance).toBeUndefined();
    expect(filters.from).toBeUndefined();
    expect(filters.to).toBeUndefined();
  });
});

describe("hasFilters", () => {
  it("is true when any filter is set", () => {
    expect(hasFilters({ county: "CJ" })).toBe(true);
  });
});

describe("today", () => {
  afterEach(() => vi.useRealTimers());

  it("uses Romanian time, not UTC", () => {
    // 23:30 UTC on 31 Dec is already 1 Jan in Bucharest (UTC+2).
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-12-31T23:30:00Z"));
    expect(today()).toBe("2027-01-01");
  });
});
