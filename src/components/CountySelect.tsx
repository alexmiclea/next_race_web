"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Dropdown, OPTION_ROW } from "@/components/Dropdown";
import { matchesSearch, summarizeCounties } from "@/lib/counties";
import type { County } from "@/lib/events";

/**
 * Multi-select for counties: a dropdown of checkboxes with a search box. The
 * checkboxes are named "county", so the form submits ?county=CJ&county=BV — it
 * works without JavaScript too (then without search and summary updates).
 */
export function CountySelect({
  counties,
  defaultSelected,
}: {
  counties: County[];
  defaultSelected: string[];
}) {
  const t = useTranslations("Filters");
  const [selected, setSelected] = useState(() => new Set(defaultSelected));
  const [query, setQuery] = useState("");

  function toggle(code: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(code);
      else next.delete(code);
      return next;
    });
  }

  const selectedNames = counties.filter((c) => selected.has(c.code)).map((c) => c.name);
  const { shown, more } = summarizeCounties(selectedNames);
  const summary =
    shown.length === 0
      ? t("anyCounty")
      : shown.join(", ") + (more > 0 ? ` ${t("moreCounties", { count: more })}` : "");
  const visible = counties.filter((county) => matchesSearch(county.name, query));

  return (
    <Dropdown label={t("county")} summary={<span className="truncate">{summary}</span>}>
      <div className="flex items-center gap-2 p-0.5">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder={t("searchCounty")}
          aria-label={t("searchCounty")}
          className="h-9 w-full min-w-0 rounded-md border border-border bg-background px-2 text-base font-normal"
        />
        {selected.size > 0 && (
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="shrink-0 rounded-md px-2 py-1 text-sm font-medium text-accent hover:bg-surface"
          >
            {t("clearCounties")}
          </button>
        )}
      </div>

      <ul className="mt-1.5 max-h-64 overflow-y-auto" aria-label={t("county")}>
        {counties.map((county) => (
          // Hidden (not removed) when filtered out, so checked boxes still submit.
          <li key={county.code} hidden={!visible.includes(county)}>
            <label className={OPTION_ROW}>
              <input
                type="checkbox"
                name="county"
                value={county.code}
                checked={selected.has(county.code)}
                onChange={(event) => toggle(county.code, event.currentTarget.checked)}
                className="size-4 accent-[var(--accent)]"
              />
              {county.name}
            </label>
          </li>
        ))}
      </ul>
      {visible.length === 0 && (
        <p className="px-2 py-2 text-sm font-normal text-muted">{t("noCountyMatch")}</p>
      )}
    </Dropdown>
  );
}
