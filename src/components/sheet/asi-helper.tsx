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

  const asiLevels = [4, 8, 12, 16];
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
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
      <h3 className="mb-1 flex items-center gap-2 font-display text-sm">
        <TrendingUp className="size-3.5 text-accent" /> ASI / +2 хар-ки
      </h3>
      <p className="mb-2 text-xs text-muted">
        Слоты 4·8·12·16·19
        {atAsi ? (
          <span className="text-accent"> · ур.{c.level} — можно ASI</span>
        ) : nextAsi ? (
          <> · след. на {nextAsi}</>
        ) : (
          " · все взяты"
        )}
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {KEYS.map(({ key, label }) => (
          <div
            key={key}
            className="rounded-[var(--radius)] border border-border bg-surface-2 p-2 text-center"
          >
            <div className="text-[10px] text-muted">{label}</div>
            <div className="font-display text-xl tabular-nums leading-none">
              {c.abilities[key]}
            </div>
            <div className="mt-0.5 text-[10px] text-faint">
              {formatMod(abilityMod(c.abilities[key]))}
            </div>
            <div className="mt-1.5 grid grid-cols-2 gap-1">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-10 px-0 text-xs"
                onClick={() => bump(key, 1)}
              >
                +1
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-10 px-0 text-xs"
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
