import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";
import messages from "../../messages/ro.json";
import { cookieNoticeCookie, cookieNoticeSeen } from "@/lib/cookie-notice";
import { CookieNotice } from "./CookieNotice";

afterEach(() => {
  cleanup();
  document.cookie = "cookie_notice=; Path=/; Max-Age=0";
});

function renderNotice() {
  render(
    <NextIntlClientProvider locale="ro" messages={messages}>
      <CookieNotice />
    </NextIntlClientProvider>,
  );
}

describe("CookieNotice", () => {
  it("explains the cookies and links to the cookie page", () => {
    renderNotice();
    expect(screen.getByRole("region", { name: "Despre cookie-uri" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Detalii" }).getAttribute("href")).toBe("/cookies");
  });

  it("hides itself and remembers the choice when dismissed", () => {
    renderNotice();
    fireEvent.click(screen.getByRole("button", { name: "Am înțeles" }));
    expect(screen.queryByRole("region")).toBeNull();
    expect(document.cookie).toContain("cookie_notice=ok");
  });
});

describe("cookie notice cookie", () => {
  it('counts only "ok" as seen', () => {
    expect(cookieNoticeSeen("ok")).toBe(true);
    expect(cookieNoticeSeen(undefined)).toBe(false);
    expect(cookieNoticeSeen("yes")).toBe(false);
  });

  it("is remembered site-wide for a year", () => {
    expect(cookieNoticeCookie()).toBe("cookie_notice=ok; Path=/; Max-Age=31536000; SameSite=Lax");
  });
});
