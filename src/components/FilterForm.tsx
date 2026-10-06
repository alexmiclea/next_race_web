import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CountySelect } from "@/components/CountySelect";
import { DateField } from "@/components/DateField";
import type { County, Sport } from "@/lib/events";
import { DISTANCE_BUCKETS, hasFilters, type Filters } from "@/lib/filters";

/**
 * Plain GET form: filters end up in the URL, so it works without JavaScript and
 * filtered views can be bookmarked or shared.
 */
export async function FilterForm({
  action,
  filters,
  sports,
  counties,
}: {
  /** Page the form submits to ("/" or "/harta"). */
  action: string;
  filters: Filters;
  sports: Sport[];
  counties: County[];
}) {
  const t = await getTranslations("Filters");
  const field = "flex min-w-0 flex-col gap-1 text-sm font-medium";
  const control =
    "h-10 w-full min-w-0 rounded-lg border border-border bg-background px-2 text-base font-normal text-foreground";

  return (
    <form
      action={action}
      className="rounded-xl border border-border bg-surface p-4"
      aria-label={t("title")}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className={field}>
          {t("sport")}
          <select name="sport" defaultValue={filters.sport ?? ""} className={control}>
            <option value="">{t("any")}</option>
            {sports.map((sport) => (
              <option key={sport.slug} value={sport.slug}>
                {sport.name_ro}
              </option>
            ))}
          </select>
        </label>

        <label className={field}>
          {t("distance")}
          <select name="distance" defaultValue={filters.distance ?? ""} className={control}>
            <option value="">{t("any")}</option>
            {Object.keys(DISTANCE_BUCKETS).map((bucket) => (
              <option key={bucket} value={bucket}>
                {t(`distances.${bucket as keyof typeof DISTANCE_BUCKETS}`)}
              </option>
            ))}
          </select>
        </label>

        {/* Not a <label>: the dropdown holds many inputs. CountySelect labels itself. */}
        <div className={`${field} col-span-2 sm:col-span-1`}>
          <span aria-hidden>{t("county")}</span>
          <CountySelect
            counties={counties}
            defaultSelected={filters.counties}
            className={control}
          />
        </div>

        <label className={field}>
          {t("from")}
          <DateField
            name="from"
            defaultValue={filters.from}
            placeholder={t("pickDate")}
            className={control}
          />
        </label>

        <label className={field}>
          {t("to")}
          <DateField
            name="to"
            defaultValue={filters.to}
            placeholder={t("pickDate")}
            className={control}
          />
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          className="h-10 rounded-lg bg-accent px-5 font-semibold text-on-accent hover:opacity-90"
        >
          {t("apply")}
        </button>
        {hasFilters(filters) && (
          <Link href={action} className="text-sm font-medium text-muted underline">
            {t("reset")}
          </Link>
        )}
      </div>
    </form>
  );
}
