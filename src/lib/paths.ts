/** Builds and reads the site's URLs, so every page links to events the same way. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Address of an event's detail page, e.g. "/concurs/bucharest-marathon-2026". */
export function eventPath(event: { slug: string }): string {
  return `/concurs/${encodeURIComponent(event.slug)}`;
}

/**
 * Which column a detail-page URL segment refers to. Old links used the event's id;
 * current ones use its slug.
 */
export function eventLookup(segment: string): { column: "id" | "slug"; value: string } {
  const value = decodeURIComponent(segment);
  return { column: UUID.test(value) ? "id" : "slug", value };
}
