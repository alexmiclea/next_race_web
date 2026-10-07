import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { CookieNotice } from "@/components/CookieNotice";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { COOKIE_NOTICE_COOKIE, cookieNoticeSeen } from "@/lib/cookie-notice";
import { FAVORITES_COOKIE, parseFavorites } from "@/lib/favorites";
import { parseTheme, THEME_COOKIE } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  // latin-ext covers Romanian diacritics (ă, â, î, ș, ț).
  subsets: ["latin", "latin-ext"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return { title: t("title"), description: t("description") };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const cookieStore = await cookies();
  const theme = parseTheme(cookieStore.get(THEME_COOKIE)?.value);
  const favoriteCount = parseFavorites(cookieStore.get(FAVORITES_COOKIE)?.value).length;
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
          <SiteHeader theme={theme} favoriteCount={favoriteCount} />
          {children}
          <SiteFooter />
          {showCookieNotice && <CookieNotice />}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
