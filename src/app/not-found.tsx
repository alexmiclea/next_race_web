import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("NotFound");
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted">{t("text")}</p>
      <Link href="/" className="mt-6 inline-block font-semibold text-accent underline">
        {t("back")}
      </Link>
    </main>
  );
}
