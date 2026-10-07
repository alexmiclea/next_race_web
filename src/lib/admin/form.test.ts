import { describe, expect, it } from "vitest";
import { isSafeUrl, parseEventForm, parseKm } from "./form";

const SPORTS = ["running", "cycling", "swimming", "triathlon"];

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

const VALID = {
  name: "Cheile Turzii Race",
  organizer: "",
  start_date: "2027-04-17",
  end_date: "",
  start_time: "09:00",
  city: "Cheia",
  county_code: "CJ",
  website_url: "https://www.cheileturziirace.ro/",
  registration_url: "",
  status: "approved",
  review_note: "",
};

describe("isSafeUrl", () => {
  it("accepts web links only", () => {
    expect(isSafeUrl("https://example.ro/")).toBe(true);
    expect(isSafeUrl("http://example.ro/")).toBe(true);
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("data:text/html,hi")).toBe(false);
    expect(isSafeUrl("example.ro")).toBe(false);
  });
});

describe("parseKm", () => {
  it("reads dots and commas, and empty as no distance", () => {
    expect(parseKm("21.1")).toBe(21.1);
    expect(parseKm("2,5")).toBe(2.5);
    expect(parseKm("")).toBeNull();
    expect(parseKm("abc")).toBeNaN();
    expect(parseKm("-3")).toBeNaN();
  });
});

describe("parseEventForm", () => {
  it("reads a valid form, filling an empty end date with the start date", () => {
    const result = parseEventForm(form(VALID), SPORTS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.event).toMatchObject({
      name: "Cheile Turzii Race",
      organizer: null,
      start_date: "2027-04-17",
      end_date: "2027-04-17",
      start_time: "09:00",
      county_code: "CJ",
      is_virtual: false,
      registration_url: null,
      status: "approved",
    });
  });

  it("reports every problem at once", () => {
    const result = parseEventForm(
      form({
        ...VALID,
        name: " ",
        start_date: "2027-04-17",
        end_date: "2027-04-10",
        start_time: "25:00",
        website_url: "javascript:alert(1)",
        status: "deleted",
      }),
      SPORTS,
    );
    expect(result).toEqual({
      ok: false,
      errors: ["nameRequired", "endBeforeStart", "startTime", "websiteUrl", "status"],
    });
  });

  it("splits race rows into kept, added and removed", () => {
    const result = parseEventForm(
      form({
        ...VALID,
        "race-0-id": "r1",
        "race-0-label": "40km",
        "race-0-sport": "running",
        "race-0-km": "40",
        "race-1-id": "r2",
        "race-1-label": "9km",
        "race-1-sport": "running",
        "race-1-km": "9",
        "race-1-remove": "on",
        "race-2-label": "Kids",
        "race-2-sport": "running",
        "race-2-km": "",
        "race-3-label": "",
        "race-3-sport": "running",
        "race-3-km": "",
      }),
      SPORTS,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.races.keep).toEqual([
      { id: "r1", label: "40km", sport_slug: "running", distance_km: 40, sort_order: 0 },
    ]);
    expect(result.races.add).toEqual([
      { label: "Kids", sport_slug: "running", distance_km: null, sort_order: 1 },
    ]);
    expect(result.races.remove).toEqual(["r2"]);
  });

  it("rejects incomplete race rows and unknown sports", () => {
    const result = parseEventForm(
      form({ ...VALID, "race-0-label": "", "race-0-sport": "chess", "race-0-km": "x" }),
      SPORTS,
    );
    expect(result).toEqual({ ok: false, errors: ["raceLabel", "raceKm", "raceSport"] });
  });

  it("reads the virtual checkbox", () => {
    const result = parseEventForm(form({ ...VALID, is_virtual: "on" }), SPORTS);
    expect(result.ok && result.event.is_virtual).toBe(true);
  });
});
