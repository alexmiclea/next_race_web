import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { AdminEventBar } from "@/components/AdminEventBar";
import { FavoriteButton } from "@/components/FavoriteButton";
import { PastTag } from "@/components/PastTag";
import { SportTag } from "@/components/SportTag";
import { VirtualTag } from "@/components/VirtualTag";
import { eventPlace, eventSports, getEvent } from "@/lib/events";
import { getAdminIfSignedIn } from "@/lib/admin/session";
import { getFavoriteIds } from "@/lib/favorites-server";
import { isPast, today } from "@/lib/filters";
import { formatEventDates } from "@/lib/format";
import { eventPath } from "@/lib/paths";
import { eventSportList, sportClass } from "@/lib/sports";

/** A signed-in admin also sees races that aren't published yet (a preview). */
async function loadEvent(slug: string) {
  const admin = await getAdminIfSignedIn();
  const event = await getEvent(slug, { includeUnapproved: admin !== null });
  return { admin, event };
}

export async function generateMetadata({ params }: PageProps<"/concurs/[slug]">): Promise<Metadata> {
  const { event } = await loadEvent((await params).slug);
  if (!event) return {};
  const place = eventPlace(event);
  return {
    title: event.name,
    // A preview must never end up in search results.
    ...(event.status !== "approved" && { robots: { index: false, follow: false } }),
    description:
      event.description ??
      [event.start_date, place, eventSports(event).join(", ")].filter(Boolean).join(" · "),
  };
}

export default async function EventPage({ params }: PageProps<"/concurs/[slug]">) {
  const { slug } = await params;
  const { admin, event } = await loadEvent(slug);
  if (!event) notFound();
  // Old links used the event id; send them to the readable address.
  if (decodeURIComponent(slug) !== event.slug) permanentRedirect(eventPath(event));

  const t = await getTranslations("Event");
  const format = await getFormatter();
  const place = event.is_virtual ? t("virtual") : (eventPlace(event) ?? t("unknownPlace"));
  const races = event.races.filter((race) => race.label !== "?");
  const sports = eventSportList(event.races);
  const past = isPast(event, today());
  // Registration is closed for a past race; the organizer's site may have results.
  const registrationUrl = past ? null : event.registration_url;
  const primaryUrl = registrationUrl ?? event.website_url;
  const isFavorite = (await getFavoriteIds()).includes(event.id);
  // Not published yet: only the admin sees this page, so no favourites or map link.
  const preview = event.status !== "approved";
  const row = "grid gap-1 border-t border-border py-4 sm:grid-cols-[10rem_1fr]";
  const label = "text-sm font-semibold text-muted";

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
      {admin && <AdminEventBar eventId={event.id} status={event.status} />}
      <Link href="/" className="text-sm font-medium text-muted hover:text-foreground">
        ← {t("back")}
      </Link>

      <header className={`mt-4 border-l-4 border-sport pl-4 ${sportClass(sports[0]?.slug ?? "")}`}>
        <p className="flex flex-wrap items-center gap-2">
          {sports.map((sport) => (
            <SportTag key={sport.slug} slug={sport.slug} name={sport.name} />
          ))}
          {event.is_virtual && <VirtualTag label={t("virtualTag")} />}
          {past && <PastTag label={t("pastTag")} />}
        </p>
        <div className="mt-1 flex items-start justify-between gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{event.name}</h1>
          {!preview && (
            <FavoriteButton
              eventId={event.id}
              eventName={event.name}
              initial={isFavorite}
              upcoming={!past}
            />
          )}
        </div>
      </header>

      {past && (
        <p role="status" className="mt-4 rounded-xl border border-border bg-surface p-4">
          {t("pastNotice")}
        </p>
      )}

      {event.description && (
        <section aria-labelledby="about-heading" className="mt-6">
          <h2 id="about-heading" className="sr-only">
            {t("about")}
          </h2>
          <p className="text-lg leading-relaxed">{event.description}</p>
          <p className="mt-2 text-xs text-muted">{t("aiSummary")}</p>
        </section>
      )}

      <dl className="mt-6">
        <div className={row}>
          <dt className={label}>{t("when")}</dt>
          <dd>
            <time dateTime={event.start_date}>{formatEventDates(format, event)}</time>
            {event.start_time && (
              <span className="text-muted">
                {" · "}
                {t("startTime", { time: event.start_time.slice(0, 5) })}
              </span>
            )}
          </dd>
        </div>

        <div className={row}>
          <dt className={label}>{t("where")}</dt>
          <dd>
            {place}
            {event.latitude !== null && !preview && (
              <>
                {" · "}
                <Link
                  href={`/harta?event=${event.id}`}
                  className="font-medium text-accent underline"
                >
                  {t("showOnMap")}
                </Link>
              </>
            )}
          </dd>
        </div>

        {races.length > 0 && (
          <div className={row}>
            <dt className={label}>{t("distances")}</dt>
            <dd>
              <ul className="flex flex-wrap gap-2">
                {races.map((race) => (
                  <li
                    key={race.id}
                    className="rounded-full border border-border px-3 py-1 text-sm font-medium"
                  >
                    {race.label}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        )}

        {event.organizer && (
          <div className={row}>
            <dt className={label}>{t("organizer")}</dt>
            <dd>{event.organizer}</dd>
          </div>
        )}
      </dl>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {primaryUrl && (
          <a
            href={primaryUrl}
            rel="noopener"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-accent px-6 font-semibold text-on-accent hover:opacity-90"
          >
            {registrationUrl ? t("register") : t("website")} ↗
          </a>
        )}
        {registrationUrl && event.website_url && (
          <a
            href={event.website_url}
            rel="noopener"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-border px-6 font-semibold hover:bg-surface"
          >
            {t("website")} ↗
          </a>
        )}
      </div>

      <aside className="mt-8 rounded-xl bg-surface p-4 text-sm text-muted">
        <p>{t("checkOrganizer")}</p>
      </aside>
    </main>
  );
}
