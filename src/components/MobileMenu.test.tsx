import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import messages from "../../messages/ro.json";
import { MobileMenu } from "./MobileMenu";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

afterEach(cleanup);

function renderMenu() {
  const result = render(
    <NextIntlClientProvider locale="ro" messages={messages}>
      <MobileMenu>
        <a href="/harta">Hartă</a>
      </MobileMenu>
    </NextIntlClientProvider>,
  );
  return { ...result, details: result.container.querySelector("details")! };
}

describe("MobileMenu", () => {
  it('has a button labelled "Meniu" that holds the links', () => {
    const { details } = renderMenu();
    expect(screen.getByLabelText("Meniu").tagName).toBe("SUMMARY");
    expect(details.querySelector('a[href="/harta"]')).toBeTruthy();
  });

  it("closes on Escape and when tapping outside", () => {
    const { details } = renderMenu();
    details.open = true;
    fireEvent.keyDown(document, { key: "Escape" });
    expect(details.open).toBe(false);

    details.open = true;
    fireEvent.mouseDown(document.body);
    expect(details.open).toBe(false);
  });

  it("closes after navigating to another page", () => {
    const { details, rerender } = renderMenu();
    details.open = true;
    pathname = "/harta";
    rerender(
      <NextIntlClientProvider locale="ro" messages={messages}>
        <MobileMenu>
          <a href="/harta">Hartă</a>
        </MobileMenu>
      </NextIntlClientProvider>,
    );
    expect(details.open).toBe(false);
  });
});
