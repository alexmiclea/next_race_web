/**
 * Adds map coordinates to events that have a city but no coordinates yet.
 * Runs automatically after `npm run scrape`; on its own: npm run geocode
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { geocodeMissing } from './lib/geocode.ts';
import { connect } from './lib/supabase.ts';

export async function runGeocoding(db: SupabaseClient): Promise<void> {
  const result = await geocodeMissing(db);
  console.log(`Geocoding: ${result.located} events located`);
  for (const place of result.notFound) console.log(`  not found: ${place}`);
}

if (import.meta.main) {
  const db = connect();
  if (!db) throw new Error('Set SUPABASE_URL and SUPABASE_SECRET_KEY in scraper/.env');
  await runGeocoding(db);
}
