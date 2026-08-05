import { toast } from "sonner";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  useCharacterStore,
  type Abilities,
} from "@/lib/character-store";
import { abilityMod, formatMod } from "@/lib/utils";
import { effectivePb } from "@/lib/level-utils";
import { rollD20 } from "@/lib/roll-engine";
import { conditionMode } from "@/lib/play-helpers";
import { useSessionStore } from "@/lib/session-store";

const SAVES: { key: keyof Abilities; label: string }[] = [
  { key: "str", label: "СИЛ" },
  { key: "dex", label: "ЛОВ" },
  { key: "con", label: "ТЕЛ" },
  { key: "int", label: "ИНТ" },
  { key: "wis", label: "МУД" },
  { key: "cha", label: "ХАР" },
];

export function PcSaves() {
  const c = useCharacterStore((s) => s.character);
  const consumeRollMode = useCharacterStore((s) => s.consumeRollMode);
  const addLog = useCharacterStore((s) => s.addLog);
  const spendProtected = useCharacterStore((s) => s.spendProtected);
  const setLastRoll = useSessionStore((s) => s.setLastRoll);
  const [dc, setDc] = useState(15);

  const pb = effectivePb(c.level, c.multiclass);

  function rollSave(key: keyof Abilities) {
    const prof = c.saveProfs[key] ? pb : 0;
    const bonus = abilityMod(c.abilities[key]) + prof;
    const mode = conditionMode(c, "save", c.rollMode ?? "norm");
    const r = rollD20(`Спас ${key.toUpperCase()}`, bonus, mode);
    consumeRollMode();
    const ok = r.total >= dc;
    setLastRoll({ label: r.label, total: r.total, detail: r.detail, at: Date.now() });
    addLog(`${r.label}: ${r.total} vs Сл ${dc} → ${ok ? "успех" : "провал"}`);
    toast.message(
      ok
        ? `${key.toUpperCase()} ${r.total} ≥ ${dc}`
        : `${key.toUpperCase()} ${r.total} < ${dc}`,
    );
    return r;
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <h3 className="mb-2 flex items-center gap-2 font-display text-sm">
        <Shield className="size-4 text-accent" /> Спасброски ПК
      </h3>
      <label className="mb-2 block text-[10px] text-muted">
        Сл эффекта
        <Input
          type="number"
          className="mt-0.5 h-8 w-24"
          value={dc}
          onChange={(e) => setDc(Number(e.target.value) || 0)}
        />
      </label>
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
        {SAVES.map(({ key, label }) => {
          const prof = !!c.saveProfs[key];
          const bonus = abilityMod(c.abilities[key]) + (prof ? pb : 0);
          return (
            <Button
              key={key}
              type="button"
              size="sm"
              variant={prof ? "secondary" : "outline"}
              className="h-12 flex-col gap-0 py-1"
              onClick={() => rollSave(key)}
            >
              <span className="text-xs font-semibold">{label}</span>
              <span className="text-[10px] tabular-nums text-muted">
                {formatMod(bonus)}
              </span>
            </Button>
          );
        })}
      </div>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="mt-2 h-8 text-xs"
        onClick={() => {
          if (!spendProtected()) {
            toast.error("Нет Protected");
            return;
          }
          addLog("Protected: переброс спас. d20≤9");
          toast.success("Protected: можно перебросить");
        }}
      >
        Protected · переброс
      </Button>
    </div>
  );
}
