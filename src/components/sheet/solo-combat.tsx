import { toast } from "sonner";
import { HeartPulse, Skull } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, abilityMod } from "@/lib/utils";
import { useCharacterStore } from "@/lib/character-store";

/** HD + 0 HP helpers — turn tracker lives in PlayHub */
export function SoloCombat() {
  const c = useCharacterStore((s) => s.character);
  const setField = useCharacterStore((s) => s.setField);
  const markDeathSuccess = useCharacterStore((s) => s.markDeathSuccess);
  const markDeathFail = useCharacterStore((s) => s.markDeathFail);
  const resetDeathSaves = useCharacterStore((s) => s.resetDeathSaves);
  const spendHitDie = useCharacterStore((s) => s.spendHitDie);
  const spendProtected = useCharacterStore((s) => s.spendProtected);
  const addLog = useCharacterStore((s) => s.addLog);
  const adjustHp = useCharacterStore((s) => s.adjustHp);
  const hdLeft = Math.max(0, c.level - c.hitDiceUsed);
  const atZero = c.hpCurrent <= 0;
  const conMod = abilityMod(c.abilities.con);

  return (
    <div className="space-y-3">
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
        <h3 className="mb-2 flex items-center gap-2 font-display text-sm">
          <HeartPulse className="size-4 text-primary" /> Кости хитов
        </h3>
        <div className="mb-2 font-display text-2xl tabular-nums">
          {hdLeft}
          <span className="text-sm text-muted"> / {c.level} (d8+{conMod >= 0 ? conMod : conMod})</span>
        </div>
        <Button
          type="button"
          variant="blood"
          className="h-12 w-full"
          disabled={hdLeft <= 0}
          onClick={() => {
            const h = spendHitDie();
            if (h == null) toast.error("Нет HD");
            else {
              addLog(`HD: +${h}`);
              toast.success(`+${h} ХП`);
            }
          }}
        >
          Потратить HD
        </Button>
      </div>

      <div
        className={cn(
          "rounded-[var(--radius-lg)] border p-3",
          atZero ? "border-primary bg-primary/10" : "border-border bg-surface",
        )}
      >
        <h3 className="mb-2 flex items-center gap-2 font-display text-sm">
          <Skull className="size-4" /> 0 хитов
        </h3>
        <p className="mb-2 text-[11px] text-muted">
          Kindred: автоуспех death saves. Protected: 0→1. Огонь/луч/обезглавливание — риск.
        </p>
        <div className="mb-2 flex gap-3 text-sm">
          <span>
            Успех: <strong className="tabular-nums">{c.deathSuccess}/3</strong>
          </span>
          <span>
            Провал: <strong className="tabular-nums">{c.deathFail}/3</strong>
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <Button type="button" size="sm" className="h-11" variant="secondary" onClick={markDeathSuccess}>
            +Успех
          </Button>
          <Button type="button" size="sm" className="h-11" variant="secondary" onClick={markDeathFail}>
            +Провал
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-11"
            variant="blood"
            onClick={() => {
              if (!spendProtected()) toast.error("Нет Protected");
              else {
                setField("hpCurrent", 1);
                resetDeathSaves();
                toast.success("1 хит");
              }
            }}
          >
            Protected 0→1
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-11"
            variant="outline"
            onClick={() => {
              adjustHp(1);
              resetDeathSaves();
            }}
          >
            +1 ХП
          </Button>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="mt-2 w-full"
          onClick={() => {
            setField("conditions", []);
            setField("hunger", false);
            toast.message("Состояния сброшены");
          }}
        >
          Снять все состояния
        </Button>
      </div>
    </div>
  );
}
