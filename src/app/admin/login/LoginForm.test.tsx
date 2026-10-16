import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/ro.json";
import { LoginForm } from "./LoginForm";

type PasswordResult = { status: "idle" | "invalid" | "wrong" | "tooMany" };
const signInWithPassword = vi.fn<(previous: PasswordResult, data: FormData) => Promise<PasswordResult>>();
const sendLoginLink = vi.fn(async () => ({ status: "sent" as const }));
vi.mock("@/app/admin/actions", () => ({
  signInWithPassword: (previous: PasswordResult, data: FormData) => signInWithPassword(previous, data),
  sendLoginLink: () => sendLoginLink(),
}));

beforeEach(() => {
  signInWithPassword.mockReset();
  sendLoginLink.mockClear();
});
afterEach(cleanup);

function renderForm() {
  render(
    <NextIntlClientProvider locale="ro" messages={messages}>
      <LoginForm />
    </NextIntlClientProvider>,
  );
}

async function signIn(email: string, password: string) {
  fireEvent.change(screen.getAllByLabelText("Email")[0], { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Parola"), { target: { value: password } });
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Intră" })));
}

describe("LoginForm", () => {
  it("asks for email and password, with the password field set up for password managers", () => {
    renderForm();
    const password = screen.getByLabelText("Parola");
    expect(password.getAttribute("type")).toBe("password");
    expect(password.getAttribute("autocomplete")).toBe("current-password");
    expect(screen.getByRole("button", { name: "Intră" })).toBeTruthy();
  });

  it("sends the email and password to the sign-in action", async () => {
    signInWithPassword.mockResolvedValue({ status: "idle" });
    renderForm();
    await signIn("admin@example.com", "o parolă lungă");
    const data = signInWithPassword.mock.calls[0][1];
    expect(data.get("email")).toBe("admin@example.com");
    expect(data.get("password")).toBe("o parolă lungă");
  });

  it("says when the email or password is wrong, without saying which", async () => {
    signInWithPassword.mockResolvedValue({ status: "wrong" });
    renderForm();
    await signIn("admin@example.com", "greșit");
    expect(screen.getByRole("alert").textContent).toBe("Email sau parolă greșită.");
  });

  it("keeps the emailed link as a fallback for a forgotten password", () => {
    renderForm();
    expect(screen.getByText("Ai uitat parola? Primește un link pe email")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Trimite linkul" })).toBeTruthy();
  });
});
