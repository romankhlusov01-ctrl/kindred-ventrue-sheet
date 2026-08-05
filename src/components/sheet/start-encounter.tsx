import { toast } from "sonner";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { abilityMod } from "@/lib/utils";
import { useCharacterStore } from "@/lib/character-store";
import { useSessionStore } from "@/lib/session-store";
import { hasAlacrity, rollD20 } from "@/lib/roll-engine";

export function StartEncounter() {
  const c = useCharacterStore((s) => s.character);
  const setField = useCharacterStore((s) => s.setField);
  const patch = useCharacterStore((s) => s.patch);
  const addLog = useCharacterStore((s) => s.addLog);
  const addEnemy = useSessionStore((s) => s.addEnemy);
  const setLastRoll = useSessionStore((s) => s.setLastRoll);
  const clearEncounter = useSessionStore((s) => s.clearEncounter);

  return (
    <Button
      type="button"
      size="sm"
      variant="blood"
      className="w-full"
      onClick={() => {
        clearEncounter();
        addEnemy();
        addEnemy();
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
        });
        setLastRoll({ label: r.label, total: r.total, detail: r.detail, at: Date.now() });
        addLog(`Старт боя: иниц ${r.total}, 2 врага`);
        toast.success(`Бой! Иниц ${r.total}`);
      }}
    >
      <Play className="size-3.5" /> Старт боя (иниц + 2 врага)
    </Button>
  );
}
