/**
 * Step 1 of writing race descriptions: downloads each organizer page that still needs
 * a description into output/descriptions/. Claude then writes the descriptions in a
 * Claude Code session (see CLAUDE.md), and describe:apply checks and saves them.
 * Usage: npm run describe:prepare            (races without a description)
 *        npm run describe:prepare -- --force (all races, e.g. to rewrite them)
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DESCRIPTIONS_DIR } from './describe-paths.ts';
import { descriptionSourceUrl, pageText, skipReason, type TodoItem } from './lib/describe.ts';
import { fetchPage } from './lib/fetch.ts';
import { connect } from './lib/supabase.ts';

const force = process.argv.includes('--force');
const db = connect();
if (!db) throw new Error('Set SUPABASE_URL and SUPABASE_SECRET_KEY in scraper/.env');

let query = db
  .from('events')
  .select('id, name, city, website_url, description_source_url, races(label)')
  .neq('status', 'rejected')
  .or('website_url.not.is.null,description_source_url.not.is.null')
  .order('start_date');
if (!force) query = query.is('description', null);

const { data: events, error } = await query.returns<
  {
    id: string;
    name: string;
    city: string | null;
    website_url: string | null;
    description_source_url: string | null;
    races: { label: string }[];
  }[]
>();
if (error) throw new Error(`Loading events failed: ${error.message}`);

// Start clean, so no stale page or draft from an earlier round is used.
await rm(DESCRIPTIONS_DIR, { recursive: true, force: true });
await mkdir(join(DESCRIPTIONS_DIR, 'pages'), { recursive: true });

const todo: TodoItem[] = [];
let skipped = 0;
for (const event of events) {
  const url = descriptionSourceUrl(event)!;
  const label = `${event.name} (${url})`;
  let reason = skipReason(url);
  let page: { text: string; truncated: boolean } | undefined;
  if (!reason) {
    try {
      page = pageText(await fetchPage(url));
      reason = skipReason(url, page);
    } catch (fetchError) {
      reason = (fetchError as Error).message;
    }
  }
  if (reason || !page) {
    console.log(`skip  ${label}: ${reason}`);
    skipped++;
    continue;
  }

  const pageFile = `${event.id}.txt`;
  await writeFile(join(DESCRIPTIONS_DIR, 'pages', pageFile), page.text);
  todo.push({
    id: event.id,
    name: event.name,
    city: event.city,
    distances: event.races.map((race) => race.label),
    url,
    pageFile,
    truncated: page.truncated,
  });
  console.log(`ready ${label}${page.truncated ? ' (long page, first part kept)' : ''}`);
}

await writeFile(join(DESCRIPTIONS_DIR, 'todo.json'), JSON.stringify(todo, null, 2) + '\n');
console.log(`\n${todo.length} pages ready, ${skipped} skipped. Folder: ${DESCRIPTIONS_DIR}`);
console.log('Next: ask Claude Code to write the descriptions, then run npm run describe:apply.');
