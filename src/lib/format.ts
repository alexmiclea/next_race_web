import { getFormatter } from "next-intl/server";
import type { Event } from "@/lib/events";

type Formatter = Awaited<ReturnType<typeof getFormatter>>;

/** Dates are stored as YYYY-MM-DD; noon UTC keeps them on the same day in Romania. */
export function parseDate(date: string): Date {
  return new Date(`${date}T12:00:00Z`);
}

/** "24 aprilie 2027" or "24 – 25 aprilie 2027". */
export function formatEventDates(format: Formatter, event: Event): string {
  const options = { day: "numeric", month: "long", year: "numeric" } as const;
  const start = parseDate(event.start_date);
  return event.start_date === event.end_date
    ? format.dateTime(start, options)
    : format.dateTimeRange(start, parseDate(event.end_date), options);
}
