import { toast } from "sonner";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCharacterStore, type Abilities } from "@/lib/character-store";
import { abilityMod, formatMod } from "@/lib/utils";

const KEYS: { key: keyof Abilities; label: string }[] = [
  { key: "str", label: "СИЛ" },
  { key: "dex", label: "ЛОВ" },
  { key: "con", label: "ТЕЛ" },
  { key: "int", label: "ИНТ" },
  { key: "wis", label: "МУД" },
  { key: "cha", label: "ХАР" },
];

/** ASI at 4/8/12/16/19 — +2 one score or +1/+1 */
export function AsiHelper() {
  const c = useCharacterStore((s) => s.character);
  const setAbility = useCharacterStore((s) => s.setAbility);
  const addLog = useCharacterStore((s) => s.addLog);

  const asiLevels = [4, 8, 12, 16, 19];
  const nextAsi = asiLevels.find((l) => l > c.level) ?? null;
  const atAsi = asiLevels.includes(c.level);

  function bump(key: keyof Abilities, n: number) {
    const before = c.abilities[key];
    const after = Math.min(30, before + n);
    setAbility(key, after);
    addLog(`ASI: ${key.toUpperCase()} ${before}→${after}`);
    toast.success(`${key.toUpperCase()} ${before} → ${after} (${formatMod(abilityMod(after))})`);
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <h3 className="mb-1 flex items-center gap-2 font-display text-sm">
        <TrendingUp className="size-4 text-accent" /> ASI / +2 хар-ки
      </h3>
      <p className="mb-2 text-xs text-muted">
        Слоты 4·8·12·16·19
        {atAsi ? (
          <span className="text-accent"> · сейчас ур.{c.level} — можно взять ASI</span>
        ) : nextAsi ? (
          <> · след. на {nextAsi}</>
        ) : (
          " · все взяты"
        )}
      </p>
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
        {KEYS.map(({ key, label }) => (
          <div
            key={key}
            className="rounded border border-border bg-surface-2 p-1.5 text-center"
          >
            <div className="text-[10px] text-muted">{label}</div>
            <div className="font-display text-lg tabular-nums">{c.abilities[key]}</div>
            <div className="flex justify-center gap-0.5">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-1.5 text-xs"
                onClick={() => bump(key, 1)}
              >
                +1
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-1.5 text-xs"
                onClick={() => bump(key, 2)}
              >
                +2
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
