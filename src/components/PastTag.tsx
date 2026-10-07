/** Red "A avut loc" pill marking races that have already taken place. */
export function PastTag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-past bg-past-soft px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-past-ink">
      {label}
    </span>
  );
}
