import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { CookieNotice } from "@/components/CookieNotice";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { COOKIE_NOTICE_COOKIE, cookieNoticeSeen } from "@/lib/cookie-notice";
import { getAdminIfSignedIn } from "@/lib/admin/session";
import { countUpcoming } from "@/lib/events";
import { FAVORITES_COOKIE, parseFavorites } from "@/lib/favorites";
import { SITE_NAME, SLOGAN } from "@/lib/site";
import { parseTheme, THEME_COOKIE } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  // latin-ext covers Romanian diacritics (ă, â, î, ș, ț).
  subsets: ["latin", "latin-ext"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    title: { default: `${SITE_NAME} — ${SLOGAN}`, template: `%s — ${SITE_NAME}` },
    description: t("description"),
    applicationName: SITE_NAME,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const cookieStore = await cookies();
  const theme = parseTheme(cookieStore.get(THEME_COOKIE)?.value);
  // Only upcoming favourites count; past ones stay saved but would inflate the number.
  // The layout wraps every page, so a failed count just hides the badge.
  const favoriteCount = await countUpcoming(
    parseFavorites(cookieStore.get(FAVORITES_COOKIE)?.value),
  ).catch(() => 0);
  // Only the admin carries a login cookie; for everyone else this is a no-op.
  const isAdmin = Boolean(await getAdminIfSignedIn().catch(() => null));
  const showCookieNotice = !cookieNoticeSeen(cookieStore.get(COOKIE_NOTICE_COOKIE)?.value);
  return (
    <html
      lang={locale}
      // No attribute for "system": the CSS then follows the device setting.
      data-theme={theme === "system" ? undefined : theme}
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          <SiteHeader theme={theme} favoriteCount={favoriteCount} isAdmin={isAdmin} />
          {children}
          <SiteFooter />
          {showCookieNotice && <CookieNotice />}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
