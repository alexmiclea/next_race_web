import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { COOKIE_NOTICE_COOKIE } from "@/lib/cookie-notice";
import { FAVORITES_COOKIE } from "@/lib/favorites";
import { THEME_COOKIE } from "@/lib/theme";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Cookies");
  return { title: `${t("title")} — Next Race` };
}

export default async function CookiesPage() {
  const t = await getTranslations("Cookies");
  // Every cookie the site sets. Keep this list in sync when adding one.
  const cookies = [
    { name: THEME_COOKIE, purpose: t("theme") },
    { name: FAVORITES_COOKIE, purpose: t("favorites") },
    { name: COOKIE_NOTICE_COOKIE, purpose: t("notice") },
  ];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t("title")}</h1>
      <p className="mt-4 text-lg">{t("intro")}</p>

      <h2 className="mt-8 text-xl font-bold">{t("listTitle")}</h2>
      <dl className="mt-2">
        {cookies.map((cookie) => (
          <div key={cookie.name} className="grid gap-1 border-t border-border py-3 sm:grid-cols-[10rem_1fr]">
            <dt className="font-mono text-sm font-semibold">{cookie.name}</dt>
            <dd className="text-muted">{cookie.purpose}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-8 text-xl font-bold">{t("noTrackingTitle")}</h2>
      <p className="mt-2 text-muted">{t("noTracking")}</p>

      <h2 className="mt-8 text-xl font-bold">{t("thirdPartyTitle")}</h2>
      <p className="mt-2 text-muted">{t("thirdParty")}</p>

      <h2 className="mt-8 text-xl font-bold">{t("deleteTitle")}</h2>
      <p className="mt-2 text-muted">{t("delete")}</p>
    </main>
  );
}
