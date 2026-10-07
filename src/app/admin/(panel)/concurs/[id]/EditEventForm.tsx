"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { createEvent, saveEvent, type SaveState } from "@/app/admin/actions";
import type { AdminEvent } from "@/lib/admin/events";
import type { County, Sport } from "@/lib/events";

/** Blank rows offered for adding distances: more for a new race, a couple when editing. */
const NEW_ROWS = { create: 3, edit: 2 };

/** Edits an existing race, or adds a new one when `event` is left out. */
export function EditEventForm({
  event,
  sports,
  counties,
}: {
  event?: AdminEvent;
  sports: Sport[];
  counties: County[];
}) {
  const t = useTranslations("Admin.form");
  const tErrors = useTranslations("Admin.errors");
  const sportSlugs = sports.map((sport) => sport.slug);
  const save = event
    ? saveEvent.bind(null, event.id, sportSlugs)
    : createEvent.bind(null, sportSlugs);
  const [state, action, pending] = useActionState<SaveState, FormData>(save, { errors: [] });

  const field = "flex flex-col gap-1 text-sm font-medium";
  const input =
    "h-10 w-full min-w-0 rounded-lg border border-border bg-background px-2 text-base font-normal";
  const mainSport = event?.races[0]?.sport_slug ?? sports[0]?.slug;
  const rows = [
    ...(event?.races ?? []).map((race) => ({ ...race, isNew: false })),
    ...Array.from({ length: event ? NEW_ROWS.edit : NEW_ROWS.create }, (_, n) => ({
      id: `new-${n}`,
      label: "",
      distance_km: null,
      sport_slug: mainSport,
      isNew: true,
    })),
  ];

  return (
    <form action={action} className="flex flex-col gap-6">
      {state.errors.length > 0 && (
        <ul role="alert" className="rounded-lg bg-past-soft p-3 text-sm text-past-ink">
          {state.errors.map((code) => (
            <li key={code}>{tErrors(code)}</li>
          ))}
        </ul>
      )}

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-2 text-lg font-bold">{t("details")}</legend>
        <label className={`${field} sm:col-span-2`}>
          {t("name")}
          <input name="name" defaultValue={event?.name} required className={input} />
        </label>
        <label className={field}>
          {t("startDate")}
          <input
            type="date"
            name="start_date"
            defaultValue={event?.start_date}
            required
            className={input}
          />
        </label>
        <label className={field}>
          {t("endDate")}
          <input type="date" name="end_date" defaultValue={event?.end_date} className={input} />
        </label>
        <label className={field}>
          {t("startTime")}
          <input
            type="time"
            name="start_time"
            defaultValue={event?.start_time?.slice(0, 5) ?? ""}
            className={input}
          />
        </label>
        <label className={field}>
          {t("organizer")}
          <input name="organizer" defaultValue={event?.organizer ?? ""} className={input} />
        </label>
        <label className={field}>
          {t("city")}
          <input name="city" defaultValue={event?.city ?? ""} className={input} />
        </label>
        <label className={field}>
          {t("county")}
          <select name="county_code" defaultValue={event?.county_code ?? ""} className={input}>
            <option value="">—</option>
            {counties.map((county) => (
              <option key={county.code} value={county.code}>
                {county.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
          <input
            type="checkbox"
            name="is_virtual"
            defaultChecked={event?.is_virtual}
            className="size-5"
          />
          {t("virtual")}
        </label>
        <label className={`${field} sm:col-span-2`}>
          {t("website")}
          <input
            type="url"
            name="website_url"
            defaultValue={event?.website_url ?? ""}
            className={input}
          />
        </label>
        <label className={`${field} sm:col-span-2`}>
          {t("registration")}
          <input
            type="url"
            name="registration_url"
            defaultValue={event?.registration_url ?? ""}
            className={input}
          />
        </label>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-lg font-bold">{t("races")}</legend>
        <p className="mb-3 text-sm text-muted">{t("racesHelp")}</p>
        <div className="flex flex-col gap-2">
          {rows.map((race, index) => (
            <div
              key={race.id}
              className="grid grid-cols-[1fr_6rem] gap-2 rounded-lg border border-border p-2 sm:grid-cols-[1fr_9rem_6rem_auto] sm:items-center"
            >
              {!race.isNew && <input type="hidden" name={`race-${index}-id`} value={race.id} />}
              <input
                name={`race-${index}-label`}
                defaultValue={race.label}
                placeholder={t("raceLabel")}
                aria-label={t("raceLabel")}
                className={input}
              />
              <input
                name={`race-${index}-km`}
                defaultValue={race.distance_km ?? ""}
                inputMode="decimal"
                placeholder="km"
                aria-label={t("raceKm")}
                className={input}
              />
              <select
                name={`race-${index}-sport`}
                defaultValue={race.sport_slug}
                aria-label={t("raceSport")}
                className={`${input} col-span-2 sm:col-span-1 sm:col-start-2 sm:row-start-1`}
              >
                {sports.map((sport) => (
                  <option key={sport.slug} value={sport.slug}>
                    {sport.name_ro}
                  </option>
                ))}
              </select>
              {!race.isNew && (
                <label className="col-span-2 flex items-center gap-2 text-sm sm:col-span-1">
                  <input type="checkbox" name={`race-${index}-remove`} className="size-4" />
                  {t("remove")}
                </label>
              )}
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="mb-2 text-lg font-bold">{t("review")}</legend>
        <div className="flex flex-wrap gap-4">
          {(["pending", "approved", "rejected"] as const).map((status) => (
            <label key={status} className="flex items-center gap-2 text-sm font-medium">
              <input
                type="radio"
                name="status"
                value={status}
                defaultChecked={(event?.status ?? "approved") === status}
              />
              {t(`status.${status}`)}
            </label>
          ))}
        </div>
        <label className={field}>
          {t("note")}
          <textarea
            name="review_note"
            defaultValue={event?.review_note ?? ""}
            rows={3}
            className="rounded-lg border border-border bg-background p-2 text-base font-normal"
          />
        </label>
      </fieldset>

      <div>
        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-lg bg-accent px-6 font-semibold text-on-accent hover:opacity-90 disabled:opacity-60"
        >
          {pending ? t("saving") : t("save")}
        </button>
      </div>
    </form>
  );
}
