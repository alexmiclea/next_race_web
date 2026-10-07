import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SportIcon, SportTag } from "./SportTag";

afterEach(cleanup);

describe("SportTag", () => {
  it("shows the sport name in the sport's colour class", () => {
    render(<SportTag slug="swimming" name="Înot" />);
    const tag = screen.getByText("Înot");
    expect(tag.className).toContain("sport-swimming");
    expect(tag.className).toContain("text-sport-ink");
  });

  it("uses the neutral style for a sport without its own colour", () => {
    render(<SportTag slug="duathlon" name="Duatlon" />);
    expect(screen.getByText("Duatlon").className).toContain("sport-other");
  });

  it("hides the icon from screen readers, since the name is already there", () => {
    render(<SportTag slug="cycling" name="Ciclism" />);
    expect(screen.getByText("Ciclism").querySelector("svg")!.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });
});

describe("SportIcon", () => {
  it("draws a different icon for each sport", () => {
    const shapes = ["running", "swimming", "cycling", "triathlon", "other"].map((slug) => {
      const { container, unmount } = render(<SportIcon slug={slug} />);
      const html = container.innerHTML;
      unmount();
      return html;
    });
    expect(new Set(shapes).size).toBe(shapes.length);
  });
});
