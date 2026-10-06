import type { SupabaseClient } from '@supabase/supabase-js';

// OpenStreetMap Nominatim. Usage policy: max 1 request/second, identify the app, cache results.
// https://operations.osmfoundation.org/policies/nominatim/
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'NextRaceScraper/0.1 (Romanian race calendar)';
const DELAY_MS = 1100;

type Point = { latitude: number; longitude: number };

export type GeocodeResult = { located: number; notFound: string[] };

/** Fills in latitude/longitude for every event that has a city but no coordinates yet. */
export async function geocodeMissing(db: SupabaseClient): Promise<GeocodeResult> {
  const { data: events, error } = await db
    .from('events')
    .select('id, name, city, counties(name)')
    .is('latitude', null)
    .not('city', 'is', null)
    .returns<{ id: string; name: string; city: string; counties: { name: string } | null }[]>();
  if (error) throw new Error(`Loading events to geocode failed: ${error.message}`);

  const result: GeocodeResult = { located: 0, notFound: [] };
  const cache = new Map<string, Point | null>();

  for (const event of events) {
    const county = event.counties?.name ?? null;
    const cacheKey = `${event.city}|${county}`;
    if (!cache.has(cacheKey)) cache.set(cacheKey, await locate(event.city, county));
    const point = cache.get(cacheKey);

    if (!point) {
      result.notFound.push(`${event.name} (${[event.city, county].filter(Boolean).join(', ')})`);
      continue;
    }
    const { error: updateError } = await db.from('events').update(point).eq('id', event.id);
    if (updateError) throw new Error(`Saving coordinates failed: ${updateError.message}`);
    result.located++;
  }
  return result;
}

/** Looks up a Romanian place, with the county if known, falling back to the city alone. */
async function locate(city: string, county: string | null): Promise<Point | null> {
  if (county) {
    const point = await search(`${city}, ${county}`);
    if (point) return point;
  }
  return search(city);
}

let lastRequestAt = 0;

async function search(query: string): Promise<Point | null> {
  const wait = lastRequestAt + DELAY_MS - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastRequestAt = Date.now();

  const url = new URL(NOMINATIM);
  url.search = new URLSearchParams({
    q: query,
    countrycodes: 'ro',
    format: 'jsonv2',
    limit: '1',
  }).toString();

  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`Geocoding "${query}" failed: HTTP ${response.status}`);
  const [hit] = (await response.json()) as { lat: string; lon: string }[];
  return hit ? { latitude: Number(hit.lat), longitude: Number(hit.lon) } : null;
}
