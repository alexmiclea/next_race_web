"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { filtersQuery } from "@/lib/filters";

/** Typing a date on a keyboard changes the value several times; wait until it settles. */
export const DATE_DELAY_MS = 700;

/**
 * Name of the field that had focus when the filters were applied. The form is
 * re-created with the new results, so focus is restored there for keyboard users.
 */
let focusAfterApply: string | null = null;

/**
 * Filter form that applies itself: results update as soon as a filter changes,
 * without a submit button. Dropdowns apply immediately, dates after a short pause,
 * and the county checkboxes when their dropdown closes (so picking several counties
 * loads once). Without JavaScript it is a normal GET form with its Apply button.
 */
export function AutoApplyForm({
  action,
  label,
  className,
  children,
}: {
  /** Page the filters apply to ("/" or "/harta"). Always an internal path. */
  action: string;
  label: string;
  className: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const dateTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const apply = useCallback(() => {
    clearTimeout(dateTimer.current);
    const form = formRef.current;
    if (!form) return;
    const query = filtersQuery(new FormData(form));
    const url = query ? `${action}?${query}` : action;
    if (url !== window.location.pathname + window.location.search) {
      const active = document.activeElement as HTMLInputElement | null;
      focusAfterApply = active && form.contains(active) && active.name ? active.name : null;
      router.replace(url, { scroll: false });
    }
  }, [action, router]);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    // Lets CSS hide the Apply button once the form applies itself.
    form.dataset.enhanced = "";
    if (focusAfterApply) {
      const field = form.elements.namedItem(focusAfterApply);
      if (field instanceof HTMLElement) field.focus();
      focusAfterApply = null;
    }
    // "toggle" doesn't bubble, so listen in the capture phase for any dropdown closing.
    const onToggle = (event: Event) => {
      if (event.target instanceof HTMLDetailsElement && !event.target.open) apply();
    };
    form.addEventListener("toggle", onToggle, true);
    return () => {
      form.removeEventListener("toggle", onToggle, true);
      clearTimeout(dateTimer.current);
    };
  }, [apply]);

  function onChange(event: React.ChangeEvent<HTMLFormElement>) {
    const field = event.target as unknown as HTMLInputElement | HTMLSelectElement;
    if (!field.name) return; // e.g. the county search box
    if (field.closest("details")) return; // applied when the dropdown closes
    if (field.type === "date") {
      clearTimeout(dateTimer.current);
      dateTimer.current = setTimeout(apply, DATE_DELAY_MS);
    } else {
      apply();
    }
  }

  return (
    <form
      ref={formRef}
      action={action}
      aria-label={label}
      className={`group ${className}`}
      onChange={onChange}
      onSubmit={(event) => {
        event.preventDefault();
        apply();
      }}
    >
      {children}
    </form>
  );
}
