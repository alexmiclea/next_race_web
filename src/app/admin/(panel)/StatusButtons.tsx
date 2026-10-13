"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { setEventStatus } from "@/app/admin/actions";
import type { ReviewStatus } from "@/lib/admin/events";

/** Approve / reject (or restore) an event in one tap. */
export function StatusButtons({ id, status }: { id: string; status: ReviewStatus }) {
  const t = useTranslations("Admin");
  const [pending, startTransition] = useTransition();
  const set = (next: ReviewStatus) => startTransition(() => setEventStatus(id, next));
  const base = "h-9 rounded-lg px-3 text-sm font-semibold disabled:opacity-60";

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "approved" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => set("approved")}
          className={`${base} bg-accent text-on-accent hover:opacity-90`}
        >
          {t("approve")}
        </button>
      )}
      {status !== "rejected" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => set("rejected")}
          className={`${base} border border-border hover:bg-surface`}
        >
          {status === "approved" ? t("hide") : t("reject")}
        </button>
      )}
      {status === "rejected" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => set("pending")}
          className={`${base} border border-border hover:bg-surface`}
        >
          {t("backToQueue")}
        </button>
      )}
    </div>
  );
}
