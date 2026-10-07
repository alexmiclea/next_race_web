import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { SportTag } from "@/components/SportTag";
import { VirtualTag } from "@/components/VirtualTag";
import { eventPlace, type Event } from "@/lib/events";
import { formatEventDates, parseDate } from "@/lib/format";
import { eventPath } from "@/lib/paths";
import { eventSportList, sportClass } from "@/lib/sports";

export async function EventCard({ event }: { event: Event }) {
  const t = await getTranslations("Event");
  const format = await getFormatter();
  const start = parseDate(event.start_date);
  const place = event.is_virtual ? t("virtual") : (eventPlace(event) ?? t("unknownPlace"));
  const distances = event.races.map((race) => race.label).filter((label) => label !== "?");
  const sports = eventSportList(event.races);
  // The card takes the colour of the event's main sport (listed first).
  const colour = sportClass(sports[0]?.slug ?? "");

  return (
    <li className={colour}>
      <Link
        href={eventPath(event)}
        className="flex gap-4 rounded-xl border border-border bg-background p-4 transition hover:border-sport hover:shadow-sm"
      >
        {/* Calendar-style date block; the full date is in the <time> below for screen readers. */}
        <div
          aria-hidden
          className="flex w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-sport-soft py-2 text-sport-ink"
        >
          <span className="text-2xl font-extrabold leading-none">
            {format.dateTime(start, { day: "numeric" })}
          </span>
          <span className="mt-1 text-xs font-semibold uppercase">
            {format.dateTime(start, { month: "short" }).replace(".", "")}
          </span>
        </div>

        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            <time dateTime={event.start_date}>{formatEventDates(format, event)}</time>
            {sports.map((sport) => (
              <SportTag key={sport.slug} slug={sport.slug} name={sport.name} />
            ))}
          </p>
          <h3 className="mt-1 text-lg font-bold leading-snug break-words">{event.name}</h3>
          <p className="flex flex-wrap items-center gap-2 text-muted">
            {place}
            {event.is_virtual && <VirtualTag label={t("virtualTag")} />}
          </p>
          {distances.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {distances.map((label, index) => (
                <li
                  key={index}
                  className="rounded-full border border-border px-2 py-0.5 text-xs font-medium"
                >
                  {label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Link>
    </li>
  );
}
