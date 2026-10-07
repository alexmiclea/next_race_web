import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AutoApplyForm } from "@/components/AutoApplyForm";
import { CountySelect } from "@/components/CountySelect";
import { DateField } from "@/components/DateField";
import { SelectDropdown } from "@/components/SelectDropdown";
import { SportIcon } from "@/components/SportTag";
import type { County, Sport } from "@/lib/events";
import { DISTANCE_BUCKETS, hasFilters, type Filters } from "@/lib/filters";
import { sportClass } from "@/lib/sports";

/**
 * Filters live in the URL, so filtered views can be bookmarked or shared. The form
 * applies itself as filters change; without JavaScript it is a plain GET form.
 */
export async function FilterForm({
  action,
  filters,
  sports,
  counties,
  virtualToggle = true,
}: {
  /** Page the form submits to ("/" or "/harta"). */
  action: string;
  filters: Filters;
  sports: Sport[];
  counties: County[];
  /** Show the "include virtual races" box (pointless on the map: virtual races have no place). */
  virtualToggle?: boolean;
}) {
  const t = await getTranslations("Filters");
  const field = "flex min-w-0 flex-col gap-1 text-sm font-medium";
  const control =
    "h-10 w-full min-w-0 rounded-lg border border-border bg-background px-2 text-base font-normal text-foreground";

  return (
    <AutoApplyForm
      // A fresh form whenever the filters change, so its fields match the URL after
      // "reset" or the back button (the fields keep their own state otherwise).
      key={JSON.stringify(filters)}
      action={action}
      label={t("title")}
      className="rounded-xl border border-border bg-surface p-4"
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <SelectDropdown
          name="sport"
          label={t("sport")}
          defaultValue={filters.sport ?? ""}
          options={[
            { value: "", label: t("any") },
            ...sports.map((sport) => ({
              value: sport.slug,
              label: sport.name_ro,
              icon: (
                <span className={`${sportClass(sport.slug)} text-sport`}>
                  <SportIcon slug={sport.slug} />
                </span>
              ),
            })),
          ]}
        />

        <SelectDropdown
          name="distance"
          label={t("distance")}
          defaultValue={filters.distance ?? ""}
          options={[
            { value: "", label: t("any") },
            ...Object.keys(DISTANCE_BUCKETS).map((bucket) => ({
              value: bucket,
              label: t(`distances.${bucket as keyof typeof DISTANCE_BUCKETS}`),
            })),
          ]}
        />

        <div className="col-span-2 sm:col-span-1">
          <CountySelect counties={counties} defaultSelected={filters.counties} />
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

        {virtualToggle && (
          <div className="col-span-2 flex items-end sm:col-span-1">
            {/* Always sends virtual=0; the ticked box adds virtual=1 (see filtersQuery). */}
            <input type="hidden" name="virtual" value="0" />
            <label className="flex h-10 cursor-pointer items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                name="virtual"
                value="1"
                defaultChecked={!filters.hideVirtual}
                className="size-5 accent-[var(--accent)]"
              />
              {t("includeVirtual")}
            </label>
          </div>
        )}
      </div>

      {/* Once the form applies itself (data-enhanced), only the reset link remains. */}
      <div
        className={`mt-4 flex items-center gap-3 ${hasFilters(filters) ? "" : "group-data-[enhanced]:hidden"}`}
      >
        <button
          type="submit"
          className="h-10 rounded-lg bg-accent px-5 font-semibold text-on-accent hover:opacity-90 group-data-[enhanced]:hidden"
        >
          {t("apply")}
        </button>
        {hasFilters(filters) && (
          <Link href={action} scroll={false} className="text-sm font-medium text-muted underline">
            {t("reset")}
          </Link>
        )}
      </div>
    </AutoApplyForm>
  );
}
