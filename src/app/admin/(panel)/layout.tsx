import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { logOut } from "@/app/admin/actions";
import { getAdmin } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";

/** Every admin page: only for a signed-in admin. */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await getAdmin();
  if (!admin) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    // Signed in but not an admin: act as if the page doesn't exist.
    if (user) notFound();
    redirect("/admin/login");
  }
  const t = await getTranslations("Admin");

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3 text-sm">
        <Link href="/admin" className="font-bold">
          {t("title")}
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-muted">{admin.user.email}</span>
          <form action={logOut}>
            <button type="submit" className="font-medium text-accent underline">
              {t("logOut")}
            </button>
          </form>
        </div>
      </div>
      {children}
    </div>
  );
}
