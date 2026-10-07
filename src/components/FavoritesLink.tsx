"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { FAVORITES_EVENT } from "@/lib/favorites";

/** "Favorite" link with a live count badge of saved races. */
export function FavoritesLink({
  initialCount,
  className,
}: {
  initialCount: number;
  className: string;
}) {
  const t = useTranslations("Nav");
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const update = (event: Event) => setCount((event as CustomEvent<string[]>).detail.length);
    window.addEventListener(FAVORITES_EVENT, update);
    return () => window.removeEventListener(FAVORITES_EVENT, update);
  }, []);

  return (
    <Link href="/favorite" className={`inline-flex items-center gap-1.5 ${className}`}>
      {t("favorites")}
      {count > 0 && (
        <>
          <span
            aria-hidden
            className="min-w-5 rounded-full bg-accent px-1.5 text-center text-xs font-bold leading-5 text-on-accent"
          >
            {count}
          </span>
          <span className="sr-only">{t("favoritesCount", { count })}</span>
        </>
      )}
    </Link>
  );
}
