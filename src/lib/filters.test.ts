import { afterEach, describe, expect, it, vi } from "vitest";
import { filtersQuery, hasFilters, parseFilters, today } from "./filters";

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
      counties: ["CJ"],
      distance: "long",
      from: "2027-04-01",
      to: "2027-04-30",
    });
  });

  it("returns no filters for an empty URL", () => {
    expect(parseFilters({})).toEqual({ counties: [] });
    expect(hasFilters(parseFilters({}))).toBe(false);
  });

  it("ignores empty values, like an unselected dropdown", () => {
    expect(parseFilters({ sport: "", county: "  " })).toEqual({ counties: [] });
  });

  it("uses the first value when a single-value key is repeated", () => {
    expect(parseFilters({ sport: ["cycling", "running"] }).sport).toBe("cycling");
  });

  it("drops unknown distance buckets and malformed dates", () => {
    const filters = parseFilters({ distance: "marathon", from: "1 aprilie", to: "2027-4-1" });
    expect(filters.distance).toBeUndefined();
    expect(filters.from).toBeUndefined();
    expect(filters.to).toBeUndefined();
  });

  describe("counties", () => {
    it("reads several counties from repeated keys, as checkboxes submit them", () => {
      expect(parseFilters({ county: ["CJ", "BV", "B"] }).counties).toEqual(["CJ", "BV", "B"]);
    });

    it("reads a comma-separated list", () => {
      expect(parseFilters({ county: "CJ,BV" }).counties).toEqual(["CJ", "BV"]);
    });

    it("normalises case and spaces, and removes duplicates", () => {
      expect(parseFilters({ county: ["cj", " BV ", "CJ"] }).counties).toEqual(["CJ", "BV"]);
    });

    it("drops values that aren't county codes", () => {
      expect(parseFilters({ county: ["CJ", "Cluj", "123", ""] }).counties).toEqual(["CJ"]);
    });
  });
});

describe("filtersQuery", () => {
  function formData(entries: [string, string][]): FormData {
    const data = new FormData();
    for (const [key, value] of entries) data.append(key, value);
    return data;
  }

  it("keeps filled-in fields and repeated counties", () => {
    expect(
      filtersQuery(formData([["sport", "running"], ["county", "CJ"], ["county", "BV"]])),
    ).toBe("sport=running&county=CJ&county=BV");
  });

  it("leaves out empty fields", () => {
    expect(filtersQuery(formData([["sport", ""], ["distance", " "], ["from", "2027-04-01"]]))).toBe(
      "from=2027-04-01",
    );
  });

  it("is empty when nothing is set", () => {
    expect(filtersQuery(formData([["sport", ""]]))).toBe("");
  });

  it("round-trips through parseFilters", () => {
    const query = filtersQuery(formData([["county", "CJ"], ["county", "B"], ["distance", "long"]]));
    const params = new URLSearchParams(query);
    expect(parseFilters({ county: params.getAll("county"), distance: params.get("distance")! })).toEqual(
      { counties: ["CJ", "B"], distance: "long" },
    );
  });
});

describe("hasFilters", () => {
  it("is true when any filter is set", () => {
    expect(hasFilters({ counties: [], sport: "running" })).toBe(true);
  });

  it("is true when only counties are selected", () => {
    expect(hasFilters({ counties: ["CJ"] })).toBe(true);
  });

  it("is false with no counties and nothing else", () => {
    expect(hasFilters({ counties: [] })).toBe(false);
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
