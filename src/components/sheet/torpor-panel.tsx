import { toast } from "sonner";
import { MoonStar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLevelData } from "@/data/kindred-ru";
import { useCharacterStore } from "@/lib/character-store";

export function TorporPanel() {
  const c = useCharacterStore((s) => s.character);
  const spendBlood = useCharacterStore((s) => s.spendBlood);
  const setField = useCharacterStore((s) => s.setField);
  const addLog = useCharacterStore((s) => s.addLog);
  const pb = getLevelData(c.level).pb;

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <h3 className="mb-1 flex items-center gap-2 font-display text-sm">
        <MoonStar className="size-4 text-beast" /> Торпор
      </h3>
      <p className="mb-2 text-[10px] text-muted">
        При истощении 6: 1 хит + Без сознания, пока не потратите ОБК = БМ ({pb}).
      </p>
      <div className="flex flex-wrap gap-1.5">
        <Button
          type="button"
          className="h-11"
          variant="secondary"
          onClick={() => {
            setField("hpCurrent", 1);
            setField("conditions", Array.from(new Set([...c.conditions, "Без сознания", "Истощение"])));
            addLog("Торпор: 1 хит, без сознания");
            toast.message("Торпор");
          }}
        >
          Войти в торпор
        </Button>
        <Button
          type="button"
          className="h-11"
          variant="blood"
          onClick={() => {
            if (c.bloodCurrent < pb) {
              toast.error(`Нужно ${pb} ОБК`);
              return;
            }
            spendBlood(pb);
            setField(
              "conditions",
              c.conditions.filter((x) => x !== "Без сознания" && x !== "Истощение"),
            );
            addLog(`Выход из торпора (−${pb} ОБК)`);
            toast.success("Пробуждение из торпора");
          }}
        >
          Пробудить (−{pb} ОБК)
        </Button>
      </div>
    </div>
  );
}
