import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getFilterOptions } from "@/lib/events";
import { EditEventForm } from "../[id]/EditEventForm";

export default async function NewEventPage() {
  const [options, t] = await Promise.all([getFilterOptions(), getTranslations("Admin")]);
  return (
    <main>
      <Link href="/admin" className="text-sm font-medium text-muted hover:text-foreground">
        ← {t("backToList")}
      </Link>
      <h1 className="mt-3 mb-6 text-2xl font-extrabold tracking-tight">{t("addEvent")}</h1>
      <EditEventForm sports={options.sports} counties={options.counties} />
    </main>
  );
}
