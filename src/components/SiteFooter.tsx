import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { DonateLink } from "@/components/DonateLink";

export async function SiteFooter() {
  const t = await getTranslations("Footer");
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 text-sm text-muted sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p>
            <strong className="text-foreground">Next Race</strong> — {t("tagline")}
          </p>
          <p>{t("draft")}</p>
          <p>
            <Link href="/cookies" className="underline hover:text-foreground">
              {t("cookies")}
            </Link>
          </p>
        </div>
        <DonateLink />
      </div>
    </footer>
  );
}
