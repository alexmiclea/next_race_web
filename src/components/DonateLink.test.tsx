import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DONATE_URL } from "@/lib/site";
import { DONATE_LABEL, DonateLink } from "./DonateLink";

afterEach(cleanup);

describe("DonateLink", () => {
  it('always says "Buy me a coffee", whatever the site language', () => {
    render(<DonateLink />);
    expect(DONATE_LABEL).toBe("Buy me a coffee");
    expect(screen.getByRole("link", { name: "Buy me a coffee" })).toBeTruthy();
  });

  it("is marked as English for screen readers", () => {
    render(<DonateLink />);
    expect(screen.getByRole("link").getAttribute("lang")).toBe("en");
  });

  it("links to the donation page", () => {
    render(<DonateLink />);
    expect(screen.getByRole("link").getAttribute("href")).toBe(DONATE_URL);
    expect(DONATE_URL).toBe("https://buymeacoffee.com/alexeimiclea");
  });

  it("opens in a new tab without giving the other site access to ours", () => {
    render(<DonateLink />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("keeps the coffee emoji out of the link's accessible name", () => {
    render(<DonateLink />);
    expect(screen.getByRole("link").textContent).toContain("☕");
    expect(screen.getByRole("link", { name: DONATE_LABEL })).toBeTruthy();
  });
});
