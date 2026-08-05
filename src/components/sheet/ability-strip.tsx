import { toast } from "sonner";
import {
  useCharacterStore,
  type Abilities,
} from "@/lib/character-store";
import { abilityMod, formatMod, cn } from "@/lib/utils";
import { effectivePb } from "@/lib/level-utils";
import { rollD20 } from "@/lib/roll-engine";
import { conditionMode } from "@/lib/play-helpers";
import { useSessionStore } from "@/lib/session-store";

const ABIL: { key: keyof Abilities; short: string }[] = [
  { key: "str", short: "СИЛ" },
  { key: "dex", short: "ЛОВ" },
  { key: "con", short: "ТЕЛ" },
  { key: "int", short: "ИНТ" },
  { key: "wis", short: "МУД" },
  { key: "cha", short: "ХАР" },
];

/** Six ability check buttons — one row on phone */
export function AbilityStrip() {
  const c = useCharacterStore((s) => s.character);
  const consumeRollMode = useCharacterStore((s) => s.consumeRollMode);
  const addLog = useCharacterStore((s) => s.addLog);
  const setLastRoll = useSessionStore((s) => s.setLastRoll);
  const pb = effectivePb(c.level, c.multiclass);

  function roll(key: keyof Abilities) {
    const mod = abilityMod(c.abilities[key]);
    let base = c.rollMode ?? "norm";
    if (c.beastActive || c.pendingAdv) base = base === "dis" ? "norm" : "adv";
    if (c.pendingDis) base = base === "adv" ? "norm" : "dis";
    const mode = conditionMode(c, "check", base);
    const label = ABIL.find((a) => a.key === key)!.short;
    const r = rollD20(label, mod, mode);
    consumeRollMode();
    setLastRoll({ label: r.label, total: r.total, detail: r.detail, at: Date.now() });
    addLog(`${r.label}: ${r.total}`);
    toast.message(`${label}: ${r.total}`);
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-2">
      <div className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
        Проверки хар-к
      </div>
      <div className="grid grid-cols-6 gap-1">
        {ABIL.map(({ key, short }) => {
          const score = c.abilities[key];
          const mod = abilityMod(score);
          const prof = c.saveProfs[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => roll(key)}
              className={cn(
                "flex h-14 flex-col items-center justify-center rounded-[var(--radius)] border active:scale-[0.97]",
                prof
                  ? "border-primary/40 bg-primary/10"
                  : "border-border bg-surface-2",
              )}
            >
              <span className="text-[9px] font-semibold text-muted">{short}</span>
              <span className="font-display text-sm tabular-nums leading-none text-accent">
                {formatMod(mod)}
              </span>
              <span className="text-[9px] tabular-nums text-faint">{score}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-1 px-1 text-[9px] text-faint">
        Подсветка = владение спас. · БМ {formatMod(pb)}
      </p>
    </div>
  );
}
