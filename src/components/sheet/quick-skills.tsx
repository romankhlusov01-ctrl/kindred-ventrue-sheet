import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";
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
import { cn } from "@/lib/utils";

const DEFAULT_QUICK: SkillId[] = [
  "persuasion",
  "intimidation",
  "deception",
  "insight",
  "perception",
  "athletics",
];

const KEY = "kindred-quick-skills";

/** One-tap Ventrue social + core checks; long-press star to pin */
export function QuickSkills() {
  const c = useCharacterStore((s) => s.character);
  const addLog = useCharacterStore((s) => s.addLog);
  const consumeRollMode = useCharacterStore((s) => s.consumeRollMode);
  const setLastRoll = useSessionStore((s) => s.setLastRoll);
  const pb = effectivePb(c.level, c.multiclass);
  const [quick, setQuick] = useState<SkillId[]>(DEFAULT_QUICK);
  const [pick, setPick] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const ids = JSON.parse(raw) as SkillId[];
        if (Array.isArray(ids) && ids.length) setQuick(ids.slice(0, 8));
      }
    } catch {
      /* */
    }
  }, []);

  function save(ids: SkillId[]) {
    setQuick(ids);
    try {
      localStorage.setItem(KEY, JSON.stringify(ids));
    } catch {
      /* */
    }
  }

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

  function togglePin(id: SkillId) {
    if (quick.includes(id)) {
      save(quick.filter((x) => x !== id));
    } else if (quick.length < 8) {
      save([...quick, id]);
    } else {
      toast.error("Макс. 8 быстрых");
    }
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-display text-sm">Быстрые проверки</h3>
        <button
          type="button"
          onClick={() => setPick((v) => !v)}
          className="flex h-9 items-center gap-1 rounded-full border border-border px-2.5 text-[10px] text-muted"
        >
          <Star className="size-3" />
          {pick ? "Готово" : "Настроить"}
        </button>
      </div>

      {pick ? (
        <div className="grid max-h-64 grid-cols-2 gap-1 overflow-y-auto">
          {SKILLS.map((sk) => {
            const on = quick.includes(sk.id);
            return (
              <button
                key={sk.id}
                type="button"
                onClick={() => togglePin(sk.id)}
                className={cn(
                  "flex h-11 items-center justify-between rounded border px-2 text-left text-xs",
                  on
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border bg-surface-2 text-muted",
                )}
              >
                <span className="truncate">{sk.nameRu}</span>
                {on && <Star className="size-3 shrink-0 fill-current" />}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {quick.map((id) => {
            const sk = SKILLS.find((s) => s.id === id);
            if (!sk) return null;
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
      )}
    </div>
  );
}
