import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DonateLink } from "@/components/DonateLink";
import { CONTACT_EMAIL } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("About");
  return { title: `${t("title")} — Next Race` };
}

export default async function AboutPage() {
  const t = await getTranslations("About");
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t("title")}</h1>
      <p className="mt-4 text-lg">{t("intro")}</p>

      <h2 className="mt-8 text-xl font-bold">{t("dataTitle")}</h2>
      <p className="mt-2 text-muted">{t("data")}</p>

      <h2 className="mt-8 text-xl font-bold">{t("organizersTitle")}</h2>
      <p className="mt-2 text-muted">{t("organizers")}</p>

      <h2 className="mt-8 text-xl font-bold">{t("supportTitle")}</h2>
      <p className="mt-2 text-muted">{t("support")}</p>
      <p className="mt-3">
        <DonateLink label={t("supportButton")} />
      </p>

      <h2 className="mt-8 text-xl font-bold">{t("contactTitle")}</h2>
      <p className="mt-2 text-muted">
        {t("contact")}{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-accent underline">
          {CONTACT_EMAIL}
        </a>
      </p>
    </main>
  );
}
