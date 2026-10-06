import { getFormatter, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

type Race = {
  id: string;
  label: string;
  sort_order: number;
  sports: { slug: string; name_ro: string };
};

type Event = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  city: string | null;
  is_virtual: boolean;
  website_url: string | null;
  source_url: string | null;
  counties: { name: string } | null;
  races: Race[];
};

export default async function Home() {
  const t = await getTranslations("Home");
  const format = await getFormatter();
  const supabase = await createClient();

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest" }).format(
    new Date(),
  );
  const { data, error } = await supabase
    .from("events")
    .select(
      "id, name, start_date, end_date, city, is_virtual, website_url, source_url, counties(name), races(id, label, sort_order, sports(slug, name_ro))",
    )
    .gte("end_date", today)
    .order("start_date")
    .limit(100)
    .returns<Event[]>();

  if (error) console.error("Failed to load events", error);
  const events = data ?? [];

  const dateRange = (event: Event) => {
    const start = new Date(event.start_date);
    const end = new Date(event.end_date);
    return event.start_date === event.end_date
      ? format.dateTime(start, { day: "numeric", month: "long", year: "numeric" })
      : format.dateTimeRange(start, end, { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Next Race</h1>
        <p className="mt-2 text-lg text-muted">{t("tagline")}</p>
      </header>

      <section aria-labelledby="upcoming-heading">
        <h2 id="upcoming-heading" className="mb-4 text-xl font-semibold">
          {t("upcoming")}
        </h2>

        {error ? (
          <p role="alert">{t("error")}</p>
        ) : events.length === 0 ? (
          <p className="text-muted">{t("empty")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {events.map((event) => {
              const races = [...event.races].sort((a, b) => a.sort_order - b.sort_order);
              const sports = [...new Set(races.map((race) => race.sports.name_ro))];
              const place = event.is_virtual
                ? t("virtual")
                : [event.city, event.counties?.name].filter(Boolean).join(", ");
              return (
                <li key={event.id} className="rounded-lg border border-border p-4">
                  <p className="text-sm font-medium text-accent">
                    <time dateTime={event.start_date}>{dateRange(event)}</time>
                    {sports.length > 0 && <> · {sports.join(", ")}</>}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">{event.name}</h3>
                  {place && <p className="text-muted">{place}</p>}
                  {races.length > 0 && (
                    <p className="mt-2 text-sm">{races.map((race) => race.label).join(" · ")}</p>
                  )}
                  <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    {event.website_url && (
                      <a href={event.website_url} className="text-accent underline" rel="noopener">
                        {t("website")}
                      </a>
                    )}
                    {event.source_url && (
                      <a href={event.source_url} className="text-muted underline" rel="noopener">
                        {t("source")}
                      </a>
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
