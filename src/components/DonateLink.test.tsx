import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DONATE_URL } from "@/lib/site";
import { DonateLink } from "./DonateLink";

afterEach(cleanup);

describe("DonateLink", () => {
  it("links to the donation page with the given label", () => {
    render(<DonateLink label="Cinstește-ne cu o cafea" />);
    const link = screen.getByRole("link", { name: "Cinstește-ne cu o cafea" });
    expect(link.getAttribute("href")).toBe(DONATE_URL);
    expect(DONATE_URL).toBe("https://buymeacoffee.com/alexeimiclea");
  });

  it("opens in a new tab without giving the other site access to ours", () => {
    render(<DonateLink label="Cafea" />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("keeps the coffee emoji out of the link's accessible name", () => {
    render(<DonateLink label="Cafea" />);
    expect(screen.getByRole("link").textContent).toContain("☕");
    expect(screen.getByRole("link", { name: "Cafea" })).toBeTruthy();
  });
});
