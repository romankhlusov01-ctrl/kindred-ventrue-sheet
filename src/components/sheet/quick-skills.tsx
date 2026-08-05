import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  skillBonus,
  useCharacterStore,
} from "@/lib/character-store";
import { effectivePb } from "@/lib/level-utils";
import { rollD20 } from "@/lib/roll-engine";
import { conditionMode } from "@/lib/play-helpers";
import { useSessionStore } from "@/lib/session-store";
import type { SkillId } from "@/data/skills";
import { SKILLS } from "@/data/skills";

const QUICK: SkillId[] = [
  "persuasion",
  "intimidation",
  "deception",
  "insight",
  "perception",
  "athletics",
];

/** One-tap Ventrue social + core checks */
export function QuickSkills() {
  const c = useCharacterStore((s) => s.character);
  const addLog = useCharacterStore((s) => s.addLog);
  const consumeRollMode = useCharacterStore((s) => s.consumeRollMode);
  const setLastRoll = useSessionStore((s) => s.setLastRoll);
  const pb = effectivePb(c.level, c.multiclass);

  function roll(id: SkillId) {
    const sk = SKILLS.find((s) => s.id === id);
    if (!sk) return;
    const bonus = skillBonus(c.abilities[sk.ability], pb, c.skillProfs[id]);
    let base = c.rollMode ?? "norm";
    if (c.beastActive || c.pendingAdv) base = base === "dis" ? "norm" : "adv";
    const mode = conditionMode(c, "check", base);
    const r = rollD20(sk.nameRu, bonus, mode);
    consumeRollMode();
    setLastRoll({ label: r.label, total: r.total, detail: r.detail, at: Date.now() });
    addLog(`${r.label}: ${r.total} (${r.detail})`);
    toast.message(`${sk.nameRu}: ${r.total}`);
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
      <h3 className="mb-2 font-display text-sm">Быстрые проверки</h3>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {QUICK.map((id) => {
          const sk = SKILLS.find((s) => s.id === id)!;
          const bonus = skillBonus(c.abilities[sk.ability], pb, c.skillProfs[id]);
          const sign = bonus >= 0 ? `+${bonus}` : String(bonus);
          return (
            <Button
              key={id}
              type="button"
              variant="secondary"
              className="h-12 justify-between px-3"
              onClick={() => roll(id)}
            >
              <span className="truncate text-xs">{sk.nameRu}</span>
              <span className="font-display text-sm tabular-nums text-accent">{sign}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
