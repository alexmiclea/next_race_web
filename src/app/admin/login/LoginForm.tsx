"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import {
  sendLoginLink,
  signInWithPassword,
  type LoginState,
  type PasswordLoginState,
} from "@/app/admin/actions";

const input = "h-11 rounded-lg border border-border bg-background px-3 text-base font-normal";
const label = "flex flex-col gap-1 text-sm font-medium";
const button =
  "h-11 rounded-lg bg-accent px-5 font-semibold text-on-accent hover:opacity-90 disabled:opacity-60";

/** Email and password; the emailed login link stays available for a forgotten password. */
export function LoginForm() {
  const t = useTranslations("Admin.login");
  return (
    <div className="flex flex-col gap-6">
      <PasswordForm />
      <details className="rounded-xl border border-border p-4">
        <summary className="cursor-pointer text-sm font-medium">{t("useLink")}</summary>
        <p className="mt-3 mb-3 text-sm text-muted">{t("linkIntro")}</p>
        <LinkForm />
      </details>
    </div>
  );
}

function PasswordForm() {
  const t = useTranslations("Admin.login");
  const [state, action, pending] = useActionState<PasswordLoginState, FormData>(
    signInWithPassword,
    { status: "idle" },
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <label className={label}>
        {t("email")}
        <input type="email" name="email" required autoComplete="username" className={input} />
      </label>
      <label className={label}>
        {t("password")}
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className={input}
        />
      </label>
      {state.status !== "idle" && (
        <p role="alert" className="text-sm text-past-ink">
          {state.status === "invalid" ? t("invalid") : t(state.status)}
        </p>
      )}
      <button type="submit" disabled={pending} className={button}>
        {pending ? t("signingIn") : t("signIn")}
      </button>
    </form>
  );
}

function LinkForm() {
  const t = useTranslations("Admin.login");
  const [state, action, pending] = useActionState<LoginState, FormData>(sendLoginLink, {
    status: "idle",
  });

  if (state.status === "sent") {
    return (
      <p role="status" className="rounded-xl border border-border bg-surface p-4">
        {t("sent")}
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <label className={label}>
        {t("email")}
        <input type="email" name="email" required autoComplete="email" className={input} />
      </label>
      {(state.status === "invalid" || state.status === "tooMany") && (
        <p role="alert" className="text-sm text-past-ink">
          {t(state.status)}
        </p>
      )}
      <button type="submit" disabled={pending} className={button}>
        {pending ? t("sending") : t("send")}
      </button>
    </form>
  );
}
