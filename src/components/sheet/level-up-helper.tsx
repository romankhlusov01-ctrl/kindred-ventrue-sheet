import { toast } from "sonner";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLevelData, KINDRED_TABLE } from "@/data/kindred-ru";
import { calcKindredHp, kindredFeatSlots } from "@/data/builder-ru";
import { useCharacterStore } from "@/lib/character-store";

/** One-tap level up: +1 level, HP, BP fill note, feat slot reminder */
export function LevelUpHelper() {
  const c = useCharacterStore((s) => s.character);
  const setField = useCharacterStore((s) => s.setField);
  const patch = useCharacterStore((s) => s.patch);
  const addLog = useCharacterStore((s) => s.addLog);

  if (c.level >= 20) return null;

  const next = c.level + 1;
  const row = getLevelData(next);
  const prevSlots = kindredFeatSlots(c.level);
  const nextSlots = kindredFeatSlots(next);
  const newFeat = nextSlots > prevSlots;
  const features = KINDRED_TABLE[next - 1]?.features ?? "";

  return (
    <div className="rounded-[var(--radius-lg)] border border-accent/30 bg-accent/5 p-4">
      <h3 className="mb-1 flex items-center gap-2 font-display text-sm">
        <TrendingUp className="size-4 text-accent" /> Повышение уровня
      </h3>
      <p className="mb-3 text-xs text-muted">
        {c.level} → {next}: {features}. ОБК {row.bp}, питание {row.feed}, БМ +{row.pb}
        {newFeat ? " · +слот черты сородича" : ""}.
      </p>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={() => {
          const hp = calcKindredHp(next, c.abilities.con, next >= 6);
          const gain = Math.max(1, hp - c.hpMax);
          patch({
            level: next,
            hpMax: hp,
            hpCurrent: c.hpCurrent + gain,
            bloodCurrent: Math.min(row.bp, c.bloodCurrent + 1),
          });
          addLog(`Уровень ${next}: +${gain} макс. ХП, ОБК макс ${row.bp}`);
          toast.success(`Уровень ${next}${newFeat ? " — выберите черту сородича в Билдере" : ""}`);
        }}
      >
        Повысить до {next}
      </Button>
    </div>
  );
}
