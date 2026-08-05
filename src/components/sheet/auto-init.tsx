import { toast } from "sonner";
import { Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/lib/session-store";
import { useCharacterStore } from "@/lib/character-store";
import { abilityMod, rollDie } from "@/lib/utils";
import { hasAlacrity, rollD20 } from "@/lib/roll-engine";

/** Roll initiative for PC + all enemies */
export function AutoInit() {
  const enemies = useSessionStore((s) => s.enemies);
  const updateEnemy = useSessionStore((s) => s.updateEnemy);
  const setLastRoll = useSessionStore((s) => s.setLastRoll);
  const c = useCharacterStore((s) => s.character);
  const setField = useCharacterStore((s) => s.setField);
  const addLog = useCharacterStore((s) => s.addLog);

  function rollAll() {
    const mode = hasAlacrity(c.selectedFeats) ? ("adv" as const) : "norm";
    const r = rollD20("Инициатива", abilityMod(c.abilities.dex), mode);
    setField("initiative", r.total);
    setLastRoll({ label: r.label, total: r.total, detail: r.detail, at: Date.now() });
    addLog(`Иниц (вы): ${r.total}`);
    for (const e of enemies) {
      const d = rollDie(20) + 1;
      updateEnemy(e.id, { init: d });
      addLog(`Иниц (${e.name}): ${d}`);
    }
    toast.success(`Иниц: вы ${r.total} + ${enemies.length} врагов`);
  }

  return (
    <Button type="button" size="sm" variant="secondary" className="w-full" onClick={rollAll}>
      <Dices className="size-3.5" /> Иниц всем
    </Button>
  );
}
