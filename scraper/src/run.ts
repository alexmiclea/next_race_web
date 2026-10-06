/**
 * Scrapes every website in sources.ts into scraper/output/ and, when scraper/.env has
 * Supabase credentials, into the database review queue.
 * Usage: npm run scrape
 */
import { fileURLToPath } from 'node:url';
import { fetchPage } from './lib/fetch.ts';
import { writeOutput } from './lib/output.ts';
import { connect, saveRaces } from './lib/supabase.ts';
import { parseBulletList } from './parsers/bullet-list.ts';
import { SOURCES } from './sources.ts';
import type { PageContext, ParserName, Source, SourceResult } from './types.ts';

const PARSERS: Record<ParserName, (html: string, context: PageContext) => SourceResult> = {
  'bullet-list': parseBulletList,
};

const OUTPUT_DIR = fileURLToPath(new URL('../output', import.meta.url));

/** Today's date in Romanian time, as YYYY-MM-DD. */
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Bucharest' }).format(new Date());
const thisYear = Number(today.slice(0, 4));

const db = connect();
if (!db) console.log('No Supabase credentials in scraper/.env: writing files only.\n');

for (const source of SOURCES) {
  const result = await scrapeSource(source);
  const name = new URL(source.url).hostname;
  await writeOutput(OUTPUT_DIR, name, result.races);
  report(name, result);
  if (db) {
    const saved = await saveRaces(db, result.races);
    console.log(
      `  Supabase: ${saved.created} new, ${saved.updated} refreshed (still pending), ` +
        `${saved.keptReviewed} already reviewed (left unchanged)`,
    );
  }
}
console.log(`Output: ${OUTPUT_DIR}`);

async function scrapeSource(source: Source): Promise<SourceResult> {
  // A `{year}` URL is one page per year: scrape this year's and next year's.
  const years = source.url.includes('{year}') ? [thisYear, thisYear + 1] : [thisYear];
  const result: SourceResult = { races: [], skipped: [] };
  for (const year of years) {
    const url = source.url.replace('{year}', String(year));
    const page = PARSERS[source.parser](await fetchPage(url), {
      url,
      year,
      today,
      sport: source.sport,
      itemSelector: source.itemSelector ?? 'p',
    });
    result.races.push(...page.races);
    result.skipped.push(...page.skipped);
  }
  return result;
}

function report(name: string, result: SourceResult): void {
  const withWarnings = result.races.filter((race) => race.warnings.length > 0);
  const skippedByReason = Object.groupBy(result.skipped, (skip) => skip.reason);

  console.log(`${name}: ${result.races.length} upcoming races`);
  console.log(`  needing a closer look (warnings): ${withWarnings.length}`);
  for (const [reason, skips] of Object.entries(skippedByReason)) {
    console.log(`  skipped, ${reason}: ${skips!.length}`);
  }
  for (const skip of skippedByReason.unparsed ?? []) {
    console.log(`    could not parse: ${skip.text}`);
  }
}
