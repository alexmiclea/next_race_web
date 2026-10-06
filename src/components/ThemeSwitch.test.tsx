import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";
import messages from "../../messages/ro.json";
import type { Theme } from "@/lib/theme";
import { ThemeSwitch } from "./ThemeSwitch";

afterEach(() => {
  cleanup();
  delete document.documentElement.dataset.theme;
  document.cookie = "theme=; Path=/; Max-Age=0";
});

function renderSwitch(initialTheme: Theme) {
  render(
    <NextIntlClientProvider locale="ro" messages={messages}>
      <ThemeSwitch initialTheme={initialTheme} />
    </NextIntlClientProvider>,
  );
  return screen.getByRole("button");
}

describe("ThemeSwitch", () => {
  it("announces the current theme", () => {
    expect(renderSwitch("system").getAttribute("aria-label")).toBe("Temă: sistem");
  });

  it("cycles system → light → dark → system, updating the page and cookie", () => {
    const button = renderSwitch("system");

    fireEvent.click(button);
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.cookie).toContain("theme=light");
    expect(button.getAttribute("aria-label")).toBe("Temă: luminoasă");

    fireEvent.click(button);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.cookie).toContain("theme=dark");

    fireEvent.click(button);
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(document.cookie).toContain("theme=system");
  });
});
