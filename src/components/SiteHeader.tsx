import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import type { Theme } from "@/lib/theme";

export async function SiteHeader({ theme }: { theme: Theme }) {
  const t = await getTranslations("Nav");
  const links = [
    { href: "/", label: t("races") },
    { href: "/harta", label: t("map") },
    { href: "/despre", label: t("about") },
  ];

  return (
    <header className="border-b border-border">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" aria-label={t("home")} className="text-lg font-extrabold tracking-tight">
          Next<span className="text-accent">Race</span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <ul className="flex gap-1 text-sm font-medium sm:gap-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="rounded-md px-2 py-2 hover:bg-surface sm:px-3">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/favorite"
            aria-label={t("favorites")}
            title={t("favorites")}
            className="flex size-9 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-foreground"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              className="size-5"
            >
              <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
            </svg>
          </Link>
          <ThemeSwitch initialTheme={theme} />
        </div>
      </nav>
    </header>
  );
}
