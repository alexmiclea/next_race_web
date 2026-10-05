export type Distance = {
  /** As written by the source, e.g. "21km", "2,5km", "copii", "ștafetă". */
  label: string;
  /** Parsed kilometres, or null for non-distance categories (kids, relay, teams…). */
  km: number | null;
};

/** One race as collected from a source, waiting for manual review. */
export type ScrapedRace = {
  status: 'pending';
  /** Stable id within a source, used to detect the same race on later runs. */
  externalKey: string;
  source: string;
  sourceUrl: string;
  sport: string;
  name: string;
  /** ISO dates (YYYY-MM-DD), Europe/Bucharest. */
  startDate: string;
  endDate: string;
  /** "HH:MM" when the source gives a start time. */
  startTime: string | null;
  city: string | null;
  /** Romanian county code (CJ, TM, B…). */
  county: string | null;
  /** Race can be run from anywhere (the source says "oriunde"). */
  isVirtual: boolean;
  distances: Distance[];
  websiteUrl: string | null;
  /** The original line, so the reviewer can check the parse. */
  rawText: string;
  /** Anything the parser was unsure about. */
  warnings: string[];
};

export type ParserName = 'bullet-list';

export type Source = {
  /** Page to scrape. `{year}` is replaced with the current and the next year. */
  url: string;
  /** Sport of every race on the page. */
  sport: string;
  /** How the page is laid out; see src/parsers/. */
  parser: ParserName;
  /** CSS selector for one race entry. Defaults to `p`. */
  itemSelector?: string;
};

/** What a parser needs besides the HTML. */
export type PageContext = {
  url: string;
  year: number;
  /** YYYY-MM-DD in Europe/Bucharest; races ending earlier are skipped. */
  today: string;
  sport: string;
  itemSelector: string;
};

export type SkipReason = 'not-romania' | 'past' | 'recurring' | 'unparsed';

export type SourceResult = {
  races: ScrapedRace[];
  skipped: { reason: SkipReason; text: string }[];
};
