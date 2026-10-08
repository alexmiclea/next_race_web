import { SLOGAN } from "@/lib/site";

/** The English slogan, marked as English so screen readers pronounce it correctly. */
export function Slogan({ className }: { className?: string }) {
  return (
    <span lang="en" className={className}>
      {SLOGAN}
    </span>
  );
}
