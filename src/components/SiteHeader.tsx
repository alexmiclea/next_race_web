import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function SiteHeader() {
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
        <ul className="flex gap-1 text-sm font-medium sm:gap-2">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="rounded-md px-2 py-2 hover:bg-surface sm:px-3">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
