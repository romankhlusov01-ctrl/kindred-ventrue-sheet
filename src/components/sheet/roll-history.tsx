import { useSessionStore } from "@/lib/session-store";
import { cn } from "@/lib/utils";

export function RollHistory() {
  const hist = useSessionStore((s) => s.rollHistory);
  const focusMode = useSessionStore((s) => s.focusMode);
  if (!hist.length) return null;
  const shown = focusMode ? hist.slice(0, 3) : hist;
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
      <h3 className="mb-2 font-display text-sm">Последние броски</h3>
      <ul className="space-y-1">
        {shown.map((r, i) => (
          <li
            key={`${r.at}-${i}`}
            className={cn(
              "flex items-center justify-between gap-2 rounded px-1 py-1.5 text-sm",
              i === 0 && "bg-primary/10",
            )}
          >
            <div className="min-w-0">
              <div className="truncate text-muted">{r.label}</div>
              {i === 0 && r.detail && (
                <div className="truncate text-[10px] text-faint">{r.detail}</div>
              )}
            </div>
            <span
              className={cn(
                "font-display tabular-nums text-primary",
                i === 0 ? "text-2xl" : "text-base",
              )}
            >
              {r.total}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
