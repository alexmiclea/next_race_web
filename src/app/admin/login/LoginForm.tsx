"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { sendLoginLink, type LoginState } from "@/app/admin/actions";

export function LoginForm() {
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
      <label className="flex flex-col gap-1 text-sm font-medium">
        {t("email")}
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="h-11 rounded-lg border border-border bg-background px-3 text-base font-normal"
        />
      </label>
      {state.status === "invalid" && (
        <p role="alert" className="text-sm text-past-ink">
          {t("invalid")}
        </p>
      )}
      {state.status === "tooMany" && (
        <p role="alert" className="text-sm text-past-ink">
          {t("tooMany")}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-lg bg-accent px-5 font-semibold text-on-accent hover:opacity-90 disabled:opacity-60"
      >
        {pending ? t("sending") : t("send")}
      </button>
    </form>
  );
}
