import { useSessionStore } from "@/lib/session-store";

/** Compare last roll to a DC — for your own checks */
export function TargetCheck({ dc = 15 }: { dc?: number }) {
  const lastRoll = useSessionStore((s) => s.lastRoll);
  if (!lastRoll) return null;
  const ok = lastRoll.total >= dc;
  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface-2 px-3 py-2 text-sm">
      <span className="text-muted">{lastRoll.label}</span>{" "}
      <span className="font-display text-primary">{lastRoll.total}</span>
      <span className="text-muted"> vs {dc} → </span>
      <span className={ok ? "text-success" : "text-danger"}>
        {ok ? "успех" : "провал"}
      </span>
    </div>
  );
}
