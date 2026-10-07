import { DONATE_URL } from "@/lib/site";

/**
 * Always in English, in every site language: it is the name of the platform the
 * link goes to, like a brand, so it is deliberately not in the translation files.
 */
export const DONATE_LABEL = "Buy me a coffee";

/**
 * "Buy me a coffee" link. A plain link rather than Buy Me a Coffee's widget, so no
 * third-party script or tracking loads on our pages.
 */
export function DonateLink() {
  return (
    <a
      href={DONATE_URL}
      target="_blank"
      rel="noopener noreferrer"
      // Marked as English so screen readers pronounce it correctly on non-English pages.
      lang="en"
      // Buy Me a Coffee's yellow, with dark text, readable in both themes.
      className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#ffdd00] px-3 text-sm font-semibold text-[#14171c] hover:opacity-90"
    >
      <span aria-hidden>☕</span>
      {DONATE_LABEL}
    </a>
  );
}
