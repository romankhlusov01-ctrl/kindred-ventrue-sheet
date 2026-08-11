import { toast } from "sonner";
import { Focus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useCharacterStore } from "@/lib/character-store";
import { abilityMod, formatMod } from "@/lib/utils";
import { characterPb } from "@/lib/skill-math";
import { tableSave } from "@/lib/table-roll";

export function ConcentrationHelper() {
  const c = useCharacterStore((s) => s.character);
  const setField = useCharacterStore((s) => s.setField);
  const addLog = useCharacterStore((s) => s.addLog);
  const [dmg, setDmg] = useState(10);

  const pb = characterPb(c.level, c.multiclass);
  const conMod = abilityMod(c.abilities.con);
  const saveBonus = conMod + (c.saveProfs.con ? pb : 0);
  const dc = Math.max(10, Math.floor(dmg / 2));

  function check() {
    if (!c.concentrating) {
      toast.message("Нет концентрации");
      return;
    }
    const r = tableSave("con", "Концентрация");
    if (!r) return;
    const ok = r.total >= dc;
    if (ok) {
      addLog(
        `Концентрация удержана: ${r.total} ≥ Сл ${dc} (${c.concentrating})`,
      );
      toast.success(`Удержано ${r.total} ≥ ${dc}`);
    } else {
      addLog(
        `Концентрация потеряна: ${r.total} < Сл ${dc} · было «${c.concentrating}»`,
      );
      setField("concentrating", "");
      toast.error(`Потеряна ${r.total} < ${dc}`);
    }
  }

  const presets = [
    "Внушение",
    "Гипнотический узор",
    "Очаровать чудовище",
    "Приказ",
    "Властное присутствие",
  ];

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
      <h3 className="mb-2 flex items-center gap-2 font-display text-sm">
        <Focus className="size-3.5 text-accent" /> Концентрация
      </h3>
      <p className="mb-2 text-[11px] text-muted">
        Спас Тел {formatMod(saveBonus)} (мод {formatMod(conMod)}
        {c.saveProfs.con ? ` + БМ${formatMod(pb)}` : ""}) · Сл = max(10, урон÷2)
      </p>
      <Input
        className="mb-2 h-11"
        value={c.concentrating}
        placeholder="На чём концентрируетесь"
        onChange={(e) => setField("concentrating", e.target.value)}
      />
      <div className="mb-2 flex flex-wrap gap-1">
        {presets.map((p) => (
          <Button
            key={p}
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 text-[10px]"
            onClick={() => setField("concentrating", p)}
          >
            {p}
          </Button>
        ))}
      </div>
      <div className="flex items-end gap-2">
        <label className="flex-1 space-y-1">
          <span className="text-[10px] text-muted">Урон (Сл)</span>
          <Input
            type="number"
            className="h-11"
            value={dmg}
            onChange={(e) => setDmg(Number(e.target.value) || 0)}
          />
        </label>
        <div className="pb-2 text-xs text-muted">→ Сл {dc}</div>
        <Button type="button" variant="blood" className="h-11" onClick={check}>
          Спас
        </Button>
      </div>
    </div>
  );
}
