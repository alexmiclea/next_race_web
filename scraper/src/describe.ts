/**
 * Writes short, fact-only descriptions for races from their organizer's website.
 * Usage: npm run describe            (races without a description)
 *        npm run describe -- --force (rewrite all, e.g. after changing the prompt)
 *
 * Needs ANTHROPIC_API_KEY plus the Supabase credentials in scraper/.env. Each call
 * costs a few cents; descriptions that fail the evidence checks are not saved.
 */
import Anthropic from '@anthropic-ai/sdk';
import { describeRace, descriptionProblems, pageText } from './lib/describe.ts';
import { fetchPage } from './lib/fetch.ts';
import { connect } from './lib/supabase.ts';

const force = process.argv.includes('--force');

const db = connect();
if (!db) throw new Error('Set SUPABASE_URL and SUPABASE_SECRET_KEY in scraper/.env');
const claude = new Anthropic();

let query = db
  .from('events')
  .select('id, name, city, website_url, races(label)')
  .neq('status', 'rejected')
  .not('website_url', 'is', null)
  .order('start_date');
if (!force) query = query.is('description', null);

const { data: events, error } = await query.returns<
  { id: string; name: string; city: string | null; website_url: string; races: { label: string }[] }[]
>();
if (error) throw new Error(`Loading events failed: ${error.message}`);

const summary = { saved: 0, noFacts: 0, failedChecks: 0, skipped: 0 };

for (const event of events) {
  const label = `${event.name} (${event.website_url})`;
  // Facebook pages need a login to read, so there is nothing to describe from.
  if (/facebook\.com|fb\.com/i.test(event.website_url)) {
    console.log(`skip    ${label}: Facebook page`);
    summary.skipped++;
    continue;
  }

  let page: { text: string; truncated: boolean };
  try {
    page = pageText(await fetchPage(event.website_url));
  } catch (fetchError) {
    console.log(`skip    ${label}: ${(fetchError as Error).message}`);
    summary.skipped++;
    continue;
  }
  if (page.text.length < 200) {
    console.log(`skip    ${label}: page has almost no text (probably built with JavaScript)`);
    summary.skipped++;
    continue;
  }
  if (page.truncated) console.log(`note    ${label}: long page, only the first part was used`);

  const result = await describeRace(
    claude,
    { name: event.name, city: event.city, distances: event.races.map((race) => race.label) },
    page.text,
  );
  if (!result?.description) {
    console.log(`none    ${label}: ${result?.note ?? 'request declined'}`);
    summary.noFacts++;
    continue;
  }

  const problems = descriptionProblems(result.description, result.evidence, page.text);
  if (problems.length > 0) {
    console.log(`REJECT  ${label}: ${problems.join('; ')}`);
    summary.failedChecks++;
    continue;
  }

  const { error: saveError } = await db
    .from('events')
    .update({
      description: result.description,
      description_evidence: result.evidence,
      description_source_url: event.website_url,
      description_generated_at: new Date().toISOString(),
    })
    .eq('id', event.id);
  if (saveError) throw new Error(`Saving "${event.name}" failed: ${saveError.message}`);
  console.log(`saved   ${event.name}: ${result.description}`);
  summary.saved++;
}

console.log(
  `\nDone: ${summary.saved} saved, ${summary.noFacts} without enough facts, ` +
    `${summary.failedChecks} rejected by the evidence checks, ${summary.skipped} skipped.`,
);
