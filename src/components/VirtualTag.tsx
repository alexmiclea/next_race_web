/** Small "Virtual" pill marking races that can be run from anywhere. */
export function VirtualTag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-accent">
      {label}
    </span>
  );
}
