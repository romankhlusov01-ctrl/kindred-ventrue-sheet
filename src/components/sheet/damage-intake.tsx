import { useState } from "react";
import { toast } from "sonner";
import { Flame, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCharacterStore } from "@/lib/character-store";

/**
 * Solo: apply incoming damage with temp HP, Kindred notes, Protected.
 */
export function DamageIntake() {
  const c = useCharacterStore((s) => s.character);
  const setField = useCharacterStore((s) => s.setField);
  const addLog = useCharacterStore((s) => s.addLog);
  const spendProtected = useCharacterStore((s) => s.spendProtected);
  const patch = useCharacterStore((s) => s.patch);
  const [amount, setAmount] = useState(10);
  const [fireRadiant, setFireRadiant] = useState(false);
  const [halve, setHalve] = useState(false); // Flesh of Marble half

  function apply() {
    let dmg = Math.max(0, amount);
    if (fireRadiant) dmg = dmg * 2; // Kindred vulnerability
    if (halve) dmg = Math.floor(dmg / 2);

    const raw = dmg;
    let temp = c.tempHp;
    let hp = c.hpCurrent;
    let absorbed = 0;
    if (temp > 0) {
      absorbed = Math.min(temp, dmg);
      temp -= absorbed;
      dmg -= absorbed;
    }
    hp = Math.max(0, hp - dmg);
    const wentToZero = c.hpCurrent > 0 && hp === 0;

    setField("tempHp", temp);
    setField("hpCurrent", hp);
    const parts = [
      `Урон ${amount}`,
      fireRadiant ? "огонь/луч ×2" : null,
      halve ? "½ мрамор" : null,
      `= ${raw}`,
      absorbed ? `врем. −${absorbed}` : null,
      dmg ? `ХП −${dmg}` : null,
      `→ ${hp}/${c.hpMax}`,
    ].filter(Boolean);
    addLog(parts.join(" · "));

    if (wentToZero) {
      if (fireRadiant) {
        toast.error("0 от Огня/Луча — риск истинной смерти (PDF)");
        addLog("⚠ 0 хитов от Огня/Луча");
      } else {
        toast.message("0 хитов — Kindred автоуспех death saves / Protected");
      }
    } else {
      toast.message(`ХП ${hp}/${c.hpMax}${temp ? ` · врем. ${temp}` : ""}`);
    }
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <h3 className="mb-2 flex items-center gap-2 font-display text-sm">
        <Flame className="size-4 text-primary" /> Получить урон
      </h3>
      <div className="flex flex-wrap items-end gap-2">
        <label>
          <span className="text-[10px] uppercase text-muted">Урон</span>
          <Input
            type="number"
            className="h-12 w-24"
            value={amount}
            min={0}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
          />
        </label>
        {c.tempHp > 0 && (
          <span className="mb-1 text-xs text-accent">врем. {c.tempHp}</span>
        )}
        <Button type="button" size="sm" variant="blood" onClick={apply}>
          Применить
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => {
            if (!spendProtected()) {
              toast.error("Нет Защищённого");
              return;
            }
            setField("hpCurrent", 1);
            patch({ deathSuccess: 0, deathFail: 0 });
            addLog("Protected: 0→1");
            toast.success("1 хит");
          }}
        >
          <Shield className="size-3.5" /> 0→1
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-xs">
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={halve}
            onChange={(e) => setHalve(e.target.checked)}
          />
          ½ (Плоть мрамора)
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={fireRadiant}
            onChange={(e) => setFireRadiant(e.target.checked)}
          />
          Огонь / Луч
        </label>
      </div>
      <p className="mt-2 text-[10px] text-muted">
        Сначала снимает временные хиты. Сородич: 0 хитов ≠ смерть (кроме огня/луча/обезглавливания).
      </p>
    </div>
  );
}
