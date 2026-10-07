/** Small neutral "A avut loc" pill marking races that have already taken place. */
export function PastTag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-muted">
      {label}
    </span>
  );
}
