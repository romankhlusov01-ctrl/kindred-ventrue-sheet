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
  const pushUndo = useSessionStore((s) => s.pushUndo);
  const [dc, setDc] = useState(15);

  const pb = effectivePb(c.level, c.multiclass);

  function rollSave(key: keyof Abilities) {
    const prof = c.saveProfs[key] ? pb : 0;
    const bonus = abilityMod(c.abilities[key]) + prof;
    let base = c.rollMode ?? "norm";
    if (c.beastActive || c.pendingAdv) base = base === "dis" ? "norm" : "adv";
    // Ventrue: often wis resistance flavor — no auto adv unless feat
    const mode = conditionMode(c, "save", base);
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
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
      <h3 className="mb-2 flex items-center gap-2 font-display text-sm">
        <Shield className="size-3.5 text-accent" /> Спасброски
      </h3>
      <div className="mb-2 flex items-center gap-2">
        <label className="text-[10px] text-muted">
          Сл
          <Input
            type="number"
            className="mt-0.5 h-10 w-20"
            value={dc}
            onChange={(e) => setDc(Number(e.target.value) || 0)}
          />
        </label>
        <div className="flex flex-1 flex-wrap gap-1">
          {[10, 12, 13, 15, 16, 18].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setDc(n)}
              className={`flex h-10 min-w-10 items-center justify-center rounded border text-xs font-semibold ${
                dc === n
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border bg-surface-2 text-muted"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {SAVES.map(({ key, label }) => {
          const prof = !!c.saveProfs[key];
          const bonus = abilityMod(c.abilities[key]) + (prof ? pb : 0);
          return (
            <Button
              key={key}
              type="button"
              size="sm"
              variant={prof ? "secondary" : "outline"}
              className="h-14 flex-col gap-0 py-1"
              onClick={() => rollSave(key)}
            >
              <span className="text-xs font-semibold">{label}</span>
              <span className="font-display text-sm tabular-nums text-accent">
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
        className="mt-2 h-10 w-full text-xs"
        onClick={() => {
          pushUndo("Protected");
          if (!spendProtected()) {
            toast.error("Нет Protected");
            return;
          }
          addLog("Protected: переброс спас. d20≤9");
          toast.success("Protected: можно перебросить");
        }}
      >
        Protected · переброс ≤9
      </Button>
    </div>
  );
}
