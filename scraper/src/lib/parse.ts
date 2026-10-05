import type { Distance } from '../types.ts';

const MONTHS: Record<string, number> = {
  ianuarie: 1,
  februarie: 2,
  martie: 3,
  aprilie: 4,
  mai: 5,
  iunie: 6,
  iulie: 7,
  august: 8,
  septembrie: 9,
  octombrie: 10,
  noiembrie: 11,
  decembrie: 12,
};

/** County seat → county code. Used when a source gives a city without a county. */
const COUNTY_SEATS: Record<string, string> = {
  'alba iulia': 'AB',
  arad: 'AR',
  pitești: 'AG',
  bacău: 'BC',
  oradea: 'BH',
  bistrița: 'BN',
  botoșani: 'BT',
  brașov: 'BV',
  brăila: 'BR',
  buzău: 'BZ',
  reșița: 'CS',
  călărași: 'CL',
  'cluj-napoca': 'CJ',
  constanța: 'CT',
  'sfântu gheorghe': 'CV',
  târgoviște: 'DB',
  craiova: 'DJ',
  galați: 'GL',
  giurgiu: 'GR',
  'târgu jiu': 'GJ',
  'miercurea ciuc': 'HR',
  deva: 'HD',
  slobozia: 'IL',
  iași: 'IS',
  'baia mare': 'MM',
  'drobeta-turnu severin': 'MH',
  'târgu mureș': 'MS',
  'târgu-mureș': 'MS',
  'piatra neamț': 'NT',
  slatina: 'OT',
  ploiești: 'PH',
  'satu mare': 'SM',
  zalău: 'SJ',
  sibiu: 'SB',
  suceava: 'SV',
  alexandria: 'TR',
  timișoara: 'TM',
  tulcea: 'TL',
  vaslui: 'VS',
  'râmnicu vâlcea': 'VL',
  focșani: 'VN',
  bucurești: 'B',
};

export const COUNTY_CODES = new Set(Object.values(COUNTY_SEATS).concat('IF'));

/** Non-standard county codes seen in sources → official code. */
const COUNTY_CODE_ALIASES: Record<string, string> = { HG: 'HR' };

/** Other ways race names refer to a county seat. */
const CITY_ALIASES: Record<string, string> = {
  bucharest: 'București',
  cluj: 'Cluj-Napoca',
  craiovei: 'Craiova',
};

/** Collapses whitespace (including &nbsp;) and unifies dash characters. */
export function normalizeText(text: string): string {
  return text
    .replace(/ /g, ' ')
    .replace(/[–—]/g, '–')
    .replace(/\s+/g, ' ')
    .replace(/ - /g, ' – ')
    .trim();
}

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const MONTH = '[A-Za-z]+';
const DATE_PREFIX = new RegExp(
  `^(${MONTH})\\s+(\\d{1,2})` + // start: "Aprilie 24"
    `(?:\\s*[-–]\\s*(?:(${MONTH})\\s+)?(\\d{1,2}))?` + // end: "-25" or " – Decembrie 31"
    `(?:,\\s*ora\\s+(\\d{1,2}:\\d{2}))?` + // time: ", ora 03:59"
    `\\s*:\\s*`,
  'i',
);

export type DatePrefix = {
  startDate: string;
  endDate: string;
  startTime: string | null;
  /** The rest of the line after the date and colon. */
  rest: string;
};

/**
 * Parses a leading Romanian date like "Aprilie 24-25: …" or
 * "Ianuarie 01 – Decembrie 31: …". Returns null if the line doesn't start with one.
 */
export function parseDatePrefix(line: string, year: number): DatePrefix | null {
  const match = DATE_PREFIX.exec(line);
  if (!match) return null;
  const [whole, startMonthName, startDay, endMonthName, endDay, time] = match;

  const startMonth = MONTHS[startMonthName.toLowerCase()];
  const endMonth = endMonthName ? MONTHS[endMonthName.toLowerCase()] : startMonth;
  if (!startMonth || !endMonth) return null;

  const startDate = isoDate(year, startMonth, Number(startDay));
  const endDate = isoDate(year, endMonth, Number(endDay ?? startDay));
  if (!startDate || !endDate || endDate < startDate) return null;

  return {
    startDate,
    endDate,
    startTime: time ? time.padStart(5, '0') : null,
    rest: line.slice(whole.length),
  };
}

function isoDate(year: number, month: number, day: number): string | null {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date.toISOString().slice(0, 10);
}

export type Location = { city: string | null; county: string | null; isVirtual: boolean };

/** Parses "Făgăraș BV", "Cluj-Napoca", "oriunde". */
export function parseLocation(text: string | null): Location {
  const location = text?.trim();
  if (!location) return { city: null, county: null, isVirtual: false };
  if (/^oriunde$/i.test(location)) return { city: null, county: null, isVirtual: true };

  const withCode = /^(.*\S)\s+([A-Z]{1,2})$/.exec(location);
  if (withCode) {
    const code = COUNTY_CODE_ALIASES[withCode[2]] ?? withCode[2];
    if (COUNTY_CODES.has(code)) return { city: withCode[1], county: code, isVirtual: false };
  }
  return { city: location, county: countyOfSeat(location), isVirtual: false };
}

export function countyOfSeat(city: string): string | null {
  return COUNTY_SEATS[city.toLowerCase()] ?? null;
}

/** Longest first, so "Cluj-Napoca" wins over "Cluj". */
const CITY_NAME_KEYS = [...Object.keys(COUNTY_SEATS), ...Object.keys(CITY_ALIASES)].sort(
  (a, b) => b.length - a.length,
);

/** Finds a county seat mentioned in a race name, e.g. "Semimaraton Iași" → Iași. */
export function cityFromName(name: string): string | null {
  for (const key of CITY_NAME_KEYS) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = new RegExp(`(?<![\\p{L}-])${escaped}(?![\\p{L}-])`, 'iu').exec(name);
    if (match) return CITY_ALIASES[key] ?? match[0];
  }
  return null;
}

/** Parses "42km, 21km, 2,5km, copii" into labelled distances. */
export function parseDistances(text: string | null): Distance[] {
  if (!text?.trim()) return [];
  return text
    .split(/,\s+/)
    .map((label) => label.trim())
    .filter(Boolean)
    .map((label) => {
      const km = /^(\d+(?:[.,]\d+)?)\s*km?\b/i.exec(label);
      return { label, km: km ? Number(km[1].replace(',', '.')) : null };
    });
}

export function looksLikeDistances(text: string): boolean {
  return /^\d+(?:[.,]\d+)?\s*km?\b/i.test(text.trim());
}
