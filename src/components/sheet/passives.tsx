import { Eye } from "lucide-react";
import { skillBonus, useCharacterStore } from "@/lib/character-store";
import { effectivePb } from "@/lib/level-utils";

export function Passives() {
  const c = useCharacterStore((s) => s.character);
  const pb = effectivePb(c.level, c.multiclass);
  const per = 10 + skillBonus(c.abilities.wis, pb, c.skillProfs.perception);
  const ins = 10 + skillBonus(c.abilities.wis, pb, c.skillProfs.insight);
  const inv = 10 + skillBonus(c.abilities.int, pb, c.skillProfs.investigation);

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <h3 className="mb-2 flex items-center gap-2 font-display text-sm">
        <Eye className="size-4 text-accent" /> Пассивные
      </h3>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded border border-border bg-surface-2 p-2">
          <div className="text-[10px] uppercase text-muted">Восприятие</div>
          <div className="font-display text-2xl tabular-nums text-fg">{per}</div>
        </div>
        <div className="rounded border border-border bg-surface-2 p-2">
          <div className="text-[10px] uppercase text-muted">Проницат.</div>
          <div className="font-display text-2xl tabular-nums text-fg">{ins}</div>
        </div>
        <div className="rounded border border-border bg-surface-2 p-2">
          <div className="text-[10px] uppercase text-muted">Анализ</div>
          <div className="font-display text-2xl tabular-nums text-fg">{inv}</div>
        </div>
      </div>
    </div>
  );
}
