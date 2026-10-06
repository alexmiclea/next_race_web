import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { eventPlace, eventSports, type Event } from "@/lib/events";
import { formatEventDates, parseDate } from "@/lib/format";

export async function EventCard({ event }: { event: Event }) {
  const t = await getTranslations("Event");
  const format = await getFormatter();
  const start = parseDate(event.start_date);
  const place = event.is_virtual ? t("virtual") : (eventPlace(event) ?? t("unknownPlace"));
  const distances = event.races.map((race) => race.label).filter((label) => label !== "?");

  return (
    <li>
      <Link
        href={`/concurs/${event.id}`}
        className="flex gap-4 rounded-xl border border-border bg-background p-4 transition hover:border-accent hover:shadow-sm"
      >
        {/* Calendar-style date block; the full date is in the <time> below for screen readers. */}
        <div
          aria-hidden
          className="flex w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-accent-soft py-2 text-accent"
        >
          <span className="text-2xl font-extrabold leading-none">
            {format.dateTime(start, { day: "numeric" })}
          </span>
          <span className="mt-1 text-xs font-semibold uppercase">
            {format.dateTime(start, { month: "short" }).replace(".", "")}
          </span>
        </div>

        <div className="min-w-0">
          <p className="text-sm text-muted">
            <time dateTime={event.start_date}>{formatEventDates(format, event)}</time>
            {" · "}
            {eventSports(event).join(", ")}
          </p>
          <h3 className="mt-0.5 text-lg font-bold leading-snug break-words">{event.name}</h3>
          <p className="text-muted">{place}</p>
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
