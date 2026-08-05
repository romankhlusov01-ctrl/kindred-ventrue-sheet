import { useState } from "react";
import { toast } from "sonner";
import { Focus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { abilityMod, formatMod, rollDie } from "@/lib/utils";
import { getLevelData } from "@/data/kindred-ru";
import { useCharacterStore } from "@/lib/character-store";
import { useSessionStore } from "@/lib/session-store";
import { rollD20 } from "@/lib/roll-engine";

export function ConcentrationHelper() {
  const c = useCharacterStore((s) => s.character);
  const setField = useCharacterStore((s) => s.setField);
  const addLog = useCharacterStore((s) => s.addLog);
  const setLastRoll = useSessionStore((s) => s.setLastRoll);
  const [dmg, setDmg] = useState(20);
  const pb = getLevelData(c.level).pb;
  const dc = Math.max(10, Math.floor(dmg / 2));
  const bonus = abilityMod(c.abilities.con) + (c.saveProfs.con ? pb : 0);

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <h3 className="mb-2 flex items-center gap-2 font-display text-sm">
        <Focus className="size-4 text-accent" /> Концентрация
      </h3>
      <Input
        className="mb-2"
        placeholder="Эффект…"
        value={c.concentrating}
        onChange={(e) => setField("concentrating", e.target.value)}
      />
      <div className="mb-2 flex flex-wrap items-end gap-2">
        <label className="text-[10px] text-muted">
          Урон (для Сл)
          <Input
            type="number"
            className="h-9 w-20"
            value={dmg}
            onChange={(e) => setDmg(Number(e.target.value) || 0)}
          />
        </label>
        <span className="pb-2 text-xs text-muted">Сл {dc} (½ урона, мин 10)</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => {
            const r = rollD20("Концентрация", bonus, c.rollMode ?? "norm");
            const ok = r.total >= dc;
            addLog(`${r.detail} = ${r.total} vs Сл ${dc} → ${ok ? "держит" : "теряет"}`);
            setLastRoll({ label: r.label, total: r.total, detail: r.detail, at: Date.now() });
            if (!ok) {
              setField("concentrating", "");
              toast.error("Концентрация сбита");
            } else {
              toast.success("Держит концентрацию");
            }
          }}
        >
          Спас {formatMod(bonus)} vs {dc}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            setField("concentrating", "");
            toast.message("Снято");
          }}
        >
          Снять
        </Button>
      </div>
      <p className="mt-2 text-[10px] text-muted">
        Kindred: урон не сбивает концентрацию <em>своих</em> заклинаний (PDF). Для чужих эффектов —
        обычный спас.
      </p>
    </div>
  );
}
