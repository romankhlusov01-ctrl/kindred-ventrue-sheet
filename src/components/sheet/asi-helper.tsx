import { TrendingUp } from "lucide-react";
import { useCharacterStore, type Abilities } from "@/lib/character-store";
import { abilityMod, formatMod } from "@/lib/utils";
import { ASI_LEVELS } from "@/data/builder-ru";

const KEYS: { key: keyof Abilities; label: string }[] = [
  { key: "str", label: "СИЛ" },
  { key: "dex", label: "ЛОВ" },
  { key: "con", label: "ТЕЛ" },
  { key: "int", label: "ИНТ" },
  { key: "wis", label: "МУД" },
  { key: "cha", label: "ХАР" },
];

/** Read-only ASI status — actual ASI/feat pick is LevelUpHelper (no double-dip) */
export function AsiHelper() {
  const c = useCharacterStore((s) => s.character);
  const asiLevels = [...ASI_LEVELS];
  const nextAsi = asiLevels.find((l) => l > c.level) ?? null;
  const atAsi = (ASI_LEVELS as readonly number[]).includes(c.level);

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
      <h3 className="mb-1 flex items-center gap-2 font-display text-sm">
        <TrendingUp className="size-3.5 text-accent" /> ASI · слоты 4·8·12·16
      </h3>
      <p className="mb-2 text-xs text-muted">
        Ур.19 — эпическое благословение (не обычный ASI).{" "}
        {atAsi ? (
          <span className="text-accent">
            Сейчас ур.{c.level}: возьмите ASI / PHB / Kindred в блоке «Повышение уровня».
          </span>
        ) : nextAsi ? (
          <>След. слот на {nextAsi}.</>
        ) : (
          "Все ASI-слоты пройдены."
        )}
      </p>
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
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
          </div>
        ))}
      </div>
    </div>
  );
}
