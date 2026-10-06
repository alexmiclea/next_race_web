"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { nextTheme, themeCookie, type Theme } from "@/lib/theme";

/**
 * Cycles the colour theme: system → light → dark. The choice is saved in a cookie,
 * so the server renders the right theme on the next visit without a flash.
 */
export function ThemeSwitch({ initialTheme }: { initialTheme: Theme }) {
  const t = useTranslations("Theme");
  const [theme, setTheme] = useState(initialTheme);

  function choose(next: Theme) {
    setTheme(next);
    document.cookie = themeCookie(next);
    if (next === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = next;
  }

  const label = t("label", { theme: t(theme) });
  return (
    <button
      type="button"
      onClick={() => choose(nextTheme(theme))}
      aria-label={label}
      title={label}
      className="flex size-9 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-foreground"
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
      >
        {ICONS[theme]}
      </svg>
    </button>
  );
}

const ICONS: Record<Theme, React.ReactNode> = {
  // Half-filled circle: follows the device.
  system: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />
    </>
  ),
  light: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  dark: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
};
