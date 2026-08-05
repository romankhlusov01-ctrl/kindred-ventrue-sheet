import { toast } from "sonner";
import { Sun, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCharacterStore } from "@/lib/character-store";

/** Kindred environment damage helpers */
export function EnvironmentHazards() {
  const c = useCharacterStore((s) => s.character);
  const adjustHp = useCharacterStore((s) => s.adjustHp);
  const addLog = useCharacterStore((s) => s.addLog);
  const spendBlood = useCharacterStore((s) => s.spendBlood);

  function take(label: string, base: number, vuln = true) {
    // Vulnerability to fire/radiant: double
    const dmg = vuln ? base * 2 : base;
    // temp hp first
    let remaining = dmg;
    let temp = c.tempHp;
    if (temp > 0) {
      const abs = Math.min(temp, remaining);
      temp -= abs;
      remaining -= abs;
    }
    useCharacterStore.getState().setField("tempHp", temp);
    adjustHp(-remaining);
    addLog(`${label}: ${dmg}${vuln ? " (уязв. ×2)" : ""} → −${remaining} ХП`);
    toast.message(`${label}: −${remaining} ХП`);
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <h3 className="mb-2 font-display text-sm">Опасности Kindred</h3>
      <p className="mb-2 text-[10px] text-muted">
        Уязвимость к Огню и Лучу (×2). Солнце: 5 лучистого в начале хода.
      </p>
      <div className="flex flex-wrap gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => take("Солнце", 5, true)}
        >
          <Sun className="size-3.5" /> Солнце (5×2)
        </Button>
        <Button
          type="button"
          size="sm"
          variant="blood"
          onClick={() => take("Огонь", 10, true)}
        >
          <Flame className="size-3.5" /> Огонь 10×2
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            if (c.bloodCurrent < 1) {
              toast.error("Нет ОБК");
              return;
            }
            spendBlood(1);
            addLog("Сангвивор: 1 ОБК на «еду» дня");
            toast.message("−1 ОБК (дневная кровь)");
          }}
        >
          Еда дня (−1 ОБК)
        </Button>
      </div>
    </div>
  );
}
