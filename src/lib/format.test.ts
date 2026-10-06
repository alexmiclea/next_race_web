import { createFormatter } from "next-intl";
import { describe, expect, it } from "vitest";
import type { Event } from "./events";
import { formatEventDates, parseDate } from "./format";

const format = createFormatter({ locale: "ro", timeZone: "Europe/Bucharest" });

function event(start_date: string, end_date: string): Event {
  return { start_date, end_date } as Event;
}

describe("parseDate", () => {
  it("keeps the calendar day in Romania", () => {
    const date = parseDate("2027-04-24");
    expect(
      new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest" }).format(date),
    ).toBe("2027-04-24");
  });
});

describe("formatEventDates", () => {
  it("formats a one-day event", () => {
    expect(formatEventDates(format, event("2027-04-24", "2027-04-24"))).toBe("24 aprilie 2027");
  });

  it("formats a multi-day event as a range", () => {
    const text = formatEventDates(format, event("2027-04-24", "2027-04-25"));
    expect(text).toMatch(/^24\s*[–-]\s*25 aprilie 2027$/);
  });
});
