import { useState } from "react";
import { toast } from "sonner";
import { Flame, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCharacterStore } from "@/lib/character-store";
import { useSessionStore } from "@/lib/session-store";
import { cn } from "@/lib/utils";

/**
 * Apply incoming damage to yourself — temp HP, fire vuln, Protected.
 */
export function DamageIntake() {
  const c = useCharacterStore((s) => s.character);
  const setField = useCharacterStore((s) => s.setField);
  const addLog = useCharacterStore((s) => s.addLog);
  const spendProtected = useCharacterStore((s) => s.spendProtected);
  const patch = useCharacterStore((s) => s.patch);
  const pushUndo = useSessionStore((s) => s.pushUndo);
  const [amount, setAmount] = useState(10);
  const [fireRadiant, setFireRadiant] = useState(false);
  const [halve, setHalve] = useState(false);

  function apply(n = amount) {
    pushUndo(`Урон ${n}`);
    let dmg = Math.max(0, n);
    if (fireRadiant) dmg = dmg * 2;
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
      `Урон ${n}`,
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
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
      <h3 className="mb-2 flex items-center gap-2 font-display text-sm">
        <Flame className="size-3.5 text-primary" /> Получить урон
      </h3>

      <div className="mb-2 grid grid-cols-4 gap-1.5">
        {[4, 6, 8, 10, 12, 14, 16, 20].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setAmount(n)}
            className={cn(
              "flex h-11 items-center justify-center rounded-[var(--radius)] border text-sm font-semibold tabular-nums active:scale-[0.97]",
              amount === n
                ? "border-primary bg-primary/20 text-primary"
                : "border-border bg-surface-2 text-fg",
            )}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="mb-2 flex flex-wrap items-end gap-2">
        <label className="flex-1">
          <span className="text-[10px] uppercase text-muted">Свой</span>
          <Input
            type="number"
            className="h-12"
            value={amount}
            min={0}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
          />
        </label>
        {c.tempHp > 0 && (
          <span className="mb-2 text-xs text-accent">врем. {c.tempHp}</span>
        )}
        <Button type="button" className="h-12 min-w-[7rem]" variant="blood" onClick={() => apply()}>
          −{amount} ХП
        </Button>
      </div>

      <div className="mb-2 grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => setHalve((v) => !v)}
          className={cn(
            "flex h-11 items-center justify-center rounded-[var(--radius)] border text-xs font-medium",
            halve
              ? "border-accent bg-accent/15 text-accent"
              : "border-border bg-surface-2 text-muted",
          )}
        >
          ½ Плоть мрамора
        </button>
        <button
          type="button"
          onClick={() => setFireRadiant((v) => !v)}
          className={cn(
            "flex h-11 items-center justify-center rounded-[var(--radius)] border text-xs font-medium",
            fireRadiant
              ? "border-primary bg-primary/20 text-primary"
              : "border-border bg-surface-2 text-muted",
          )}
        >
          Огонь / Луч ×2
        </button>
      </div>

      <Button
        type="button"
        className="h-11 w-full"
        variant="secondary"
        onClick={() => {
          pushUndo("Protected 0→1");
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
        <Shield className="size-3.5" /> Protected 0→1
      </Button>
      <p className="mt-2 text-[10px] text-muted">
        Сначала временные хиты. 0 хитов ≠ смерть (кроме огня/луча/обезглавливания).
      </p>
    </div>
  );
}
