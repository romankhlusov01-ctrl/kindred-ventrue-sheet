import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { abilityMod } from "@/lib/utils";
import { useCharacterStore } from "@/lib/character-store";
import { useSessionStore } from "@/lib/session-store";
import { rollD20 } from "@/lib/roll-engine";
import { conditionMode } from "@/lib/play-helpers";
import { hasAlacrity } from "@/lib/roll-engine";

/** Roll initiative for yourself only */
export function AutoInit() {
  const c = useCharacterStore((s) => s.character);
  const setField = useCharacterStore((s) => s.setField);
  const consumeRollMode = useCharacterStore((s) => s.consumeRollMode);
  const addLog = useCharacterStore((s) => s.addLog);
  const setLastRoll = useSessionStore((s) => s.setLastRoll);

  return (
    <Button
      type="button"
      variant="secondary"
      className="h-11 w-full"
      onClick={() => {
        const sticky = c.rollMode ?? "norm";
        let base = sticky;
        if (c.beastActive || c.pendingAdv) base = sticky === "dis" ? "norm" : "adv";
        if (hasAlacrity(c.selectedFeats)) base = base === "dis" ? "norm" : "adv";
        const mode = conditionMode(c, "init", base);
        const r = rollD20("Инициатива", abilityMod(c.abilities.dex), mode);
        consumeRollMode();
        setField("initiative", r.total);
        setLastRoll({ label: r.label, total: r.total, detail: r.detail, at: Date.now() });
        addLog(`${r.label}: ${r.total}`);
        toast.success(`Иниц ${r.total}`);
      }}
    >
      Моя инициатива
    </Button>
  );
}
