import type { Source } from './types.ts';

/**
 * Websites to scrape. Add a site here once its robots.txt and terms are checked
 * and, for other listing sites, the owner has agreed.
 */
export const SOURCES: Source[] = [
  {
    url: 'https://vladcarbune.ro/calendar-evenimente-alergare-{year}/',
    sport: 'running',
    parser: 'bullet-list',
  },
];
