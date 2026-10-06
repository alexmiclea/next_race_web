"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
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
  className,
}: {
  counties: County[];
  defaultSelected: string[];
  /** Classes for the closed control, matching the other filter fields. */
  className: string;
}) {
  const t = useTranslations("Filters");
  const id = useId();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [selected, setSelected] = useState(() => new Set(defaultSelected));
  const [query, setQuery] = useState("");

  // Close when clicking outside or pressing Escape, like a native dropdown.
  useEffect(() => {
    const details = detailsRef.current;
    if (!details) return;
    const close = (event: Event) => {
      if (!details.open) return;
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (event instanceof MouseEvent && details.contains(event.target as Node)) return;
      details.open = false;
      if (event instanceof KeyboardEvent) details.querySelector("summary")?.focus();
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, []);

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
    <details ref={detailsRef} className="group relative">
      <summary
        aria-labelledby={`${id}-label ${id}-summary`}
        className={`flex cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden ${className}`}
      >
        <span id={`${id}-summary`} className={`truncate ${shown.length === 0 ? "text-muted" : ""}`}>
          {summary}
        </span>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="size-4 shrink-0 text-muted transition group-open:rotate-180"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <span id={`${id}-label`} hidden>
        {t("county")}
      </span>

      <div className="absolute inset-x-0 z-20 mt-1 rounded-lg border border-border bg-background p-2 shadow-lg">
        <div className="flex items-center gap-2">
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

        <ul className="mt-2 max-h-64 overflow-y-auto" aria-label={t("county")}>
          {counties.map((county) => (
            // Hidden (not removed) when filtered out, so checked boxes still submit.
            <li key={county.code} hidden={!visible.includes(county)}>
              <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-base font-normal hover:bg-surface">
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
      </div>
    </details>
  );
}
