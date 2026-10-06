import { describe, expect, it } from "vitest";
import { matchesSearch, summarizeCounties } from "./counties";

describe("matchesSearch", () => {
  it("matches anywhere in the name, ignoring case", () => {
    expect(matchesSearch("Bistrița-Năsăud", "NĂS")).toBe(true);
    expect(matchesSearch("Cluj", "lu")).toBe(true);
  });

  it("ignores diacritics in both the name and the query", () => {
    expect(matchesSearch("Brașov", "brasov")).toBe(true);
    expect(matchesSearch("Iasi", "iași")).toBe(true);
    expect(matchesSearch("Timiș", "timis")).toBe(true);
  });

  it("matches everything for an empty or blank query", () => {
    expect(matchesSearch("Alba", "")).toBe(true);
    expect(matchesSearch("Alba", "   ")).toBe(true);
  });

  it("rejects names that don't contain the query", () => {
    expect(matchesSearch("Cluj", "bra")).toBe(false);
  });
});

describe("summarizeCounties", () => {
  it("shows nothing when no county is selected", () => {
    expect(summarizeCounties([])).toEqual({ shown: [], more: 0 });
  });

  it("shows up to two names in full", () => {
    expect(summarizeCounties(["Cluj", "Brașov"])).toEqual({ shown: ["Cluj", "Brașov"], more: 0 });
  });

  it("counts the rest", () => {
    expect(summarizeCounties(["Cluj", "Brașov", "Sibiu", "Alba"])).toEqual({
      shown: ["Cluj", "Brașov"],
      more: 2,
    });
  });
});
