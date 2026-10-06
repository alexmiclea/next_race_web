import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AutoApplyForm, DATE_DELAY_MS } from "./AutoApplyForm";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

beforeEach(() => {
  replace.mockClear();
  window.history.replaceState(null, "", "/");
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function renderForm(action = "/") {
  const { container, unmount } = render(
    <AutoApplyForm action={action} label="Filtrează" className="">
      <select name="sport" defaultValue="">
        <option value="">Toate</option>
        <option value="running">Alergare</option>
      </select>
      <input type="date" name="from" defaultValue="" />
      <details>
        <summary>Județ</summary>
        <input type="search" aria-label="Caută" />
        <input type="checkbox" name="county" value="CJ" aria-label="Cluj" />
        <input type="checkbox" name="county" value="BV" aria-label="Brașov" />
      </details>
      <button type="submit">Aplică</button>
    </AutoApplyForm>,
  );
  const get = <T extends Element>(selector: string) => container.querySelector<T>(selector)!;
  return {
    form: get<HTMLFormElement>("form"),
    sport: get<HTMLSelectElement>("select"),
    date: get<HTMLInputElement>('input[type="date"]'),
    details: get<HTMLDetailsElement>("details"),
    search: get<HTMLInputElement>('input[type="search"]'),
    checkbox: (value: string) => get<HTMLInputElement>(`input[value="${value}"]`),
    unmount,
  };
}

/** jsdom doesn't fire "toggle" when `open` changes, so dispatch it like a browser. */
function setOpen(details: HTMLDetailsElement, open: boolean) {
  details.open = open;
  details.dispatchEvent(new Event("toggle"));
}

describe("AutoApplyForm", () => {
  it("marks itself as enhanced so the Apply button can be hidden", () => {
    const { form } = renderForm();
    expect(form.dataset.enhanced).toBe("");
  });

  it("applies a dropdown change immediately, without scrolling", () => {
    const { sport } = renderForm();
    fireEvent.change(sport, { target: { value: "running" } });
    expect(replace).toHaveBeenCalledWith("/?sport=running", { scroll: false });
  });

  it("applies to the page it belongs to", () => {
    const { sport } = renderForm("/harta");
    fireEvent.change(sport, { target: { value: "running" } });
    expect(replace).toHaveBeenCalledWith("/harta?sport=running", { scroll: false });
  });

  it("waits for a date to settle before applying", () => {
    vi.useFakeTimers();
    const { date } = renderForm();
    fireEvent.change(date, { target: { value: "0002-04-01" } });
    fireEvent.change(date, { target: { value: "2027-04-01" } });
    expect(replace).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(DATE_DELAY_MS));
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/?from=2027-04-01", { scroll: false });
  });

  it("applies counties when their dropdown closes, not on every tick", () => {
    const { details, checkbox } = renderForm();
    setOpen(details, true);
    fireEvent.click(checkbox("CJ"));
    fireEvent.click(checkbox("BV"));
    expect(replace).not.toHaveBeenCalled();

    setOpen(details, false);
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/?county=CJ&county=BV", { scroll: false });
  });

  it("ignores typing in the county search box", () => {
    const { search } = renderForm();
    fireEvent.change(search, { target: { value: "clu" } });
    expect(replace).not.toHaveBeenCalled();
  });

  it("does nothing when the filters haven't changed", () => {
    window.history.replaceState(null, "", "/?sport=running");
    const { sport, details } = renderForm();
    fireEvent.change(sport, { target: { value: "running" } });
    setOpen(details, true);
    setOpen(details, false);
    expect(replace).not.toHaveBeenCalled();
  });

  it("applies on submit (Enter) instead of reloading the page", () => {
    const { form, sport } = renderForm();
    sport.value = "running";
    const submit = new Event("submit", { bubbles: true, cancelable: true });
    form.dispatchEvent(submit);
    expect(submit.defaultPrevented).toBe(true);
    expect(replace).toHaveBeenCalledWith("/?sport=running", { scroll: false });
  });

  it("returns focus to the same field after the form is re-created", () => {
    const first = renderForm();
    first.sport.focus();
    fireEvent.change(first.sport, { target: { value: "running" } });
    first.unmount();

    const second = renderForm();
    expect(document.activeElement).toBe(second.sport);
  });
});
