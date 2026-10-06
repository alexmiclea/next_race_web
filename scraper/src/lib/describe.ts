import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import * as cheerio from 'cheerio';
import { z } from 'zod';

/** Enough for a race website's main page; longer pages are cut (and reported). */
export const MAX_PAGE_CHARS = 40_000;

/** Visible text of a web page, without scripts, styles, navigation and footers. */
export function pageText(html: string): { text: string; truncated: boolean } {
  const $ = cheerio.load(html);
  $('script, style, noscript, svg, iframe, nav, footer, form, template').remove();
  const root = $('main').length ? $('main') : $('body');
  // Block elements end a line, so words from neighbouring blocks don't merge.
  root.find('p, div, li, h1, h2, h3, h4, h5, h6, br, td, section, article').after('\n');
  const text = root
    .text()
    .replace(/[ \t ]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
  return text.length > MAX_PAGE_CHARS
    ? { text: text.slice(0, MAX_PAGE_CHARS), truncated: true }
    : { text, truncated: false };
}

/** Lowercase, single spaces, one form of each Romanian letter and quote mark. */
export function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/ş/g, 'ș')
    .replace(/ţ/g, 'ț')
    .replace(/[„“”"«»]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Evidence quotes that do NOT appear word for word in the page text. */
export function missingEvidence(evidence: string[], page: string): string[] {
  const haystack = normalizeForMatch(page);
  return evidence.filter((quote) => !haystack.includes(normalizeForMatch(quote)));
}

/**
 * Rules the description must meet beyond the model's own instructions. Returns the
 * problems found (empty when it passes).
 */
export function descriptionProblems(description: string, evidence: string[], page: string): string[] {
  const problems: string[] = [];
  if (description.length < 60) problems.push('too short');
  if (description.length > 700) problems.push('too long');
  // Dates and prices change between editions; the site shows dates from our own data.
  if (/\b20\d\d\b/.test(description)) problems.push('mentions a year');
  if (/\b(lei|ron|euro|eur)\b|€/i.test(description)) problems.push('mentions a price');
  if (evidence.length === 0) problems.push('no evidence quotes');
  const missing = missingEvidence(evidence, page);
  if (missing.length > 0) problems.push(`evidence not found on the page: ${missing.map((q) => `"${q}"`).join(', ')}`);
  return problems;
}

const DescriptionSchema = z.object({
  /** Null when the page doesn't contain enough facts about this race. */
  description: z.string().nullable(),
  /** Short verbatim quotes from the page, one or more per fact used. */
  evidence: z.array(z.string()),
  /** Why the description is null, or anything the reviewer should know. */
  note: z.string(),
});

export type DescriptionResult = z.infer<typeof DescriptionSchema>;

const SYSTEM_PROMPT = `You write short factual descriptions of endurance races (running, cycling, swimming, triathlon) for a Romanian race calendar website.

You receive the visible text of the organizer's web page. Write 2-3 sentences in Romanian describing the race using ONLY facts stated explicitly in that text: for example the type of course (road, trail, mountain), the landscape or places the route passes through, where it starts, elevation gain, what makes it distinctive, or who organizes it.

Strict rules:
- Use only information written in the page text. Do not add anything from general knowledge, do not infer, do not guess, and do not embellish. If a fact is not on the page, leave it out.
- Do not mention dates, years, prices, fees, registration deadlines or prize money: they change between editions and the website shows dates separately.
- Do not list the distances; the website already shows them.
- Write in your own words in plain, neutral Romanian. Do not copy sentences from the page, and avoid marketing superlatives.
- For every fact you use, include in "evidence" a short quote (a few words up to one sentence) copied exactly, character for character, from the page text that supports it. These quotes are checked automatically against the page.
- If the page is about a different event, is mostly unrelated content (cookie notices, a login page, a generic organizer homepage), or does not contain at least two concrete facts about this race, set "description" to null, leave "evidence" empty, and explain why in "note".`;

/** Asks Claude for a fact-only description of one race, based on its web page text. */
export async function describeRace(
  client: Anthropic,
  race: { name: string; city: string | null; distances: string[] },
  page: string,
): Promise<DescriptionResult | null> {
  const response = await client.messages.parse({
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    output_config: { effort: 'medium', format: zodOutputFormat(DescriptionSchema) },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          `Race name: ${race.name}`,
          `Place (from our calendar): ${race.city ?? 'unknown'}`,
          `Distances (from our calendar): ${race.distances.join(', ') || 'unknown'}`,
          '',
          '<page_text>',
          page,
          '</page_text>',
        ].join('\n'),
      },
    ],
  });
  // A declined request has no usable output; the race simply gets no description.
  if (response.stop_reason === 'refusal') return null;
  return response.parsed_output;
}
