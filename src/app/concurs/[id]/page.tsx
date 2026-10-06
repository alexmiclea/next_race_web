import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { eventPlace, eventSports, getEvent } from "@/lib/events";
import { formatEventDates } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/concurs/[id]">): Promise<Metadata> {
  const event = await getEvent((await params).id);
  if (!event) return {};
  const place = eventPlace(event);
  return {
    title: `${event.name} — Next Race`,
    description: [event.start_date, place, eventSports(event).join(", ")].filter(Boolean).join(" · "),
  };
}

export default async function EventPage({ params }: PageProps<"/concurs/[id]">) {
  const event = await getEvent((await params).id);
  if (!event) notFound();

  const t = await getTranslations("Event");
  const format = await getFormatter();
  const place = event.is_virtual ? t("virtual") : (eventPlace(event) ?? t("unknownPlace"));
  const races = event.races.filter((race) => race.label !== "?");
  const primaryUrl = event.registration_url ?? event.website_url;
  const row = "grid gap-1 border-t border-border py-4 sm:grid-cols-[10rem_1fr]";
  const label = "text-sm font-semibold text-muted";

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
      <Link href="/" className="text-sm font-medium text-muted hover:text-foreground">
        ← {t("back")}
      </Link>

      <header className="mt-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">
          {eventSports(event).join(" · ")}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{event.name}</h1>
      </header>

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
            {event.latitude !== null && (
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
            {event.registration_url ? t("register") : t("website")} ↗
          </a>
        )}
        {event.registration_url && event.website_url && (
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
        {event.source_url && (
          <p className="mt-2">
            <a href={event.source_url} rel="noopener" className="underline">
              {t("source")}
            </a>
          </p>
        )}
      </aside>
    </main>
  );
}
