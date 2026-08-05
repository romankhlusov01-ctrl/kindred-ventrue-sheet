import { toast } from "sonner";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLevelData, KINDRED_TABLE } from "@/data/kindred-ru";
import { calcKindredHp, kindredFeatSlots } from "@/data/builder-ru";
import { VENTRUE_MILESTONES } from "@/data/ventrue-milestones";
import { useCharacterStore } from "@/lib/character-store";

/** One-tap level up: +1 level, HP, BP fill note, feat slot reminder */
export function LevelUpHelper() {
  const c = useCharacterStore((s) => s.character);
  const patch = useCharacterStore((s) => s.patch);
  const addLog = useCharacterStore((s) => s.addLog);

  if (c.level >= 20) return null;

  const next = c.level + 1;
  const row = getLevelData(next);
  const prevSlots = kindredFeatSlots(c.level);
  const nextSlots = kindredFeatSlots(next);
  const newFeat = nextSlots > prevSlots;
  const features = KINDRED_TABLE[next - 1]?.features ?? "";
  const asiLevels = [4, 8, 12, 16, 19];
  const newAsi = asiLevels.includes(next);
  const milestone = VENTRUE_MILESTONES.find((m) => m.level === next);

  return (
    <div className="rounded-[var(--radius-lg)] border border-accent/30 bg-accent/5 p-3">
      <h3 className="mb-1 flex items-center gap-2 font-display text-sm">
        <TrendingUp className="size-4 text-accent" /> Повышение уровня
      </h3>
      <p className="mb-3 text-xs leading-relaxed text-muted">
        <strong className="text-fg">
          {c.level} → {next}
        </strong>
        : {features}. ОБК {row.bp}, питание {row.feed}, БМ +{row.pb}
        {newFeat ? " · +слот черты сородича" : ""}
        {newAsi ? " · ASI" : ""}.
        {milestone ? ` · ${milestone.title}` : ""}
      </p>
      <Button
        type="button"
        variant="secondary"
        className="h-12 w-full"
        onClick={() => {
          const hp = calcKindredHp(next, c.abilities.con, next >= 6);
          const gain = Math.max(1, hp - c.hpMax);
          const resources = c.customResources.map((r) => {
            if (/голос|присутств|forceful/i.test(r.name)) {
              return { ...r, max: row.pb, current: Math.min(r.current + 1, row.pb) };
            }
            return r;
          });
          patch({
            level: next,
            hpMax: hp,
            hpCurrent: c.hpCurrent + gain,
            bloodCurrent: Math.min(row.bp, c.bloodCurrent + 1),
            customResources: resources,
          });
          addLog(`Уровень ${next}: +${gain} макс. ХП, ОБК макс ${row.bp}`);
          toast.success(
            `Уровень ${next}${newFeat ? " — черта сородича" : ""}${newAsi ? " — ASI" : ""}`,
          );
        }}
      >
        Повысить до {next}
      </Button>
    </div>
  );
}
