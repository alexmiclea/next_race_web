import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { DonateLink } from "@/components/DonateLink";
import { Slogan } from "@/components/Slogan";
import { CONTACT_PATH, SITE_NAME } from "@/lib/site";

export async function SiteFooter() {
  const t = await getTranslations("Footer");
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 text-sm text-muted sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p>
            <strong className="text-foreground">{SITE_NAME}</strong> — <Slogan />
          </p>
          <p>{t("tagline")}</p>
          <p>{t("disclaimer")}</p>
          <p className="flex gap-4">
            <Link href={CONTACT_PATH} className="underline hover:text-foreground">
              {t("contact")}
            </Link>
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
