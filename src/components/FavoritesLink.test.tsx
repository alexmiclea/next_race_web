import { act, cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";
import messages from "../../messages/ro.json";
import { saveFavorites } from "@/lib/favorites";
import { FavoritesLink } from "./FavoritesLink";

const A = "3f2b8c1e-9a4d-4e7f-8b2a-1c5d6e7f8a9b";
const B = "da78ecc7-54dd-4fd1-851f-fa5b4d41f019";

afterEach(() => {
  cleanup();
  document.cookie = "favorites=; Path=/; Max-Age=0";
});

function renderLink(initialCount: number) {
  render(
    <NextIntlClientProvider locale="ro" messages={messages}>
      <FavoritesLink initialCount={initialCount} className="" />
    </NextIntlClientProvider>,
  );
  return screen.getByRole("link");
}

describe("FavoritesLink", () => {
  it('links to the favourites page as "Favorite", with no badge when empty', () => {
    const link = renderLink(0);
    expect(link.getAttribute("href")).toBe("/favorite");
    expect(link.textContent).toBe("Favorite");
  });

  it("shows the count, with a readable version for screen readers", () => {
    const link = renderLink(3);
    expect(link.textContent).toContain("3");
    expect(screen.getByText("3 concursuri salvate")).toBeTruthy();
  });

  it("updates live when a star is tapped anywhere on the page", () => {
    const link = renderLink(1);
    act(() => saveFavorites([A, B]));
    expect(screen.getByText("2 concursuri salvate")).toBeTruthy();
    act(() => saveFavorites([]));
    expect(link.textContent).toBe("Favorite");
  });
});
