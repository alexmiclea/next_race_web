import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../messages/ro.json";
import { favoritesCookie, readFavoritesFromDocument } from "@/lib/favorites";
import { FavoriteButton } from "./FavoriteButton";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const A = "3f2b8c1e-9a4d-4e7f-8b2a-1c5d6e7f8a9b";
const B = "da78ecc7-54dd-4fd1-851f-fa5b4d41f019";

beforeEach(() => refresh.mockClear());
afterEach(() => {
  cleanup();
  document.cookie = "favorites=; Path=/; Max-Age=0";
});

function renderButton(initial: boolean, refreshOnChange = false) {
  render(
    <NextIntlClientProvider locale="ro" messages={messages}>
      <FavoriteButton
        eventId={A}
        eventName="Cheile Turzii Race"
        initial={initial}
        refreshOnChange={refreshOnChange}
      />
    </NextIntlClientProvider>,
  );
  return screen.getByRole("button");
}

describe("FavoriteButton", () => {
  it("names the race and says what a click will do", () => {
    const button = renderButton(false);
    expect(button.getAttribute("aria-label")).toBe("Adaugă Cheile Turzii Race la favorite");
    expect(button.getAttribute("aria-pressed")).toBe("false");
  });

  it("saves the race in the cookie, then removes it again", () => {
    const button = renderButton(false);
    fireEvent.click(button);
    expect(readFavoritesFromDocument()).toEqual([A]);
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.getAttribute("aria-label")).toBe("Scoate Cheile Turzii Race de la favorite");

    fireEvent.click(button);
    expect(readFavoritesFromDocument()).toEqual([]);
    expect(button.getAttribute("aria-pressed")).toBe("false");
  });

  it("keeps favourites saved elsewhere (e.g. another tab)", () => {
    const button = renderButton(false);
    document.cookie = favoritesCookie([B]);
    fireEvent.click(button);
    expect(readFavoritesFromDocument()).toEqual([B, A]);
  });

  it("refreshes the page only when asked to", () => {
    fireEvent.click(renderButton(false));
    expect(refresh).not.toHaveBeenCalled();
    cleanup();
    fireEvent.click(renderButton(true, true));
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
