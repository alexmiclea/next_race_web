"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * The ☰ menu for narrow screens. Built on <details> (works without JavaScript);
 * closes on navigation, Escape or a tap outside.
 */
export function MobileMenu({ children }: { children: ReactNode }) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const ref = useRef<HTMLDetailsElement>(null);

  // The header stays mounted across pages, so close the menu after each navigation.
  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [pathname]);

  useEffect(() => {
    const details = ref.current;
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
    <details ref={ref} className="group">
      <summary
        aria-label={t("menu")}
        className="flex size-9 cursor-pointer list-none items-center justify-center rounded-md text-muted hover:bg-surface hover:text-foreground [&::-webkit-details-marker]:hidden"
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="size-6"
        >
          {/* ☰ when closed, ✕ when open. */}
          <path d="M4 7h16M4 12h16M4 17h16" className="group-open:hidden" />
          <path d="M6 6l12 12M18 6L6 18" className="hidden group-open:block" />
        </svg>
      </summary>
      <div className="absolute inset-x-0 top-full z-40 border-b border-border bg-background shadow-lg">
        {children}
      </div>
    </details>
  );
}
