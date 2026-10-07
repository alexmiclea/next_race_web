/**
 * Step 3 of writing race descriptions: checks the drafts Claude wrote in
 * output/descriptions/drafts.json against the saved pages, and saves those that pass.
 * Usage: npm run describe:apply
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DESCRIPTIONS_DIR } from './describe-paths.ts';
import { descriptionProblems, parseDrafts, type TodoItem } from './lib/describe.ts';
import { connect } from './lib/supabase.ts';

const db = connect();
if (!db) throw new Error('Set SUPABASE_URL and SUPABASE_SECRET_KEY in scraper/.env');

const todo: TodoItem[] = JSON.parse(await readFile(join(DESCRIPTIONS_DIR, 'todo.json'), 'utf8'));
const drafts = parseDrafts(await readFile(join(DESCRIPTIONS_DIR, 'drafts.json'), 'utf8'));
const todoById = new Map(todo.map((item) => [item.id, item]));

const summary = { saved: 0, noFacts: 0, rejected: 0 };
for (const draft of drafts) {
  const item = todoById.get(draft.id);
  if (!item) throw new Error(`Draft for unknown race id ${draft.id} (not in todo.json)`);
  if (!draft.description) {
    console.log(`none    ${item.name}: ${draft.note ?? 'not enough facts on the page'}`);
    summary.noFacts++;
    continue;
  }

  const page = await readFile(join(DESCRIPTIONS_DIR, 'pages', item.pageFile), 'utf8');
  const problems = descriptionProblems(draft.description, draft.evidence, page);
  if (problems.length > 0) {
    console.log(`REJECT  ${item.name}: ${problems.join('; ')}`);
    summary.rejected++;
    continue;
  }

  const { error } = await db
    .from('events')
    .update({
      description: draft.description,
      description_evidence: draft.evidence,
      description_source_url: item.url,
      description_generated_at: new Date().toISOString(),
    })
    .eq('id', item.id);
  if (error) throw new Error(`Saving "${item.name}" failed: ${error.message}`);
  console.log(`saved   ${item.name}: ${draft.description}`);
  summary.saved++;
}

const missing = todo.length - drafts.length;
console.log(
  `\nDone: ${summary.saved} saved, ${summary.noFacts} without enough facts, ` +
    `${summary.rejected} rejected by the checks` +
    (missing > 0 ? `, ${missing} races in todo.json have no draft yet.` : '.'),
);
