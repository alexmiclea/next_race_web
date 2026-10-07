"use client";

import { forwardRef, useEffect, useId, useImperativeHandle, useRef, type ReactNode } from "react";

/** Shared look for every filter field, closed and open. */
export const DROPDOWN_FIELD =
  "flex h-10 w-full min-w-0 cursor-pointer list-none items-center justify-between gap-2 rounded-lg border border-border bg-background px-2 text-base font-normal text-foreground [&::-webkit-details-marker]:hidden";
const PANEL =
  "absolute inset-x-0 z-30 mt-1 rounded-lg border border-border bg-background p-1.5 shadow-lg";

export type DropdownHandle = { close: () => void };

/**
 * A field that opens a panel below it, used for all the filter dropdowns so they look
 * and behave the same on every device. Built on <details>, so it opens and closes
 * without JavaScript too; with JavaScript it also closes on Escape or a click outside.
 */
export const Dropdown = forwardRef<
  DropdownHandle,
  {
    /** Field name shown above the control, e.g. "Județ". */
    label: string;
    /** Current value shown in the closed field. */
    summary: ReactNode;
    children: ReactNode;
  }
>(function Dropdown({ label, summary, children }, ref) {
  const id = useId();
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useImperativeHandle(ref, () => ({
    close() {
      const details = detailsRef.current;
      if (!details?.open) return;
      details.open = false;
      details.querySelector("summary")?.focus();
    },
  }));

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

  return (
    <div className="flex min-w-0 flex-col gap-1 text-sm font-medium">
      <span id={`${id}-label`}>{label}</span>
      <details ref={detailsRef} className="group relative">
        <summary aria-labelledby={`${id}-label ${id}-value`} className={DROPDOWN_FIELD}>
          <span id={`${id}-value`} className="flex min-w-0 items-center gap-2 truncate">
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
        <div className={PANEL}>{children}</div>
      </details>
    </div>
  );
});

/** One row in a dropdown panel: a radio or checkbox with its text, same height everywhere. */
export const OPTION_ROW =
  "flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-base font-normal hover:bg-surface has-[:checked]:font-semibold";
