import { useSessionStore } from "@/lib/session-store";

export function RollHistory() {
  const hist = useSessionStore((s) => s.rollHistory);
  if (!hist.length) return null;
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
      <h3 className="mb-2 font-display text-sm">Последние броски</h3>
      <ul className="space-y-1">
        {hist.map((r, i) => (
          <li
            key={`${r.at}-${i}`}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <span className="min-w-0 truncate text-muted">{r.label}</span>
            <span className="font-display tabular-nums text-primary">{r.total}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
