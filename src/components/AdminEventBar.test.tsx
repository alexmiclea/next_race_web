import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../messages/ro.json";
import { AdminEventBar } from "./AdminEventBar";

const push = vi.fn();
const setEventStatus = vi.fn<(id: string, status: string) => Promise<void>>(async () => {});
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/app/admin/actions", () => ({
  setEventStatus: (id: string, status: string) => setEventStatus(id, status),
}));

const ID = "da78ecc7-54dd-4fd1-851f-fa5b4d41f019";

beforeEach(() => {
  push.mockClear();
  setEventStatus.mockClear();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderBar() {
  render(
    <NextIntlClientProvider locale="ro" messages={messages}>
      <AdminEventBar eventId={ID} />
    </NextIntlClientProvider>,
  );
}

describe("AdminEventBar", () => {
  it("links to the race's edit page", () => {
    renderBar();
    expect(screen.getByRole("link", { name: "Editează" }).getAttribute("href")).toBe(
      `/admin/concurs/${ID}`,
    );
  });

  it("hides the race after confirmation, then opens the hidden list", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderBar();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Ascunde" })));
    expect(setEventStatus).toHaveBeenCalledWith(ID, "rejected");
    expect(push).toHaveBeenCalledWith("/admin?status=rejected");
  });

  it("does nothing when the confirmation is cancelled", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    renderBar();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Ascunde" })));
    expect(setEventStatus).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
});
