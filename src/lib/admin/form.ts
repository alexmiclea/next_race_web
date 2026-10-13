/**
 * Reads and checks the admin "edit race" form. Pure functions (no database), so every
 * rule can be unit-tested; the server action only saves what passes.
 */

export type EventFields = {
  name: string;
  organizer: string | null;
  start_date: string;
  end_date: string;
  start_time: string | null;
  city: string | null;
  county_code: string | null;
  is_virtual: boolean;
  website_url: string | null;
  registration_url: string | null;
  status: "pending" | "approved" | "rejected";
  review_note: string | null;
};

export type RaceRow = {
  /** Present for an existing race, absent for a new one. */
  id?: string;
  label: string;
  sport_slug: string;
  distance_km: number | null;
  sort_order: number;
};

export type ParsedEventForm =
  | { ok: true; event: EventFields; races: { keep: RaceRow[]; add: RaceRow[]; remove: string[] } }
  | { ok: false; errors: string[] };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const STATUSES = ["pending", "approved", "rejected"] as const;

function text(data: FormData, key: string): string {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optional(data: FormData, key: string): string | null {
  return text(data, key) || null;
}

/** Only http(s) links: a "javascript:" link on a public page would be a security hole. */
export function isSafeUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** "21", "21.1" or "21,1" km → number; empty → null; anything else → NaN. */
export function parseKm(value: string): number | null {
  if (value === "") return null;
  const km = Number(value.replace(",", "."));
  return Number.isFinite(km) && km >= 0 ? km : Number.NaN;
}

/**
 * Error codes (keys in the "Admin.errors" messages), so the page can show them in the
 * visitor's language.
 */
export function parseEventForm(data: FormData, sportSlugs: string[]): ParsedEventForm {
  const errors: string[] = [];

  const name = text(data, "name");
  if (!name) errors.push("nameRequired");

  const start = text(data, "start_date");
  const end = text(data, "end_date") || start;
  if (!DATE.test(start)) errors.push("startDate");
  if (!DATE.test(end)) errors.push("endDate");
  else if (DATE.test(start) && end < start) errors.push("endBeforeStart");

  const time = optional(data, "start_time");
  if (time && !TIME.test(time)) errors.push("startTime");

  const county = optional(data, "county_code");
  if (county && !/^[A-Z]{1,2}$/.test(county)) errors.push("county");

  const website = optional(data, "website_url");
  const registration = optional(data, "registration_url");
  if (website && !isSafeUrl(website)) errors.push("websiteUrl");
  if (registration && !isSafeUrl(registration)) errors.push("registrationUrl");

  const status = text(data, "status");
  if (!(STATUSES as readonly string[]).includes(status)) errors.push("status");

  // Race rows are numbered race-0-…, race-1-…; empty new rows are ignored.
  const keep: RaceRow[] = [];
  const add: RaceRow[] = [];
  const remove: string[] = [];
  const rowIndexes = new Set(
    [...data.keys()].flatMap((key) => /^race-(\d+)-/.exec(key)?.[1] ?? []).map(Number),
  );
  for (const index of [...rowIndexes].sort((a, b) => a - b)) {
    const field = (name: string) => text(data, `race-${index}-${name}`);
    const id = field("id") || undefined;
    if (id && data.get(`race-${index}-remove`)) {
      remove.push(id);
      continue;
    }
    const label = field("label");
    const km = parseKm(field("km"));
    if (!id && !label && km === null) continue; // untouched empty row
    if (!label) errors.push("raceLabel");
    if (Number.isNaN(km)) errors.push("raceKm");
    const sport = field("sport");
    if (!sportSlugs.includes(sport)) errors.push("raceSport");
    const row: RaceRow = {
      ...(id ? { id } : {}),
      label,
      sport_slug: sport,
      distance_km: Number.isNaN(km) ? null : km,
      sort_order: keep.length + add.length,
    };
    (id ? keep : add).push(row);
  }

  if (errors.length > 0) return { ok: false, errors: [...new Set(errors)] };
  return {
    ok: true,
    event: {
      name,
      organizer: optional(data, "organizer"),
      start_date: start,
      end_date: end,
      start_time: time,
      city: optional(data, "city"),
      county_code: county,
      is_virtual: data.get("is_virtual") === "on",
      website_url: website,
      registration_url: registration,
      status: status as EventFields["status"],
      review_note: optional(data, "review_note"),
    },
    races: { keep, add, remove },
  };
}
