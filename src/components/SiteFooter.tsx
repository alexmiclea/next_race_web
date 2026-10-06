import { getTranslations } from "next-intl/server";

export async function SiteFooter() {
  const t = await getTranslations("Footer");
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto max-w-5xl space-y-1 px-4 py-6 text-sm text-muted">
        <p>
          <strong className="text-foreground">Next Race</strong> — {t("tagline")}
        </p>
        <p>{t("draft")}</p>
      </div>
    </footer>
  );
}
