import { createClient } from "@/lib/supabase/server";
import { DISTANCE_BUCKETS, listStart, today, type Filters } from "@/lib/filters";
import { eventLookup } from "@/lib/paths";

export type Race = {
  id: string;
  label: string;
  distance_km: number | null;
  sort_order: number;
  sport_slug: string;
  sports: { name_ro: string };
};

export type Event = {
  id: string;
  /** Permanent readable URL part, e.g. "bucharest-marathon-2026" (set by the database). */
  slug: string;
  name: string;
  organizer: string | null;
  start_date: string;
  end_date: string;
  start_time: string | null;
  city: string | null;
  county_code: string | null;
  is_virtual: boolean;
  latitude: number | null;
  longitude: number | null;
  website_url: string | null;
  registration_url: string | null;
  source_url: string | null;
  /** Short fact-only summary written by Claude from the organizer's page (see CLAUDE.md, "Writing race descriptions"). */
  description: string | null;
  description_source_url: string | null;
  counties: { name: string } | null;
  races: Race[];
};

export type Sport = { slug: string; name_ro: string };
export type County = { code: string; name: string };

const EVENT_FIELDS = `
  id, slug, name, organizer, start_date, end_date, start_time, city, county_code, is_virtual,
  latitude, longitude, website_url, registration_url, source_url,
  description, description_source_url,
  counties(name),
  races(id, label, distance_km, sort_order, sport_slug, sports(name_ro))
`;

/**
 * Approved events matching the filters, in date order. Starts today unless the "De la"
 * filter reaches back into past races (see listStart). Row-level security already
 * hides events that aren't approved.
 */
export async function getEvents(
  filters: Filters,
  { allowPast = true }: { allowPast?: boolean } = {},
): Promise<Event[]> {
  const supabase = await createClient();

  // `match` is a second, inner-joined copy of races used only for filtering, so an event
  // is kept when at least one of its races fits, while `races` still lists all of them.
  let query = supabase
    .from("events")
    .select(`${EVENT_FIELDS}, match:races!inner(sport_slug, distance_km)`)
    .gte("end_date", listStart(filters, today(), { allowPast }))
    .order("start_date")
    .order("name");

  if (filters.to) query = query.lte("start_date", filters.to);
  if (filters.counties.length > 0) query = query.in("county_code", filters.counties);
  if (filters.hideVirtual) query = query.eq("is_virtual", false);
  if (filters.sport) query = query.eq("match.sport_slug", filters.sport);
  if (filters.distance) {
    const { min, max } = DISTANCE_BUCKETS[filters.distance];
    query = query.gte("match.distance_km", min);
    if (max !== null) query = query.lt("match.distance_km", max);
  }

  const { data, error } = await query.returns<Event[]>();
  if (error) throw new Error(`Loading events failed: ${error.message}`);
  return data.map(sortRaces);
}

/** Approved events with the given ids (e.g. favourites), past and upcoming, in date order. */
export async function getEventsByIds(ids: string[]): Promise<Event[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_FIELDS)
    .in("id", ids)
    .order("start_date")
    .order("name")
    .returns<Event[]>();
  if (error) throw new Error(`Loading events failed: ${error.message}`);
  return data.map(sortRaces);
}

/** How many of the given ids are upcoming approved events (the header's favourites count). */
export async function countUpcoming(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .in("id", ids)
    .gte("end_date", today());
  if (error) throw new Error(`Counting events failed: ${error.message}`);
  return count ?? 0;
}

/**
 * One approved event by its slug (or, for old links, its id), or null if it doesn't
 * exist or isn't public.
 */
export async function getEvent(slugOrId: string): Promise<Event | null> {
  const { column, value } = eventLookup(slugOrId);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_FIELDS)
    .eq(column, value)
    .maybeSingle()
    .returns<Event | null>();
  if (error) throw new Error(`Loading event failed: ${error.message}`);
  return data && sortRaces(data);
}

export async function getFilterOptions(): Promise<{ sports: Sport[]; counties: County[] }> {
  const supabase = await createClient();
  const [sports, counties] = await Promise.all([
    supabase.from("sports").select("slug, name_ro").order("sort_order").returns<Sport[]>(),
    supabase.from("counties").select("code, name").order("name").returns<County[]>(),
  ]);
  if (sports.error) throw new Error(`Loading sports failed: ${sports.error.message}`);
  if (counties.error) throw new Error(`Loading counties failed: ${counties.error.message}`);
  return { sports: sports.data, counties: counties.data };
}

function sortRaces(event: Event): Event {
  return { ...event, races: [...event.races].sort((a, b) => a.sort_order - b.sort_order) };
}

/** Sport names of an event, without duplicates, in race order. */
export function eventSports(event: Event): string[] {
  return [...new Set(event.races.map((race) => race.sports.name_ro))];
}

/** "Făgăraș, Brașov" ("București" alone, not twice), or null for virtual events / unknown places. */
export function eventPlace(event: Event): string | null {
  const county = event.counties?.name;
  const parts = county === event.city ? [event.city] : [event.city, county];
  return parts.filter(Boolean).join(", ") || null;
}
