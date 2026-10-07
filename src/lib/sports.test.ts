import { describe, expect, it } from "vitest";
import {
  eventSportList,
  mainSport,
  markerColorVar,
  sportClass,
  sportColorVar,
  sportStyle,
} from "./sports";

describe("sportStyle", () => {
  it("knows the four styled sports", () => {
    expect(sportStyle("running")).toBe("running");
    expect(sportStyle("swimming")).toBe("swimming");
    expect(sportStyle("cycling")).toBe("cycling");
    expect(sportStyle("triathlon")).toBe("triathlon");
  });

  it("uses the neutral style for sports without a colour yet", () => {
    expect(sportStyle("duathlon")).toBe("other");
    expect(sportClass("duathlon")).toBe("sport-other");
    expect(sportColorVar("duathlon")).toBe("--other");
  });

  it("builds the class and colour variable names", () => {
    expect(sportClass("swimming")).toBe("sport-swimming");
    expect(sportColorVar("cycling")).toBe("--cycling");
  });
});

describe("markerColorVar", () => {
  it("uses the sport's colour when every event at the place has the same sport", () => {
    expect(markerColorVar(["cycling"])).toBe("--cycling");
    expect(markerColorVar(["swimming", "swimming"])).toBe("--swimming");
  });

  it("uses the neutral colour for mixed sports or unknown sports", () => {
    expect(markerColorVar(["running", "triathlon"])).toBe("--other");
    expect(markerColorVar([null])).toBe("--other");
  });
});

describe("mainSport", () => {
  it("is null for an event without races", () => {
    expect(mainSport([])).toBeNull();
  });

  it("picks triathlon whenever it is present", () => {
    expect(mainSport(["swimming", "swimming", "swimming", "triathlon"])).toBe("triathlon");
  });

  it("otherwise picks the sport with the most races", () => {
    expect(mainSport(["running", "cycling", "cycling"])).toBe("cycling");
  });

  it("breaks ties by race order", () => {
    expect(mainSport(["running", "cycling"])).toBe("running");
    expect(mainSport(["cycling", "running"])).toBe("cycling");
  });
});

describe("eventSportList", () => {
  const race = (slug: string, name: string) => ({ sport_slug: slug, sports: { name_ro: name } });

  it("lists each sport once, main sport first", () => {
    expect(
      eventSportList([
        race("swimming", "Înot"),
        race("triathlon", "Triatlon"),
        race("swimming", "Înot"),
      ]),
    ).toEqual([
      { slug: "triathlon", name: "Triatlon" },
      { slug: "swimming", name: "Înot" },
    ]);
  });

  it("keeps race order for the others", () => {
    expect(
      eventSportList([race("running", "Alergare"), race("cycling", "Ciclism")]).map((s) => s.slug),
    ).toEqual(["running", "cycling"]);
  });
});
