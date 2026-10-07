"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { setEventStatus } from "@/app/admin/actions";

/**
 * Shown on a public race page only to a signed-in admin: quick edit and hide.
 * Hiding takes the admin to the hidden list, since the public page then disappears.
 */
export function AdminEventBar({ eventId }: { eventId: string }) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function hide() {
    if (!window.confirm(t("hideConfirm"))) return;
    startTransition(async () => {
      await setEventStatus(eventId, "rejected");
      router.push("/admin?status=rejected");
    });
  }

  return (
    <div
      role="region"
      aria-label={t("title")}
      className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-accent bg-accent-soft px-4 py-2 text-sm"
    >
      <span className="font-semibold">{t("title")}</span>
      <Link href={`/admin/concurs/${eventId}`} className="font-semibold text-accent underline">
        {t("edit")}
      </Link>
      <button
        type="button"
        onClick={hide}
        disabled={pending}
        className="font-semibold text-past-ink underline disabled:opacity-60"
      >
        {t("hide")}
      </button>
    </div>
  );
}
