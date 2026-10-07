import type { ReactNode } from "react";
import { sportClass, sportStyle, type SportStyle } from "@/lib/sports";

/** Simple line icons, one per sport, so the sport is recognisable without colour. */
const ICONS: Record<SportStyle, ReactNode> = {
  running: (
    <>
      <circle cx="14" cy="4.5" r="2" />
      <path d="M11 21l2-5-3-3 2-5 3 3h4M8 8h4M5 15l3-2" />
    </>
  ),
  swimming: (
    <>
      <circle cx="17" cy="6" r="2" />
      <path d="M5 11l5-3 4 3M2 16c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5M2 20c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5" />
    </>
  ),
  cycling: (
    <>
      <circle cx="6" cy="16" r="4" />
      <circle cx="18" cy="16" r="4" />
      <path d="M6 16l4-7h6l2 7M10 9l3 7M14 5h3" />
    </>
  ),
  triathlon: (
    <>
      <circle cx="7" cy="8" r="3.5" />
      <circle cx="17" cy="8" r="3.5" />
      <circle cx="12" cy="16" r="3.5" />
    </>
  ),
  other: <path d="M5 21V4M5 4h11l-2 4 2 4H5" />,
};

export function SportIcon({ slug, className = "size-4" }: { slug: string; className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
    >
      {ICONS[sportStyle(slug)]}
    </svg>
  );
}

/** Sport name with its icon, in the sport's colours. */
export function SportTag({ slug, name }: { slug: string; name: string }) {
  return (
    <span
      className={`${sportClass(slug)} inline-flex items-center gap-1 rounded-full bg-sport-soft px-2 py-0.5 text-xs font-semibold text-sport-ink`}
    >
      <SportIcon slug={slug} className="size-3.5" />
      {name}
    </span>
  );
}
