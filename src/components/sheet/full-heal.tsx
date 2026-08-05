import { toast } from "sonner";
import { HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCharacterStore } from "@/lib/character-store";

export function FullHealButton() {
  const c = useCharacterStore((s) => s.character);
  const setField = useCharacterStore((s) => s.setField);
  const addLog = useCharacterStore((s) => s.addLog);

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={() => {
        setField("hpCurrent", c.hpMax);
        setField("tempHp", 0);
        setField("deathSuccess", 0);
        setField("deathFail", 0);
        addLog("Полное лечение (хиты = макс)");
        toast.success(`ХП ${c.hpMax}`);
      }}
    >
      <HeartPulse className="size-3.5" /> ХП макс
    </Button>
  );
}
