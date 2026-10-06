"use client";

import { useTranslations } from "next-intl";

export default function Error() {
  const t = useTranslations("Home");
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <p role="alert" className="rounded-xl border border-border p-6 text-center">
        {t("error")}
      </p>
    </main>
  );
}
