import { toast } from "sonner";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/lib/session-store";
import { useCharacterStore } from "@/lib/character-store";
import { rollDie } from "@/lib/utils";
import { rollDamage } from "@/lib/roll-engine";

/**
 * Solo: resolve all living enemies attacking the PC once.
 */
export function EnemyTurn() {
  const enemies = useSessionStore((s) => s.enemies);
  const setLastRoll = useSessionStore((s) => s.setLastRoll);
  const c = useCharacterStore((s) => s.character);
  const adjustHp = useCharacterStore((s) => s.adjustHp);
  const addLog = useCharacterStore((s) => s.addLog);

  const living = enemies.filter((e) => e.hp > 0);

  function resolveAll() {
    if (!living.length) {
      toast.message("Нет живых врагов");
      return;
    }
    let hits = 0;
    let totalDmg = 0;
    for (const e of living) {
      const d20 = rollDie(20);
      const total = d20 + (e.atkBonus ?? 0);
      if (total >= c.ac) {
        const dmg = rollDamage(e.damage || "1d6");
        adjustHp(-dmg.total);
        hits++;
        totalDmg += dmg.total;
        addLog(
          `${e.name} попал ${total} vs КД ${c.ac} → −${dmg.total} (${dmg.detail})`,
        );
      } else {
        addLog(`${e.name} промах ${total} vs КД ${c.ac}`);
      }
      setLastRoll({
        label: `${e.name} атака`,
        total,
        detail: `d20 ${d20}+${e.atkBonus ?? 0}`,
        at: Date.now(),
      });
    }
    toast.message(
      hits
        ? `Ход врагов: ${hits} попаданий · −${totalDmg} ХП`
        : "Ход врагов: все промах",
    );
  }

  if (!enemies.length) return null;

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
      <Button
        type="button"
        size="sm"
        variant="blood"
        className="w-full"
        onClick={resolveAll}
        disabled={!living.length}
      >
        <Bot className="size-3.5" /> Ход всех врагов ({living.length})
      </Button>
    </div>
  );
}
