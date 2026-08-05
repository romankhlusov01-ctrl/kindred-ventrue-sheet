import { toast } from "sonner";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { abilityMod } from "@/lib/utils";
import { useCharacterStore } from "@/lib/character-store";
import { ENEMY_TEMPLATES, useSessionStore } from "@/lib/session-store";
import { hasAlacrity, rollD20 } from "@/lib/roll-engine";

export function StartEncounter() {
  const c = useCharacterStore((s) => s.character);
  const setField = useCharacterStore((s) => s.setField);
  const patch = useCharacterStore((s) => s.patch);
  const addLog = useCharacterStore((s) => s.addLog);
  const addEnemyFromTemplate = useSessionStore((s) => s.addEnemyFromTemplate);
  const setLastRoll = useSessionStore((s) => s.setLastRoll);
  const clearEncounter = useSessionStore((s) => s.clearEncounter);

  function start(kind: "patrol" | "hunt" | "kindred") {
    clearEncounter();
    const mode = hasAlacrity(c.selectedFeats) ? "adv" : "norm";
    const r = rollD20("Инициатива", abilityMod(c.abilities.dex), mode);
    setField("initiative", r.total);
    patch({
      round: 1,
      actionUsed: false,
      bonusUsed: false,
      reactionUsed: false,
      movementUsed: false,
      beastActive: false,
      scenario: "combat",
    });
    setLastRoll({ label: r.label, total: r.total, detail: r.detail, at: Date.now() });

    if (kind === "patrol") {
      const guard = ENEMY_TEMPLATES.find((t) => t.name === "Страж")!;
      const civ = ENEMY_TEMPLATES.find((t) => t.name === "Горожанин")!;
      addEnemyFromTemplate(guard);
      addEnemyFromTemplate(civ);
      addLog(`Старт: патруль · иниц ${r.total}`);
      toast.success(`Патруль! Иниц ${r.total}`);
    } else if (kind === "hunt") {
      const hunter = ENEMY_TEMPLATES.find((t) => t.name === "Охотник")!;
      const wolf = ENEMY_TEMPLATES.find((t) => t.name === "Волк")!;
      addEnemyFromTemplate(hunter);
      addEnemyFromTemplate(wolf);
      addLog(`Старт: охота · иниц ${r.total}`);
      toast.success(`Охота! Иниц ${r.total}`);
    } else {
      const k = ENEMY_TEMPLATES.find((t) => t.name === "Сородич-враг")!;
      const knight = ENEMY_TEMPLATES.find((t) => t.name === "Рыцарь")!;
      addEnemyFromTemplate(k);
      addEnemyFromTemplate(knight);
      addLog(`Старт: сородич · иниц ${r.total}`);
      toast.success(`Сородич-враг! Иниц ${r.total}`);
    }
  }

  return (
    <div className="grid gap-1.5">
      <Button
        type="button"
        size="sm"
        variant="blood"
        className="w-full"
        onClick={() => start("patrol")}
      >
        <Play className="size-3.5" /> Патруль (Страж + горожанин)
      </Button>
      <div className="grid grid-cols-2 gap-1.5">
        <Button type="button" size="sm" variant="secondary" onClick={() => start("hunt")}>
          Охота
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={() => start("kindred")}>
          Сородич
        </Button>
      </div>
    </div>
  );
}
