import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../messages/ro.json";
import { AdminEventBar } from "./AdminEventBar";

const push = vi.fn();
const refresh = vi.fn();
const setEventStatus = vi.fn<(id: string, status: string) => Promise<void>>(async () => {});
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
vi.mock("@/app/admin/actions", () => ({
  setEventStatus: (id: string, status: string) => setEventStatus(id, status),
}));

const ID = "da78ecc7-54dd-4fd1-851f-fa5b4d41f019";

beforeEach(() => {
  push.mockClear();
  refresh.mockClear();
  setEventStatus.mockClear();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderBar(status?: "pending" | "approved" | "rejected") {
  render(
    <NextIntlClientProvider locale="ro" messages={messages}>
      <AdminEventBar eventId={ID} status={status} />
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

  it("on a published race, says nothing about previews", () => {
    renderBar("approved");
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("button", { name: "Publică" })).toBeNull();
  });

  it("marks a pending race as an admin-only preview, with publish and reject", () => {
    renderBar("pending");
    expect(screen.getByRole("status").textContent).toBe(
      "Nepublicat (De verificat): doar tu vezi această pagină.",
    );
    expect(screen.getByRole("button", { name: "Publică" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Respinge" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Ascunde" })).toBeNull();
    expect(screen.getByRole("link", { name: "Înapoi la listă" }).getAttribute("href")).toBe(
      "/admin?status=pending",
    );
  });

  it("publishes from the preview and reloads the page", async () => {
    renderBar("pending");
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Publică" })));
    expect(setEventStatus).toHaveBeenCalledWith(ID, "approved");
    expect(refresh).toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("rejects from the preview without a confirmation, since nothing public changes", async () => {
    const confirm = vi.spyOn(window, "confirm");
    renderBar("pending");
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Respinge" })));
    expect(confirm).not.toHaveBeenCalled();
    expect(setEventStatus).toHaveBeenCalledWith(ID, "rejected");
    expect(refresh).toHaveBeenCalled();
  });

  it("offers only publishing on a hidden race", () => {
    renderBar("rejected");
    expect(screen.getByRole("status").textContent).toContain("Ascuns");
    expect(screen.getByRole("button", { name: "Publică" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Respinge" })).toBeNull();
  });
});
