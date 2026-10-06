import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";
import messages from "../../messages/ro.json";
import { CountySelect } from "./CountySelect";

afterEach(cleanup);

const COUNTIES = [
  { code: "AB", name: "Alba" },
  { code: "BV", name: "Brașov" },
  { code: "CJ", name: "Cluj" },
  { code: "SB", name: "Sibiu" },
];

function renderSelect(defaultSelected: string[] = []) {
  const { container } = render(
    <NextIntlClientProvider locale="ro" messages={messages}>
      <form>
        <CountySelect counties={COUNTIES} defaultSelected={defaultSelected} className="" />
      </form>
    </NextIntlClientProvider>,
  );
  const form = container.querySelector("form")!;
  return {
    form,
    details: container.querySelector("details")!,
    summary: container.querySelector("summary")!,
    submitted: () => new FormData(form).getAll("county"),
  };
}

describe("CountySelect", () => {
  it('shows "all counties" when nothing is selected', () => {
    const { summary, submitted } = renderSelect();
    expect(summary.textContent).toContain("Toate județele");
    expect(submitted()).toEqual([]);
  });

  it("starts with the counties from the URL selected", () => {
    const { summary, submitted } = renderSelect(["CJ", "BV"]);
    expect(summary.textContent).toContain("Brașov, Cluj");
    expect(submitted()).toEqual(["BV", "CJ"]);
  });

  it("summarises long selections", () => {
    const { summary } = renderSelect(["AB", "BV", "CJ", "SB"]);
    expect(summary.textContent).toContain("Alba, Brașov +2");
  });

  it("submits every checked county", () => {
    const { summary, submitted } = renderSelect();
    fireEvent.click(screen.getByRole("checkbox", { name: "Cluj" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Sibiu" }));
    expect(submitted()).toEqual(["CJ", "SB"]);
    expect(summary.textContent).toContain("Cluj, Sibiu");

    fireEvent.click(screen.getByRole("checkbox", { name: "Cluj" }));
    expect(submitted()).toEqual(["SB"]);
  });

  it("filters the list by search, ignoring diacritics, without losing selections", () => {
    const { submitted } = renderSelect(["CJ"]);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "brasov" } });

    expect(screen.getByRole("checkbox", { name: "Brașov" }).closest("li")!.hidden).toBe(false);
    expect(screen.queryByRole("checkbox", { name: "Cluj" })).toBeNull();
    const cluj = screen.getByRole("checkbox", { name: "Cluj", hidden: true });
    expect(cluj.closest("li")!.hidden).toBe(true);
    // Cluj is hidden by the search but still selected.
    expect(submitted()).toEqual(["CJ"]);
  });

  it("says so when the search matches nothing", () => {
    renderSelect();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "xyz" } });
    expect(screen.getByText("Niciun județ găsit")).toBeTruthy();
  });

  it("clears the selection", () => {
    const { submitted } = renderSelect(["CJ", "BV"]);
    fireEvent.click(screen.getByRole("button", { name: "Șterge" }));
    expect(submitted()).toEqual([]);
    expect(screen.queryByRole("button", { name: "Șterge" })).toBeNull();
  });

  it("closes on Escape and when clicking outside", () => {
    const { details } = renderSelect();
    details.open = true;
    fireEvent.keyDown(document, { key: "Escape" });
    expect(details.open).toBe(false);

    details.open = true;
    fireEvent.mouseDown(document.body);
    expect(details.open).toBe(false);
  });

  it("stays open when clicking inside", () => {
    const { details } = renderSelect();
    details.open = true;
    fireEvent.mouseDown(screen.getByRole("checkbox", { name: "Alba" }));
    expect(details.open).toBe(true);
  });
});
