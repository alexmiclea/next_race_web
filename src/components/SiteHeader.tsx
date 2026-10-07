import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FavoritesLink } from "@/components/FavoritesLink";
import { MobileMenu } from "@/components/MobileMenu";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import type { Theme } from "@/lib/theme";

/**
 * Wide screens (640 px and up) show every link in a row; narrower screens show a ☰
 * menu instead. 640 px leaves room for longer words once English and Hungarian exist.
 */
export async function SiteHeader({
  theme,
  favoriteCount,
}: {
  theme: Theme;
  favoriteCount: number;
}) {
  const t = await getTranslations("Nav");
  const before = [
    { href: "/", label: t("races") },
    { href: "/harta", label: t("map") },
  ];
  const after = [{ href: "/despre", label: t("about") }];

  const inline = "rounded-md px-3 py-2 hover:bg-surface";
  const stacked = "block w-full rounded-md px-3 py-3 text-base hover:bg-surface";
  const links = (itemClass: string) => (
    <>
      {before.map((link) => (
        <li key={link.href}>
          <Link href={link.href} className={itemClass}>
            {link.label}
          </Link>
        </li>
      ))}
      <li>
        <FavoritesLink initialCount={favoriteCount} className={itemClass} />
      </li>
      {after.map((link) => (
        <li key={link.href}>
          <Link href={link.href} className={itemClass}>
            {link.label}
          </Link>
        </li>
      ))}
    </>
  );

  return (
    <header className="relative border-b border-border">
      <nav
        aria-label={t("main")}
        className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3"
      >
        <Link href="/" aria-label={t("home")} className="text-lg font-extrabold tracking-tight">
          Next<span className="text-accent">Race</span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <ul className="hidden items-center gap-1 text-sm font-medium sm:flex">
            {links(inline)}
          </ul>
          <ThemeSwitch initialTheme={theme} />
          <div className="sm:hidden">
            <MobileMenu>
              <ul className="mx-auto max-w-5xl px-2 py-2 font-medium">{links(stacked)}</ul>
            </MobileMenu>
          </div>
        </div>
      </nav>
    </header>
  );
}
