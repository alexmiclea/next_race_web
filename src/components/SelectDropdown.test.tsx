import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SelectDropdown } from "./SelectDropdown";

afterEach(cleanup);

const OPTIONS = [
  { value: "", label: "Toate" },
  { value: "running", label: "Alergare", icon: <svg data-testid="icon-running" /> },
  { value: "cycling", label: "Ciclism" },
];

function renderSelect(defaultValue = "") {
  const { container } = render(
    <form>
      <SelectDropdown name="sport" label="Sport" options={OPTIONS} defaultValue={defaultValue} />
    </form>,
  );
  return {
    form: container.querySelector("form")!,
    details: container.querySelector("details")!,
    summary: container.querySelector("summary")!,
  };
}

describe("SelectDropdown", () => {
  it("shows the chosen option in the closed field", () => {
    const { summary } = renderSelect("cycling");
    expect(summary.textContent).toContain("Ciclism");
  });

  it("falls back to the first option for an unknown value", () => {
    const { summary } = renderSelect("swimming");
    expect(summary.textContent).toContain("Toate");
  });

  it("is labelled by the field name and the current value", () => {
    const { summary } = renderSelect("cycling");
    const ids = summary.getAttribute("aria-labelledby")!.split(" ");
    expect(ids.map((id) => document.getElementById(id)!.textContent)).toEqual(["Sport", "Ciclism"]);
  });

  it("submits the chosen value like a <select>", () => {
    const { form } = renderSelect("running");
    expect(new FormData(form).get("sport")).toBe("running");
  });

  it("updates, submits and closes when an option is picked", () => {
    const { form, details, summary } = renderSelect();
    details.open = true;
    fireEvent.click(screen.getByRole("radio", { name: "Ciclism" }));
    expect(new FormData(form).get("sport")).toBe("cycling");
    expect(summary.textContent).toContain("Ciclism");
    expect(details.open).toBe(false);
  });

  it("shows option icons, including in the closed field once chosen", () => {
    renderSelect("running");
    expect(screen.getAllByTestId("icon-running")).toHaveLength(2);
  });
});

describe("Dropdown (shared by all filter dropdowns)", () => {
  it("closes on Escape and returns focus to the field", () => {
    const { details, summary } = renderSelect();
    details.open = true;
    fireEvent.keyDown(document, { key: "Escape" });
    expect(details.open).toBe(false);
    expect(document.activeElement).toBe(summary);
  });

  it("closes when clicking outside, but not inside", () => {
    const { details } = renderSelect();
    details.open = true;
    fireEvent.mouseDown(screen.getByRole("radio", { name: "Alergare" }));
    expect(details.open).toBe(true);
    fireEvent.mouseDown(document.body);
    expect(details.open).toBe(false);
  });
});
