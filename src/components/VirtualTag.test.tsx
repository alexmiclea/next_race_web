import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VirtualTag } from "./VirtualTag";

describe("VirtualTag", () => {
  it("shows its label", () => {
    render(<VirtualTag label="Virtual" />);
    expect(screen.getByText("Virtual")).toBeTruthy();
  });
});
