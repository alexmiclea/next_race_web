import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ScrapedRace } from '../types.ts';

const CSV_COLUMNS: [header: string, value: (race: ScrapedRace) => unknown][] = [
  ['status', (r) => r.status],
  ['sport', (r) => r.sport],
  ['name', (r) => r.name],
  ['start_date', (r) => r.startDate],
  ['end_date', (r) => r.endDate],
  ['start_time', (r) => r.startTime],
  ['city', (r) => r.city],
  ['county', (r) => r.county],
  ['is_virtual', (r) => r.isVirtual],
  ['distances', (r) => r.distances.map((d) => d.label).join(' | ')],
  ['website_url', (r) => r.websiteUrl],
  ['warnings', (r) => r.warnings.join(' ')],
  ['raw_text', (r) => r.rawText],
  ['source', (r) => r.source],
  ['source_url', (r) => r.sourceUrl],
  ['external_key', (r) => r.externalKey],
];

/** Writes `<name>.json` and `<name>.csv` (opens in Excel; importable into Supabase). */
export async function writeOutput(dir: string, name: string, races: ScrapedRace[]): Promise<void> {
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, `${name}.json`), JSON.stringify(races, null, 2) + '\n');

  const rows = [
    CSV_COLUMNS.map(([header]) => header),
    ...races.map((race) => CSV_COLUMNS.map(([, value]) => value(race))),
  ];
  // The BOM makes Excel read the file as UTF-8, so Romanian diacritics display correctly.
  const csv = '﻿' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
  await writeFile(join(dir, `${name}.csv`), csv);
}

function csvCell(value: unknown): string {
  const text = value == null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
