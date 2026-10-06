import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { ScrapedRace } from '../types.ts';

export type SaveResult = {
  created: number;
  /** Still pending, so refreshed with the latest scraped data. */
  updated: number;
  /** Already approved or rejected: left exactly as the reviewer saved it. */
  keptReviewed: number;
};

/** Returns a client using the secret key from scraper/.env, or null if it isn't configured. */
export function connect(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Puts scraped races into the review queue. New events are inserted as `pending`;
 * events still pending are refreshed; reviewed events are never touched.
 */
export async function saveRaces(db: SupabaseClient, races: ScrapedRace[]): Promise<SaveResult> {
  const result: SaveResult = { created: 0, updated: 0, keptReviewed: 0 };
  const sources = [...new Set(races.map((race) => race.source))];

  const { data: existing, error } = await db
    .from('events')
    .select('id, source, external_key, status, city, county_code')
    .in('source', sources);
  if (error) throw new Error(`Loading existing events failed: ${error.message}`);

  const byKey = new Map(existing.map((event) => [`${event.source}|${event.external_key}`, event]));

  for (const race of races) {
    const known = byKey.get(`${race.source}|${race.externalKey}`);
    if (known && known.status !== 'pending') {
      result.keptReviewed++;
      continue;
    }

    let eventId: string;
    if (known) {
      const moved = known.city !== race.city || known.county_code !== race.county;
      // A changed place needs new coordinates; geocoding picks up rows with none.
      const row = moved ? { ...eventRow(race), latitude: null, longitude: null } : eventRow(race);
      await check(db.from('events').update(row).eq('id', known.id));
      await check(db.from('races').delete().eq('event_id', known.id));
      eventId = known.id;
      result.updated++;
    } else {
      const { data, error } = await db.from('events').insert(eventRow(race)).select('id').single();
      if (error) throw new Error(`Inserting "${race.name}" failed: ${error.message}`);
      eventId = data.id;
      result.created++;
    }
    await check(db.from('races').insert(raceRows(race, eventId)));
  }

  return result;
}

function eventRow(race: ScrapedRace) {
  return {
    name: race.name,
    start_date: race.startDate,
    end_date: race.endDate,
    start_time: race.startTime,
    city: race.city,
    county_code: race.county,
    is_virtual: race.isVirtual,
    website_url: race.websiteUrl,
    source: race.source,
    source_url: race.sourceUrl,
    external_key: race.externalKey,
    review_note: race.warnings.join(' ') || null,
  };
}

function raceRows(race: ScrapedRace, eventId: string) {
  // Every event needs at least one race so it can be found by sport; "?" marks unknown distances.
  const distances = race.distances.length > 0 ? race.distances : [{ label: '?', km: null }];
  return distances.map((distance, index) => ({
    event_id: eventId,
    sport_slug: race.sport,
    label: distance.label,
    distance_km: distance.km,
    sort_order: index,
  }));
}

async function check(query: PromiseLike<{ error: { message: string } | null }>): Promise<void> {
  const { error } = await query;
  if (error) throw new Error(error.message);
}
