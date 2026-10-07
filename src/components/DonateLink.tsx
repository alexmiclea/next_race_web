import { DONATE_URL } from "@/lib/site";

/**
 * "Buy me a coffee" link. A plain link rather than Buy Me a Coffee's widget, so no
 * third-party script or tracking loads on our pages.
 */
export function DonateLink({ label }: { label: string }) {
  return (
    <a
      href={DONATE_URL}
      target="_blank"
      rel="noopener noreferrer"
      // Buy Me a Coffee's yellow, with dark text, readable in both themes.
      className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#ffdd00] px-3 text-sm font-semibold text-[#14171c] hover:opacity-90"
    >
      <span aria-hidden>☕</span>
      {label}
    </a>
  );
}
