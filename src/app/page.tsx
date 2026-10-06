import { getTranslations } from "next-intl/server";
import { EventCard } from "@/components/EventCard";
import { FilterForm } from "@/components/FilterForm";
import { getFilterOptions, getUpcomingEvents } from "@/lib/events";
import { parseFilters } from "@/lib/filters";

export default async function Home({ searchParams }: PageProps<"/">) {
  const t = await getTranslations("Home");
  const filters = parseFilters(await searchParams);
  const [events, options] = await Promise.all([getUpcomingEvents(filters), getFilterOptions()]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="mt-2 text-lg text-muted">{t("tagline")}</p>
      </header>

      <FilterForm action="/" filters={filters} {...options} />

      <section aria-labelledby="results-heading" className="mt-6">
        <h2 id="results-heading" className="mb-3 text-sm font-semibold text-muted" aria-live="polite">
          {t("count", { count: events.length })}
        </h2>
        {events.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted">
            {t("empty")}
          </p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
