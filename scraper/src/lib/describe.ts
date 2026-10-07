import * as cheerio from 'cheerio';

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

/** Pages with less visible text than this are probably built with JavaScript. */
export const MIN_PAGE_CHARS = 200;

/** Why an organizer page can't be used for a description, or null if it can. */
export function skipReason(url: string, page?: { text: string }): string | null {
  // Facebook pages need a login to read, so there is nothing to describe from.
  if (/(^|\.)(facebook|fb)\.com$/i.test(new URL(url).hostname)) return 'Facebook page';
  if (page && page.text.length < MIN_PAGE_CHARS) {
    return 'page has almost no text (probably built with JavaScript)';
  }
  return null;
}

/** One race waiting for a description, as written to todo.json by describe:prepare. */
export type TodoItem = {
  id: string;
  name: string;
  city: string | null;
  distances: string[];
  url: string;
  /** File in the pages/ folder holding the page text. */
  pageFile: string;
  truncated: boolean;
};

/** A description written in a Claude Code session, as read from drafts.json. */
export type Draft = {
  id: string;
  /** Null when the page doesn't hold enough facts about the race. */
  description: string | null;
  /** Short verbatim quotes from the page, one or more per fact used. */
  evidence: string[];
  note?: string;
};

/**
 * Reads drafts.json, checking its shape so a typo is reported instead of saving
 * something half-filled. Throws with every problem found.
 */
export function parseDrafts(json: string): Draft[] {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch (error) {
    throw new Error(`drafts.json is not valid JSON: ${(error as Error).message}`);
  }
  if (!Array.isArray(data)) throw new Error('drafts.json must be a list of drafts');

  const problems: string[] = [];
  const drafts = data.flatMap((item: unknown, index): Draft[] => {
    const at = `draft ${index + 1}`;
    if (typeof item !== 'object' || item === null) {
      problems.push(`${at}: not an object`);
      return [];
    }
    const { id, description, evidence, note } = item as Record<string, unknown>;
    if (typeof id !== 'string' || id === '') problems.push(`${at}: missing "id"`);
    if (description !== null && typeof description !== 'string') {
      problems.push(`${at}: "description" must be text or null`);
    }
    if (!Array.isArray(evidence) || !evidence.every((quote) => typeof quote === 'string')) {
      problems.push(`${at}: "evidence" must be a list of quotes`);
    }
    if (note !== undefined && typeof note !== 'string') problems.push(`${at}: "note" must be text`);
    return [{ id, description, evidence, note } as Draft];
  });
  if (problems.length > 0) throw new Error(`drafts.json has problems:\n${problems.join('\n')}`);
  return drafts;
}
