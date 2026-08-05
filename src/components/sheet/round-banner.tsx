import { useCharacterStore } from "@/lib/character-store";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/lib/session-store";
import { cn } from "@/lib/utils";

/** Compact sticky status for combat tab header area */
export function RoundBanner() {
  const c = useCharacterStore((s) => s.character);
  const enemies = useSessionStore((s) => s.enemies);
  const effects = useSessionStore((s) => s.effects);
  const alive = enemies.filter((e) => e.hp > 0).length;

  return (
    <div
      className={cn(
        "mb-3 flex flex-wrap items-center gap-2 rounded-[var(--radius)] border px-3 py-2 text-xs",
        c.hpCurrent <= 0
          ? "border-primary/50 bg-primary/15 text-primary"
          : "border-border bg-surface-2 text-muted",
      )}
    >
      <span className="font-display text-sm text-fg">R{c.round ?? 1}</span>
      {c.initiative != null && <span>иниц {c.initiative}</span>}
      <span>
        {c.actionUsed ? "Д✓" : "Д·"} {c.bonusUsed ? "Б✓" : "Б·"}{" "}
        {c.reactionUsed ? "Р✓" : "Р·"}
      </span>
      {c.beastActive && <span className="text-beast">Зверь★</span>}
      {c.hunger && <span className="text-primary">Голод</span>}
      {enemies.length > 0 && (
        <span>
          враги {alive}/{enemies.length}
        </span>
      )}
      {effects.length > 0 && <span>эфф. {effects.length}</span>}
      {c.hpCurrent <= 0 && <span className="font-semibold">0 ХП · Protected?</span>}
      <button
        type="button"
        className="ml-auto text-[10px] text-faint underline"
        onClick={() => useCharacterStore.getState().setField("round", 1)}
      >
        R→1
      </button>
    </div>
  );
}
