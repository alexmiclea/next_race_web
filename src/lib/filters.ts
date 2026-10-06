/** Race filters, read from and written to the URL so filtered views can be shared. */

export const DISTANCE_BUCKETS = {
  short: { min: 0, max: 10 }, // under 10 km (max is exclusive)
  medium: { min: 10, max: 21.2 }, // 10 km up to a half marathon
  long: { min: 21.2, max: 42.3 }, // up to a marathon
  ultra: { min: 42.3, max: null }, // ultramarathon
} as const;

export type DistanceBucket = keyof typeof DISTANCE_BUCKETS;

export type Filters = {
  sport?: string;
  /** County codes (CJ, B…); empty means all counties. */
  counties: string[];
  distance?: DistanceBucket;
  /** YYYY-MM-DD */
  from?: string;
  /** YYYY-MM-DD */
  to?: string;
};

type SearchParams = Record<string, string | string[] | undefined>;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const COUNTY_CODE = /^[A-Z]{1,2}$/;

export function parseFilters(params: SearchParams): Filters {
  const value = (key: string) => {
    const raw = params[key];
    const text = Array.isArray(raw) ? raw[0] : raw;
    return text?.trim() || undefined;
  };
  // Several counties arrive as repeated keys (?county=CJ&county=BV), the way a form
  // submits checkboxes; a comma-separated list (?county=CJ,BV) works too.
  const rawCounties = [params.county ?? []].flat().flatMap((text) => text.split(","));
  const counties = [...new Set(rawCounties.map((code) => code.trim().toUpperCase()))].filter(
    (code) => COUNTY_CODE.test(code),
  );
  const distance = value("distance");
  const from = value("from");
  const to = value("to");
  return {
    sport: value("sport"),
    counties,
    distance: distance && distance in DISTANCE_BUCKETS ? (distance as DistanceBucket) : undefined,
    from: from && DATE.test(from) ? from : undefined,
    to: to && DATE.test(to) ? to : undefined,
  };
}

/**
 * Query string for the filter form's current values, leaving out empty fields so
 * URLs stay short ("sport=running&county=CJ&county=BV").
 */
export function filtersQuery(data: FormData): string {
  const params = new URLSearchParams();
  for (const [key, value] of data) {
    if (typeof value === "string" && value.trim() !== "") params.append(key, value.trim());
  }
  return params.toString();
}

export function hasFilters(filters: Filters): boolean {
  const { counties, ...rest } = filters;
  return counties.length > 0 || Object.values(rest).some(Boolean);
}

/** Today's date in Romanian time, as YYYY-MM-DD. */
export function today(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest" }).format(new Date());
}
