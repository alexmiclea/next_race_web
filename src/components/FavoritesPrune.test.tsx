import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FAVORITES_EVENT, favoritesCookie, readFavoritesFromDocument } from "@/lib/favorites";
import { FavoritesPrune } from "./FavoritesPrune";

const A = "3f2b8c1e-9a4d-4e7f-8b2a-1c5d6e7f8a9b";
const B = "da78ecc7-54dd-4fd1-851f-fa5b4d41f019";

afterEach(() => {
  cleanup();
  document.cookie = "favorites=; Path=/; Max-Age=0";
});

describe("FavoritesPrune", () => {
  it("drops favourites that are no longer listed (past or removed races)", () => {
    document.cookie = favoritesCookie([A, B]);
    const listener = vi.fn();
    window.addEventListener(FAVORITES_EVENT, listener);
    render(<FavoritesPrune keep={[B]} />);
    window.removeEventListener(FAVORITES_EVENT, listener);
    expect(readFavoritesFromDocument()).toEqual([B]);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("leaves the cookie alone when nothing needs dropping", () => {
    document.cookie = favoritesCookie([A]);
    const listener = vi.fn();
    window.addEventListener(FAVORITES_EVENT, listener);
    render(<FavoritesPrune keep={[A]} />);
    window.removeEventListener(FAVORITES_EVENT, listener);
    expect(listener).not.toHaveBeenCalled();
  });
});
