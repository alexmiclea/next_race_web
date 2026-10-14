"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { setEventStatus } from "@/app/admin/actions";
import type { EventStatus } from "@/lib/events";

/**
 * Shown on a public race page only to a signed-in admin: quick edit and hide.
 * Hiding takes the admin to the hidden list, since the public page then disappears.
 *
 * On a race that isn't published yet (an admin preview) it says so, and offers to
 * publish it, or to reject it while it waits for review; the page then reloads.
 */
export function AdminEventBar({
  eventId,
  status = "approved",
}: {
  eventId: string;
  status?: EventStatus;
}) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const preview = status !== "approved";

  function hide() {
    if (!window.confirm(t("hideConfirm"))) return;
    startTransition(async () => {
      await setEventStatus(eventId, "rejected");
      router.push("/admin?status=rejected");
    });
  }

  function set(next: EventStatus) {
    startTransition(async () => {
      await setEventStatus(eventId, next);
      router.refresh();
    });
  }

  const action = "font-semibold underline disabled:opacity-60";
  return (
    <div
      role="region"
      aria-label={t("title")}
      className="mb-4 rounded-xl border border-dashed border-accent bg-accent-soft px-4 py-2 text-sm"
    >
      {preview && (
        <p role="status" className="mb-2 font-semibold">
          {t("previewNotice", { status: t(`form.status.${status}`) })}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-semibold">{t("title")}</span>
        <Link href={`/admin/concurs/${eventId}`} className="font-semibold text-accent underline">
          {t("edit")}
        </Link>
        {preview ? (
          <>
            <button
              type="button"
              onClick={() => set("approved")}
              disabled={pending}
              className={`${action} text-accent`}
            >
              {t("approve")}
            </button>
            {status === "pending" && (
              <button
                type="button"
                onClick={() => set("rejected")}
                disabled={pending}
                className={`${action} text-past-ink`}
              >
                {t("reject")}
              </button>
            )}
            <Link href={`/admin?status=${status}`} className="underline">
              {t("backToList")}
            </Link>
          </>
        ) : (
          <button type="button" onClick={hide} disabled={pending} className={`${action} text-past-ink`}>
            {t("hide")}
          </button>
        )}
      </div>
    </div>
  );
}
