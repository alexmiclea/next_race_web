"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { looksLikeEmail } from "@/lib/admin/auth-helpers";
import { parseEventForm } from "@/lib/admin/form";
import { locatePlace } from "@/lib/admin/geocode";
import { requireAdmin } from "@/lib/admin/session";
import type { ReviewStatus } from "@/lib/admin/events";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { status: "idle" | "sent" | "invalid" | "tooMany" };

/**
 * Emails a login link. The answer is the same whether or not the address has an account,
 * so the form can't be used to find out who the admin is. Sign-ups are off, so no new
 * account is ever created here.
 */
export async function sendLoginLink(_previous: LoginState, data: FormData): Promise<LoginState> {
  const email = String(data.get("email") ?? "").trim().toLowerCase();
  if (!looksLikeEmail(email)) return { status: "invalid" };

  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: origin ? `${origin}/auth/callback?next=/admin` : undefined,
    },
  });
  if (error?.status === 429) return { status: "tooMany" };
  return { status: "sent" };
}

export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/** Pages that show events, refreshed after an admin change. */
function refreshPages() {
  revalidatePath("/", "layout");
}

export async function setEventStatus(id: string, status: ReviewStatus) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("events").update({ status }).eq("id", id);
  if (error) throw new Error(`Saving failed: ${error.message}`);
  refreshPages();
}

export type SaveState = { errors: string[] };

/** County name for a code (the map lookup works better with it). */
async function countyName(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  code: string | null,
): Promise<string | null> {
  if (!code) return null;
  const { data } = await supabase.from("counties").select("name").eq("code", code).maybeSingle();
  return data?.name ?? null;
}

/** Adds a race by hand. It gets its map pin straight away when the place can be found. */
export async function createEvent(
  sportSlugs: string[],
  _previous: SaveState,
  data: FormData,
): Promise<SaveState> {
  const { supabase } = await requireAdmin();
  const parsed = parseEventForm(data, sportSlugs);
  if (!parsed.ok) return { errors: parsed.errors };

  const point = parsed.event.is_virtual
    ? null
    : await locatePlace(parsed.event.city, await countyName(supabase, parsed.event.county_code));
  const { data: created, error } = await supabase
    .from("events")
    .insert({
      ...parsed.event,
      ...point,
      source: "manual",
      // Unique within the "manual" source; the readable slug is set by the database.
      external_key: `manual-${randomUUID()}`,
    })
    .select("id")
    .single();
  if (error || !created) return { errors: ["saveFailed"] };

  // A new form has no existing rows, so everything is in "add".
  const races = parsed.races.add.map((race) => ({ ...race, event_id: created.id }));
  if (races.length > 0) {
    const { error: racesError } = await supabase.from("races").insert(races);
    if (racesError) return { errors: ["saveFailed"] };
  }

  refreshPages();
  redirect(`/admin?status=${parsed.event.status}&saved=${created.id}`);
}

export async function saveEvent(
  id: string,
  sportSlugs: string[],
  _previous: SaveState,
  data: FormData,
): Promise<SaveState> {
  const { supabase } = await requireAdmin();
  const parsed = parseEventForm(data, sportSlugs);
  if (!parsed.ok) return { errors: parsed.errors };

  // Look the place up again only when it changed (or was never found).
  const { data: before } = await supabase
    .from("events")
    .select("city, county_code, latitude")
    .eq("id", id)
    .single();
  const placeChanged =
    !before ||
    before.latitude === null ||
    before.city !== parsed.event.city ||
    before.county_code !== parsed.event.county_code;
  const point =
    placeChanged && !parsed.event.is_virtual
      ? await locatePlace(parsed.event.city, await countyName(supabase, parsed.event.county_code))
      : null;
  const coordinates = point ?? (placeChanged ? { latitude: null, longitude: null } : {});

  const { error } = await supabase
    .from("events")
    .update({ ...parsed.event, ...coordinates })
    .eq("id", id);
  if (error) return { errors: ["saveFailed"] };

  const { keep, add, remove } = parsed.races;
  const results = await Promise.all([
    remove.length > 0
      ? supabase.from("races").delete().eq("event_id", id).in("id", remove)
      : null,
    ...keep.map(({ id: raceId, ...race }) =>
      supabase.from("races").update(race).eq("id", raceId!).eq("event_id", id),
    ),
    add.length > 0
      ? supabase.from("races").insert(add.map((race) => ({ ...race, event_id: id })))
      : null,
  ]);
  if (results.some((result) => result?.error)) return { errors: ["saveFailed"] };

  refreshPages();
  redirect(`/admin?status=${parsed.event.status}&saved=${id}`);
}
