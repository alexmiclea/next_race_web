"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { readFavoritesFromDocument, saveFavorites, toggleFavorite } from "@/lib/favorites";

/**
 * Star that saves a race to the visitor's favourites (a cookie, no account).
 * Reads the cookie again on every click, so a star toggled in another tab isn't lost.
 */
export function FavoriteButton({
  eventId,
  eventName,
  initial,
  refreshOnChange = false,
  className = "",
}: {
  eventId: string;
  eventName: string;
  initial: boolean;
  /** Re-render the page after a change, e.g. so the favourites page drops the race. */
  refreshOnChange?: boolean;
  className?: string;
}) {
  const t = useTranslations("Favorites");
  const router = useRouter();
  const [saved, setSaved] = useState(initial);

  function toggle() {
    const next = toggleFavorite(readFavoritesFromDocument(), eventId);
    saveFavorites(next);
    setSaved(next.includes(eventId.toLowerCase()));
    if (refreshOnChange) router.refresh();
  }

  const label = saved ? t("remove", { name: eventName }) : t("add", { name: eventName });
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      className={`flex size-10 items-center justify-center rounded-full hover:bg-surface ${saved ? "text-[#e0a800]" : "text-muted"} ${className}`}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        className="size-6"
      >
        <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
      </svg>
    </button>
  );
}
