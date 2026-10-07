/**
 * Sport colours and icons. Each sport has its own colour (tokens in globals.css,
 * light and dark); a sport without one uses the neutral "other" style, so a new
 * sport added to the database works before it gets a colour.
 */

/** Sports with their own colour and icon. */
export const STYLED_SPORTS = ["running", "swimming", "cycling", "triathlon"] as const;
export type StyledSport = (typeof STYLED_SPORTS)[number];
export type SportStyle = StyledSport | "other";

export function sportStyle(slug: string): SportStyle {
  return (STYLED_SPORTS as readonly string[]).includes(slug) ? (slug as StyledSport) : "other";
}

/** CSS class that sets --sport, --sport-soft and --sport-ink for a sport (see globals.css). */
export function sportClass(slug: string): string {
  return `sport-${sportStyle(slug)}`;
}

/** Name of the CSS variable holding a sport's main colour, e.g. "--swimming". */
export function sportColorVar(slug: string): string {
  return `--${sportStyle(slug)}`;
}

/**
 * Colour variable for a map marker shared by several events: their sport's colour
 * when they all have the same main sport, otherwise the neutral colour.
 */
export function markerColorVar(mainSports: (string | null)[]): string {
  const unique = new Set(mainSports);
  return unique.size === 1 && mainSports[0] ? sportColorVar(mainSports[0]) : "--other";
}

/**
 * The sport an event is shown as. Triathlon wins when present (a triathlon festival
 * with a swimming race is a triathlon event); otherwise the sport with the most
 * races, ties going to the one listed first.
 */
export function mainSport(raceSports: string[]): string | null {
  if (raceSports.length === 0) return null;
  if (raceSports.includes("triathlon")) return "triathlon";
  const counts = new Map<string, number>();
  for (const slug of raceSports) counts.set(slug, (counts.get(slug) ?? 0) + 1);
  let best = raceSports[0];
  for (const [slug, count] of counts) if (count > counts.get(best)!) best = slug;
  return best;
}

type RaceWithSport = { sport_slug: string; sports: { name_ro: string } };

/** The event's sports without duplicates, main sport first, then in race order. */
export function eventSportList(races: RaceWithSport[]): { slug: string; name: string }[] {
  const seen = new Map<string, string>();
  for (const race of races) if (!seen.has(race.sport_slug)) seen.set(race.sport_slug, race.sports.name_ro);
  const main = mainSport(races.map((race) => race.sport_slug));
  const list = [...seen].map(([slug, name]) => ({ slug, name }));
  return list.sort((a, b) => Number(b.slug === main) - Number(a.slug === main));
}
