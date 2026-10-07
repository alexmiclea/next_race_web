"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { cookieNoticeCookie } from "@/lib/cookie-notice";

/**
 * Tells visitors which cookies the site uses. Informational, not a consent form:
 * the site only sets cookies the visitor asks for (theme, favourites) and no tracking
 * cookies. If analytics or ads are ever added, this must become a real consent banner.
 */
export function CookieNotice() {
  const t = useTranslations("CookieNotice");
  const [open, setOpen] = useState(true);
  if (!open) return null;

  return (
    <section
      aria-label={t("label")}
      className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-xl rounded-xl border border-border bg-background p-4 text-sm shadow-lg sm:inset-x-6"
    >
      <p>
        {t("text")}{" "}
        <Link href="/cookies" className="font-medium text-accent underline">
          {t("more")}
        </Link>
      </p>
      <button
        type="button"
        onClick={() => {
          document.cookie = cookieNoticeCookie();
          setOpen(false);
        }}
        className="mt-3 h-9 rounded-lg bg-accent px-4 font-semibold text-on-accent hover:opacity-90"
      >
        {t("ok")}
      </button>
    </section>
  );
}
