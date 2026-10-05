/**
 * Parses calendars that list one race per bullet, in Romanian:
 *   • Aprilie 24-25: <strong><a href="…">Alergăraș în Făgăraș</a></strong>, Făgăraș BV – 46km, 20km, kids
 * The race name is the bold or linked text; location and distances are optional.
 */
import * as cheerio from 'cheerio';
import {
  cityFromName,
  countyOfSeat,
  looksLikeDistances,
  normalizeText,
  parseDatePrefix,
  parseDistances,
  parseLocation,
  slugify,
  type DatePrefix,
} from '../lib/parse.ts';
import type { PageContext, ScrapedRace, SourceResult } from '../types.ts';

export function parseBulletList(html: string, context: PageContext): SourceResult {
  const $ = cheerio.load(html);
  const result: SourceResult = { races: [], skipped: [] };
  const seen = new Set<string>();

  $(context.itemSelector).each((_, element) => {
    const paragraph = $(element);
    const text = normalizeText(paragraph.text());
    if (!text.startsWith('•')) return;

    const line = text.slice(1).trim();
    if (/^în fiecare/i.test(line)) {
      result.skipped.push({ reason: 'recurring', text });
      return;
    }
    // "(RM)" marks races in the Republic of Moldova (Republica Moldova); we cover Romania only.
    if (/\(RM\)/.test(line)) {
      result.skipped.push({ reason: 'not-romania', text });
      return;
    }

    const date = parseDatePrefix(line, context.year);
    if (!date) {
      result.skipped.push({ reason: 'unparsed', text });
      return;
    }
    if (date.endDate < context.today) {
      result.skipped.push({ reason: 'past', text });
      return;
    }

    const boldName = normalizeText(
      paragraph.find('strong').first().text() || paragraph.find('a').first().text(),
    );
    const href = paragraph.find('a[href]').first().attr('href') ?? null;
    const race = parseRaceLine({ boldName, href, date, rawText: text, context });
    if (seen.has(race.externalKey)) return;
    seen.add(race.externalKey);
    result.races.push(race);
  });

  return result;
}

function parseRaceLine({
  boldName,
  href,
  date,
  rawText,
  context,
}: {
  /** Text of the bold/linked race name in the paragraph. */
  boldName: string;
  href: string | null;
  date: DatePrefix;
  rawText: string;
  context: PageContext;
}): ScrapedRace {
  const warnings: string[] = [];
  let name = boldName;

  // Split "<name>, <location> – <distances>" using the bold name as the anchor.
  let remainder: string;
  if (name && date.rest.startsWith(name)) {
    remainder = date.rest.slice(name.length).trim();
  } else {
    const split = /^(.*?)(\s+–\s+|,\s+|$)(.*)$/.exec(date.rest)!;
    name = split[1];
    remainder = split[2].trim() === '–' ? `– ${split[3]}` : `, ${split[3]}`;
    warnings.push('Race name not found in bold text; guessed from the line.');
  }

  let locationText: string | null = null;
  let distancesText: string | null = null;
  if (remainder.startsWith('–')) {
    distancesText = remainder.slice(1);
  } else if (remainder.startsWith(',')) {
    const afterComma = remainder.slice(1).trim();
    const dash = afterComma.indexOf(' – ');
    if (dash >= 0) {
      locationText = afterComma.slice(0, dash);
      distancesText = afterComma.slice(dash + 3);
    } else if (looksLikeDistances(afterComma)) {
      distancesText = afterComma;
    } else {
      locationText = afterComma;
    }
  } else if (remainder) {
    warnings.push(`Unexpected text after the name: "${remainder}"`);
  }

  const location = parseLocation(locationText);
  if (!location.city && !location.isVirtual) {
    const city = cityFromName(name);
    if (city) {
      location.city = city;
      location.county = countyOfSeat(city);
      warnings.push(`City inferred from the race name: ${city}.`);
    } else {
      warnings.push('No location given.');
    }
  } else if (location.city && !location.county) {
    warnings.push(`County unknown for "${location.city}".`);
  }

  const distances = parseDistances(distancesText);
  if (distances.length === 0) warnings.push('No distances given.');

  return {
    status: 'pending',
    externalKey: `${slugify(name)}-${date.startDate}`,
    source: new URL(context.url).hostname,
    sourceUrl: context.url,
    sport: context.sport,
    name,
    startDate: date.startDate,
    endDate: date.endDate,
    startTime: date.startTime,
    city: location.city,
    county: location.county,
    isVirtual: location.isVirtual,
    distances,
    websiteUrl: href,
    rawText,
    warnings,
  };
}
