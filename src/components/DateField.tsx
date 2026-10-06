"use client";

import { useState } from "react";

/**
 * Date input with its own placeholder and calendar icon. Browsers draw empty date
 * inputs inconsistently: iOS Safari shows a blank box, and some dark themes hide the
 * native icon. Without JavaScript it falls back to the plain native input.
 */
export function DateField({
  name,
  defaultValue,
  placeholder,
  className,
}: {
  name: string;
  defaultValue?: string;
  placeholder: string;
  className: string;
}) {
  const [empty, setEmpty] = useState(!defaultValue);

  return (
    <span className="relative block">
      <input
        type="date"
        name={name}
        defaultValue={defaultValue}
        onChange={(event) => setEmpty(!event.currentTarget.value)}
        className={`date-field peer pr-9 ${empty ? "not-focus:text-transparent" : ""} ${className}`}
      />
      {empty && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-base font-normal text-muted peer-focus:hidden"
        >
          {placeholder}
        </span>
      )}
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute right-2.5 top-1/2 size-5 -translate-y-1/2 text-muted"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    </span>
  );
}
