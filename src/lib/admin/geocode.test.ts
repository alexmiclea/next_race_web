import { describe, expect, it } from "vitest";
import { nominatimUrl, parseNominatim, placeQueries } from "./geocode";

describe("placeQueries", () => {
  it("tries city with county first, then the city alone", () => {
    expect(placeQueries("Cheia", "Cluj")).toEqual(["Cheia, Cluj", "Cheia"]);
  });

  it("doesn't repeat a county named like the city", () => {
    expect(placeQueries("București", "București")).toEqual(["București"]);
  });

  it("uses the city alone when there's no county, and nothing without a city", () => {
    expect(placeQueries("Oradea", null)).toEqual(["Oradea"]);
    expect(placeQueries(null, "Cluj")).toEqual([]);
    expect(placeQueries("  ", null)).toEqual([]);
  });
});

describe("nominatimUrl", () => {
  it("searches Romania only, one result, JSON", () => {
    const url = new URL(nominatimUrl("Cheia, Cluj"));
    expect(url.origin + url.pathname).toBe("https://nominatim.openstreetmap.org/search");
    expect(url.searchParams.get("q")).toBe("Cheia, Cluj");
    expect(url.searchParams.get("countrycodes")).toBe("ro");
    expect(url.searchParams.get("limit")).toBe("1");
  });
});

describe("parseNominatim", () => {
  it("reads the first hit", () => {
    expect(parseNominatim([{ lat: "46.55", lon: "23.69" }])).toEqual({
      latitude: 46.55,
      longitude: 23.69,
    });
  });

  it("returns null for no hits or junk", () => {
    expect(parseNominatim([])).toBeNull();
    expect(parseNominatim({ error: "x" })).toBeNull();
    expect(parseNominatim([{ lat: "x", lon: "y" }])).toBeNull();
  });
});
