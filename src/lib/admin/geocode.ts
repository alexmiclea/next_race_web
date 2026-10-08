/**
 * Map coordinates for a Romanian place, via OpenStreetMap Nominatim (free; the policy
 * asks to identify the app and keep requests rare, which a few admin saves are).
 * https://operations.osmfoundation.org/policies/nominatim/
 */

export type Point = { latitude: number; longitude: number };

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "Bibday/0.1 (Romanian race calendar; admin edits)";

/** Search texts to try, most precise first: "Cheia, Cluj", then "Cheia". */
export function placeQueries(city: string | null, countyName: string | null): string[] {
  const place = city?.trim();
  if (!place) return [];
  const county = countyName?.trim();
  return county && county !== place ? [`${place}, ${county}`, place] : [place];
}

export function nominatimUrl(query: string): string {
  const url = new URL(NOMINATIM);
  url.search = new URLSearchParams({
    q: query,
    countrycodes: "ro",
    format: "jsonv2",
    limit: "1",
  }).toString();
  return url.toString();
}

/** First hit's coordinates, or null for no (or unusable) result. */
export function parseNominatim(body: unknown): Point | null {
  if (!Array.isArray(body) || body.length === 0) return null;
  const latitude = Number(body[0]?.lat);
  const longitude = Number(body[0]?.lon);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
}

/** Looks the place up; null when it can't be found or the service is unavailable. */
export async function locatePlace(city: string | null, countyName: string | null): Promise<Point | null> {
  for (const query of placeQueries(city, countyName)) {
    try {
      const response = await fetch(nominatimUrl(query), { headers: { "User-Agent": USER_AGENT } });
      if (!response.ok) return null;
      const point = parseNominatim(await response.json());
      if (point) return point;
    } catch {
      return null;
    }
  }
  return null;
}
