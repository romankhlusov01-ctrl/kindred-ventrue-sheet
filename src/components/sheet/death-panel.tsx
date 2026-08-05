import { toast } from "sonner";
import { Skull } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCharacterStore } from "@/lib/character-store";
import { useSessionStore } from "@/lib/session-store";

/** Always shown at 0 HP — Kindred death flow on the main play surface */
export function DeathPanel() {
  const c = useCharacterStore((s) => s.character);
  const setField = useCharacterStore((s) => s.setField);
  const markDeathSuccess = useCharacterStore((s) => s.markDeathSuccess);
  const markDeathFail = useCharacterStore((s) => s.markDeathFail);
  const resetDeathSaves = useCharacterStore((s) => s.resetDeathSaves);
  const spendProtected = useCharacterStore((s) => s.spendProtected);
  const adjustHp = useCharacterStore((s) => s.adjustHp);
  const pushUndo = useSessionStore((s) => s.pushUndo);

  if (c.hpCurrent > 0) return null;

  return (
    <section className="rounded-[var(--radius-lg)] border-2 border-primary bg-primary/15 p-3 blood-glow">
      <h3 className="mb-1 flex items-center gap-2 font-display text-base text-primary">
        <Skull className="size-4" /> 0 хитов
      </h3>
      <p className="mb-2 text-[11px] text-muted">
        Kindred: автоуспех death saves (если не огонь/луч/обезглавливание). Protected → 1 хит.
      </p>
      <div className="mb-2 flex gap-4 text-sm">
        <span>
          ✓ <strong className="tabular-nums">{c.deathSuccess}/3</strong>
        </span>
        <span>
          ✗ <strong className="tabular-nums">{c.deathFail}/3</strong>
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <Button type="button" className="h-12" variant="secondary" onClick={markDeathSuccess}>
          +Успех
        </Button>
        <Button type="button" className="h-12" variant="secondary" onClick={markDeathFail}>
          +Провал
        </Button>
        <Button
          type="button"
          className="h-12"
          variant="blood"
          onClick={() => {
            pushUndo("Protected 0→1");
            if (!spendProtected()) {
              toast.error("Нет Защищённого");
              return;
            }
            setField("hpCurrent", 1);
            resetDeathSaves();
            toast.success("1 хит");
          }}
        >
          Protected 0→1
        </Button>
        <Button
          type="button"
          className="h-12"
          variant="outline"
          onClick={() => {
            pushUndo("+1 ХП");
            adjustHp(1);
            resetDeathSaves();
          }}
        >
          +1 ХП
        </Button>
      </div>
    </section>
  );
}
