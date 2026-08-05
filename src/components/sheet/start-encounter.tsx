import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCharacterStore } from "@/lib/character-store";
import { abilityMod } from "@/lib/utils";
import { rollD20 } from "@/lib/roll-engine";
import { useSessionStore } from "@/lib/session-store";

/** Start a self combat turn — no enemies */
export function StartEncounter() {
  const c = useCharacterStore((s) => s.character);
  const setField = useCharacterStore((s) => s.setField);
  const patch = useCharacterStore((s) => s.patch);
  const addLog = useCharacterStore((s) => s.addLog);
  const setLastRoll = useSessionStore((s) => s.setLastRoll);

  return (
    <Button
      type="button"
      variant="blood"
      className="h-12 w-full"
      onClick={() => {
        const r = rollD20("Инициатива", abilityMod(c.abilities.dex), "norm");
        setField("initiative", r.total);
        patch({
          round: 1,
          actionUsed: false,
          bonusUsed: false,
          reactionUsed: false,
          movementUsed: false,
          scenario: "combat",
        });
        setLastRoll({ label: r.label, total: r.total, detail: r.detail, at: Date.now() });
        addLog(`Бой · иниц ${r.total}`);
        toast.success(`Бой · иниц ${r.total}`);
      }}
    >
      Начать бой (я)
    </Button>
  );
}
