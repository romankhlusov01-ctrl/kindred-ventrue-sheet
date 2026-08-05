import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { abilityMod, formatMod, cn } from "@/lib/utils";
import { getLevelData } from "@/data/kindred-ru";
import { useCharacterStore, type Abilities } from "@/lib/character-store";
import { rollD20 } from "@/lib/roll-engine";
import { conditionMode } from "@/lib/play-helpers";
import { useSessionStore } from "@/lib/session-store";

const KEYS: { key: keyof Abilities; short: string; label: string }[] = [
  { key: "str", short: "СИЛ", label: "Сила" },
  { key: "dex", short: "ЛОВ", label: "Ловкость" },
  { key: "con", short: "ТЕЛ", label: "Телосложение" },
  { key: "int", short: "ИНТ", label: "Интеллект" },
  { key: "wis", short: "МУД", label: "Мудрость" },
  { key: "cha", short: "ХАР", label: "Харизма" },
];

/** Compact ability grid with roll / save / edit */
export function AbilityEditor() {
  const c = useCharacterStore((s) => s.character);
  const setAbility = useCharacterStore((s) => s.setAbility);
  const toggleSave = useCharacterStore((s) => s.toggleSave);
  const addLog = useCharacterStore((s) => s.addLog);
  const setLastRoll = useSessionStore((s) => s.setLastRoll);
  const pb = getLevelData(c.level).pb;

  function rollCheck(key: keyof Abilities, short: string) {
    const mod = abilityMod(c.abilities[key]);
    const mode = conditionMode(
      c,
      "check",
      c.beastActive || c.pendingAdv ? "adv" : c.rollMode ?? "norm",
    );
    const r = rollD20(short, mod, mode);
    addLog(`${r.label}: ${r.detail} = ${r.total}`);
    setLastRoll({ label: r.label, total: r.total, detail: r.detail, at: Date.now() });
    toast.message(`${short}: ${r.total}`);
  }

  function rollSave(key: keyof Abilities, short: string) {
    const mod = abilityMod(c.abilities[key]);
    const prof = !!c.saveProfs[key];
    const bonus = mod + (prof ? pb : 0);
    let mode = conditionMode(
      c,
      "save",
      c.beastActive || c.pendingAdv ? "adv" : c.rollMode ?? "norm",
    );
    if (c.clan === "ventrue" && key === "wis") {
      mode = mode === "dis" ? "norm" : "adv";
    }
    const r = rollD20(`Спас ${short}`, bonus, mode);
    addLog(`${r.label}: ${r.detail} = ${r.total}`);
    setLastRoll({ label: r.label, total: r.total, detail: r.detail, at: Date.now() });
    toast.message(`Спас ${short}: ${r.total}`);
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {KEYS.map(({ key, short, label }) => {
        const score = c.abilities[key];
        const mod = abilityMod(score);
        const saveProf = !!c.saveProfs[key];
        const saveBonus = mod + (saveProf ? pb : 0);
        return (
          <div
            key={key}
            className="rounded-[var(--radius-lg)] border border-border bg-surface p-2.5 text-center"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted" title={label}>
              {short}
            </div>
            <button
              type="button"
              onClick={() => rollCheck(key, short)}
              className="mx-auto flex h-12 w-full items-center justify-center font-display text-2xl tabular-nums leading-none text-accent active:scale-95 sm:text-3xl"
            >
              {formatMod(mod)}
            </button>
            <Input
              type="number"
              className="mx-auto mt-1.5 h-10 w-full max-w-[4.5rem] text-center text-sm"
              value={score}
              min={1}
              max={30}
              onChange={(e) => setAbility(key, Number(e.target.value) || 1)}
            />
            <div className="mt-1.5 grid grid-cols-2 gap-0.5">
              <button
                type="button"
                onClick={() => rollSave(key, short)}
                className={cn(
                  "rounded py-2 text-[10px] font-medium",
                  saveProf ? "bg-primary/10 text-primary" : "bg-surface-2 text-faint",
                )}
              >
                Спас {formatMod(saveBonus)}
                {c.clan === "ventrue" && key === "wis" ? "★" : ""}
              </button>
              <button
                type="button"
                onClick={() => {
                  toggleSave(key);
                  toast.message(saveProf ? "Спас снят" : "Владение");
                }}
                className="rounded bg-surface-2 py-2 text-[10px] text-muted"
              >
                {saveProf ? "В" : "—"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
