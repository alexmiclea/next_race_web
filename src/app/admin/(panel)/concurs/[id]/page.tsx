import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getAdminEvent } from "@/lib/admin/events";
import { getFilterOptions } from "@/lib/events";
import { EditEventForm } from "./EditEventForm";

export default async function EditEventPage({ params }: PageProps<"/admin/concurs/[id]">) {
  const { id } = await params;
  const [event, options] = await Promise.all([getAdminEvent(id), getFilterOptions()]);
  if (!event) notFound();
  const t = await getTranslations("Admin");

  return (
    <main>
      <Link
        href={`/admin?status=${event.status}`}
        className="text-sm font-medium text-muted hover:text-foreground"
      >
        ← {t("backToList")}
      </Link>
      <h1 className="mt-3 mb-6 text-2xl font-extrabold tracking-tight break-words">{event.name}</h1>
      <EditEventForm event={event} sports={options.sports} counties={options.counties} />
    </main>
  );
}
