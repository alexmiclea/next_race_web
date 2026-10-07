import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getAdmin } from "@/lib/admin/session";
import { LoginForm } from "./LoginForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.login");
  return { title: `${t("title")} — Next Race` };
}

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  if (await getAdmin()) redirect("/admin");
  const t = await getTranslations("Admin.login");
  const { error } = await searchParams;

  return (
    <main className="mx-auto w-full max-w-sm px-4 py-10">
      <h1 className="text-2xl font-extrabold tracking-tight">{t("title")}</h1>
      <p className="mt-2 mb-6 text-muted">{t("intro")}</p>
      {error === "link" && (
        <p role="alert" className="mb-4 rounded-lg bg-past-soft p-3 text-sm text-past-ink">
          {t("badLink")}
        </p>
      )}
      <LoginForm />
    </main>
  );
}
