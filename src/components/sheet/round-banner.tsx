import { useCharacterStore } from "@/lib/character-store";
import { useSessionStore } from "@/lib/session-store";

/** Compact self-only round strip */
export function RoundBanner() {
  const c = useCharacterStore((s) => s.character);
  const effects = useSessionStore((s) => s.effects);
  const activeFx = effects.length;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius)] border border-border bg-surface-2 px-3 py-2 text-xs text-muted">
      <span className="font-display text-sm text-fg">R{c.round ?? 1}</span>
      {c.beastActive && <span className="text-beast">Зверь★</span>}
      {c.inspiration && <span className="text-accent">Вдохн.</span>}
      {activeFx > 0 && <span>эффекты {activeFx}</span>}
      {(c.actionUsed || c.bonusUsed || c.reactionUsed) && (
        <span className="text-faint">
          {[c.actionUsed && "Д", c.bonusUsed && "Б", c.reactionUsed && "Р"]
            .filter(Boolean)
            .join("·")}
        </span>
      )}
    </div>
  );
}
