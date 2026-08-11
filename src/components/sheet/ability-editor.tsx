import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { abilityMod, formatMod, cn } from "@/lib/utils";
import { useCharacterStore, type Abilities } from "@/lib/character-store";
import { characterPb } from "@/lib/skill-math";
import { tableCheckAbility, tableSave } from "@/lib/table-roll";

const KEYS: { key: keyof Abilities; short: string; label: string }[] = [
  { key: "str", short: "СИЛ", label: "Сила" },
  { key: "dex", short: "ЛОВ", label: "Ловкость" },
  { key: "con", short: "ТЕЛ", label: "Телосложение" },
  { key: "int", short: "ИНТ", label: "Интеллект" },
  { key: "wis", short: "МУД", label: "Мудрость" },
  { key: "cha", short: "ХАР", label: "Харизма" },
];

/** Compact ability grid — rolls via table-roll (same as play sheet) */
export function AbilityEditor() {
  const c = useCharacterStore((s) => s.character);
  const setAbility = useCharacterStore((s) => s.setAbility);
  const toggleSave = useCharacterStore((s) => s.toggleSave);
  const pb = characterPb(c.level, c.multiclass);

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
              onClick={() => tableCheckAbility(key, short)}
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
                onClick={() => tableSave(key, short)}
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
