import { toast } from "sonner";
import { Focus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useCharacterStore } from "@/lib/character-store";
import { abilityMod, formatMod } from "@/lib/utils";
import { rollD20 } from "@/lib/roll-engine";
import { conditionMode } from "@/lib/play-helpers";
import { useSessionStore } from "@/lib/session-store";

export function ConcentrationHelper() {
  const c = useCharacterStore((s) => s.character);
  const setField = useCharacterStore((s) => s.setField);
  const addLog = useCharacterStore((s) => s.addLog);
  const consumeRollMode = useCharacterStore((s) => s.consumeRollMode);
  const setLastRoll = useSessionStore((s) => s.setLastRoll);
  const [dmg, setDmg] = useState(10);

  const conMod = abilityMod(c.abilities.con);
  const dc = Math.max(10, Math.floor(dmg / 2));

  function check() {
    if (!c.concentrating) {
      toast.message("Нет концентрации");
      return;
    }
    const mode = conditionMode(c, "save", c.rollMode ?? "norm");
    const r = rollD20("Концентрация", conMod, mode);
    consumeRollMode();
    const ok = r.total >= dc;
    setLastRoll({ label: r.label, total: r.total, detail: r.detail, at: Date.now() });
    if (ok) {
      addLog(`Концентрация удержана: ${r.total} ≥ Сл ${dc} (${c.concentrating})`);
      toast.success(`Удержано ${r.total} ≥ ${dc}`);
    } else {
      addLog(`Концентрация потеряна: ${r.total} < Сл ${dc} · было «${c.concentrating}»`);
      setField("concentrating", "");
      toast.error(`Потеряна ${r.total} < ${dc}`);
    }
  }

  const presets = ["Внушение", "Гипнотический узор", "Очаровать чудовище", "Hex", "Bless"];

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <h3 className="mb-2 flex items-center gap-2 font-display text-sm">
        <Focus className="size-4 text-accent" /> Концентрация
      </h3>
      <Input
        className="mb-2 h-8"
        placeholder="Эффект…"
        value={c.concentrating}
        onChange={(e) => setField("concentrating", e.target.value)}
      />
      <div className="mb-2 flex flex-wrap gap-1">
        {presets.map((p) => (
          <Button
            key={p}
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => setField("concentrating", p)}
          >
            {p}
          </Button>
        ))}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={() => setField("concentrating", "")}
        >
          Сброс
        </Button>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-[10px] text-muted">
          Урон (Сл max 10 / ½)
          <Input
            type="number"
            className="h-8 w-20"
            value={dmg}
            onChange={(e) => setDmg(Number(e.target.value) || 0)}
          />
        </label>
        <span className="mb-1 text-xs text-muted">
          Сл {dc} · ТЕЛ {formatMod(conMod)}
        </span>
        <Button type="button" size="sm" variant="secondary" onClick={check}>
          Спас
        </Button>
      </div>
    </div>
  );
}
