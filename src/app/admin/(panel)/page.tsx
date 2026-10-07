import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { countByStatus, getEventsByStatus, type ReviewStatus } from "@/lib/admin/events";
import { eventPlace } from "@/lib/events";
import { formatEventDates } from "@/lib/format";
import { eventPath } from "@/lib/paths";
import { StatusButtons } from "./StatusButtons";

const TABS: ReviewStatus[] = ["pending", "approved", "rejected"];

export default async function AdminQueuePage({ searchParams }: PageProps<"/admin">) {
  const params = await searchParams;
  const status: ReviewStatus = TABS.includes(params.status as ReviewStatus)
    ? (params.status as ReviewStatus)
    : "pending";
  const t = await getTranslations("Admin");
  const format = await getFormatter();
  const [events, counts] = await Promise.all([getEventsByStatus(status), countByStatus()]);

  return (
    <main>
      <div className="mb-4 flex justify-end">
        <Link
          href="/admin/concurs/nou"
          className="inline-flex h-10 items-center rounded-lg bg-accent px-4 font-semibold text-on-accent hover:opacity-90"
        >
          + {t("addEvent")}
        </Link>
      </div>
      <nav aria-label={t("tabs")} className="mb-4 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab}
            href={`/admin?status=${tab}`}
            aria-current={tab === status ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              tab === status ? "bg-accent text-on-accent" : "border border-border hover:bg-surface"
            }`}
          >
            {t(`status.${tab}`)} ({counts[tab]})
          </Link>
        ))}
      </nav>

      {params.saved && (
        <p role="status" className="mb-4 rounded-lg bg-surface p-3 text-sm">
          {t("saved")}
        </p>
      )}

      {events.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted">
          {t(`empty.${status}`)}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {events.map((event) => (
            <li key={event.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm text-muted">
                    {formatEventDates(format, event)} · {eventPlace(event) ?? t("noPlace")}
                  </p>
                  <h2 className="text-lg font-bold break-words">{event.name}</h2>
                  <p className="mt-1 text-sm">
                    {event.races.map((race) => race.label).join(" · ") || t("noDistances")}
                  </p>
                </div>
                <StatusButtons id={event.id} status={event.status} />
              </div>

              {event.review_note && (
                <p className="mt-3 rounded-lg bg-surface p-3 text-sm">
                  <span className="font-semibold">{t("note")}:</span> {event.review_note}
                </p>
              )}

              <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <Link href={`/admin/concurs/${event.id}`} className="font-semibold text-accent underline">
                  {t("edit")}
                </Link>
                {event.status === "approved" && (
                  <Link href={eventPath(event)} className="underline">
                    {t("viewOnSite")}
                  </Link>
                )}
                {event.website_url && (
                  <a href={event.website_url} rel="noopener" target="_blank" className="underline">
                    {t("organizerSite")} ↗
                  </a>
                )}
                {event.source_url && (
                  <a href={event.source_url} rel="noopener" target="_blank" className="underline">
                    {t("source")} ({event.source}) ↗
                  </a>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
