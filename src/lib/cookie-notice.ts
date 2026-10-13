/** The cookie that remembers the visitor has seen the cookie notice. */
export const COOKIE_NOTICE_COOKIE = "cookie_notice";

export function cookieNoticeSeen(value: string | undefined): boolean {
  return value === "ok";
}

/** Remembers the dismissal for a year, on every page. */
export function cookieNoticeCookie(): string {
  return `${COOKIE_NOTICE_COOKIE}=ok; Path=/; Max-Age=31536000; SameSite=Lax`;
}
