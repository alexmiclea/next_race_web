import "server-only";
import type { Event } from "@/lib/events";
import { requireAdmin } from "@/lib/admin/session";

export type ReviewStatus = "pending" | "approved" | "rejected";

/** An event as the admin sees it: public fields plus review details. */
export type AdminEvent = Event & {
  status: ReviewStatus;
  review_note: string | null;
  source: string;
};

const ADMIN_FIELDS = `
  id, slug, name, organizer, start_date, end_date, start_time, city, county_code, is_virtual,
  latitude, longitude, website_url, registration_url, source_url,
  description, description_source_url, status, review_note, source,
  counties(name),
  races(id, label, distance_km, sort_order, sport_slug, sports(name_ro))
`;

/** Events with the given review status, soonest first (pending is the review queue). */
export async function getEventsByStatus(status: ReviewStatus): Promise<AdminEvent[]> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("events")
    .select(ADMIN_FIELDS)
    .eq("status", status)
    .order("start_date")
    .order("name")
    .returns<AdminEvent[]>();
  if (error) throw new Error(`Loading events failed: ${error.message}`);
  return data.map((event) => ({
    ...event,
    races: [...event.races].sort((a, b) => a.sort_order - b.sort_order),
  }));
}

/** How many events have each review status. */
export async function countByStatus(): Promise<Record<ReviewStatus, number>> {
  const { supabase } = await requireAdmin();
  const statuses: ReviewStatus[] = ["pending", "approved", "rejected"];
  const counts = await Promise.all(
    statuses.map(async (status) => {
      const { count, error } = await supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("status", status);
      if (error) throw new Error(`Counting events failed: ${error.message}`);
      return [status, count ?? 0] as const;
    }),
  );
  return Object.fromEntries(counts) as Record<ReviewStatus, number>;
}

/** One event by id, any status, or null. */
export async function getAdminEvent(id: string): Promise<AdminEvent | null> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("events")
    .select(ADMIN_FIELDS)
    .eq("id", id)
    .maybeSingle()
    .returns<AdminEvent | null>();
  if (error) throw new Error(`Loading event failed: ${error.message}`);
  return data && { ...data, races: [...data.races].sort((a, b) => a.sort_order - b.sort_order) };
}
