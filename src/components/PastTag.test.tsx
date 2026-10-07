import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PastTag } from "./PastTag";

afterEach(cleanup);

describe("PastTag", () => {
  it("shows its label in a neutral style", () => {
    render(<PastTag label="A avut loc" />);
    const tag = screen.getByText("A avut loc");
    expect(tag.className).toContain("text-muted");
  });
});
