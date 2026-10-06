import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { FilterForm } from "@/components/FilterForm";
import { RaceMap, type MapEvent } from "@/components/RaceMap";
import { getFilterOptions, getUpcomingEvents } from "@/lib/events";
import { parseFilters } from "@/lib/filters";
import { formatEventDates } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Map");
  return { title: `${t("title")} — Next Race` };
}

export default async function MapPage({ searchParams }: PageProps<"/harta">) {
  const params = await searchParams;
  const t = await getTranslations("Map");
  const format = await getFormatter();
  const filters = parseFilters(params);
  const [events, options] = await Promise.all([getUpcomingEvents(filters), getFilterOptions()]);

  const located: MapEvent[] = events.flatMap((event) =>
    event.latitude !== null && event.longitude !== null
      ? [
          {
            id: event.id,
            slug: event.slug,
            name: event.name,
            dates: formatEventDates(format, event),
            latitude: event.latitude,
            longitude: event.longitude,
          },
        ]
      : [],
  );
  const notShown = events.length - located.length;
  const focusId = typeof params.event === "string" ? params.event : undefined;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="mt-2 text-lg text-muted">{t("tagline")}</p>
      </header>

      <FilterForm action="/harta" filters={filters} {...options} />

      <div className="mt-6">
        <RaceMap events={located} focusId={focusId} />
        {notShown > 0 && (
          <p className="mt-2 text-sm text-muted">{t("notShown", { count: notShown })}</p>
        )}
      </div>
    </main>
  );
}
