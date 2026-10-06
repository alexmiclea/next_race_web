import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DateField } from "./DateField";

afterEach(cleanup);

function renderField(defaultValue?: string) {
  const { container } = render(
    <form>
      <DateField name="from" defaultValue={defaultValue} placeholder="Alege data" className="" />
    </form>,
  );
  const input = container.querySelector<HTMLInputElement>('input[type="date"]')!;
  return { input, form: container.querySelector("form")! };
}

describe("DateField", () => {
  it("shows the placeholder and hides the native text while empty", () => {
    const { input } = renderField();
    expect(screen.getByText("Alege data")).toBeTruthy();
    expect(input.className).toContain("not-focus:text-transparent");
  });

  it("shows no placeholder when a date is already set", () => {
    const { input } = renderField("2027-04-24");
    expect(screen.queryByText("Alege data")).toBeNull();
    expect(input.value).toBe("2027-04-24");
    expect(input.className).not.toContain("text-transparent");
  });

  it("hides the placeholder once a date is picked, and shows it again when cleared", () => {
    const { input } = renderField();
    fireEvent.change(input, { target: { value: "2027-05-01" } });
    expect(screen.queryByText("Alege data")).toBeNull();
    fireEvent.change(input, { target: { value: "" } });
    expect(screen.getByText("Alege data")).toBeTruthy();
  });

  it("submits its value with the form under its name", () => {
    const { form } = renderField("2027-04-24");
    expect(new FormData(form).get("from")).toBe("2027-04-24");
  });

  it("keeps the placeholder and icon out of the accessibility tree", () => {
    const { input } = renderField();
    const placeholder = screen.getByText("Alege data");
    expect(placeholder.getAttribute("aria-hidden")).toBe("true");
    expect(input.parentElement!.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });
});
