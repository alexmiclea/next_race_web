import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { EventCard } from "@/components/EventCard";
import { getUpcomingEventsByIds } from "@/lib/events";
import { getFavoriteIds } from "@/lib/favorites-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Favorites");
  return { title: `${t("title")} — Next Race` };
}

export default async function FavoritesPage() {
  const t = await getTranslations("Favorites");
  const ids = await getFavoriteIds();
  // Races that have already happened (or were removed) simply don't come back.
  const events = await getUpcomingEventsByIds(ids);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="mt-2 text-lg text-muted">{t("tagline")}</p>
      </header>

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted">
          <p>{t("empty")}</p>
          <Link href="/" className="mt-3 inline-block font-medium text-accent underline">
            {t("browse")}
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} isFavorite refreshOnFavoriteChange />
          ))}
        </ul>
      )}
      <p className="mt-6 text-sm text-muted">{t("storedOnDevice")}</p>
    </main>
  );
}
