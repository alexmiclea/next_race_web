import { getRequestConfig } from "next-intl/server";

// Romanian only for now. To add English, switch to next-intl's locale routing
// and add messages/en.json with the same keys.
export const defaultLocale = "ro";

export default getRequestConfig(async () => {
  const locale = defaultLocale;
  return {
    locale,
    timeZone: "Europe/Bucharest",
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
