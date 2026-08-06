import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCharacterStore } from "@/lib/character-store";
import { useSessionStore } from "@/lib/session-store";
import { abilityMod } from "@/lib/utils";
import { effectivePb } from "@/lib/level-utils";
import {
  tableCheckSkill,
  tableD20Plain,
} from "@/lib/table-roll";
import { DominateDc } from "@/components/sheet/dominate-dc";

/** Clan-specific table actions (Ventrue / Toreador) */
export function ClanPowers() {
  const c = useCharacterStore((s) => s.character);
  const spendBlood = useCharacterStore((s) => s.spendBlood);
  const addLog = useCharacterStore((s) => s.addLog);
  const setField = useCharacterStore((s) => s.setField);
  const updateResource = useCharacterStore((s) => s.updateResource);
  const pushUndo = useSessionStore((s) => s.pushUndo);
  const setLastRoll = useSessionStore((s) => s.setLastRoll);
  const pb = effectivePb(c.level, c.multiclass);
  const dc = 8 + pb + abilityMod(c.abilities.cha);

  if (c.clan === "toreador") {
    return (
      <div className="space-y-3">
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-display text-sm">Тореадор · стол</h3>
            <span className="text-[10px] text-muted">Сл {dc}</span>
          </div>
          <p className="mb-2 text-[11px] text-accent">
            Bane: d20≤9 Анализ/Внимательность → Restrained (DC 10 Муд.)
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <Button
              type="button"
              variant="secondary"
              className="h-12 text-xs"
              onClick={() => tableCheckSkill("perception")}
            >
              Внимательность ★
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-12 text-xs"
              onClick={() => tableCheckSkill("investigation")}
            >
              Анализ ★
            </Button>
            {c.level >= 6 && (
              <>
                <Button
                  type="button"
                  variant="blood"
                  className="h-12 text-xs"
                  onClick={() => {
                    if (c.bloodCurrent < 2) return toast.error("Нужно 2 ОБК");
                    pushUndo("Aura Sight");
                    spendBlood(2);
                    addLog("Aura Sight (−2 ОБК) · 2 вопроса да/нет");
                    toast.success("Aura Sight");
                  }}
                >
                  Aura Sight (−2)
                </Button>
                <Button
                  type="button"
                  variant="blood"
                  className="h-12 text-xs"
                  onClick={() => {
                    if (c.bloodCurrent < 1) return toast.error("Нет ОБК");
                    pushUndo("Charm/Calm");
                    spendBlood(1);
                    addLog("Calm Emotions / Charm (−1 ОБК) · Сл " + dc);
                    toast.success("Charm / Calm · Сл " + dc);
                  }}
                >
                  Charm/Calm (−1)
                </Button>
              </>
            )}
            {c.level >= 9 && (
              <Button
                type="button"
                variant="blood"
                className="col-span-2 h-12 text-xs"
                onClick={() => {
                  if (c.bloodCurrent < 1) return toast.error("Нет ОБК");
                  pushUndo("Live Fast");
                  spendBlood(1);
                  setField("bonusUsed", true);
                  useSessionStore.getState().addEffect(`Live Fast (${pb} ход.)`, pb);
                  addLog(`Live Fast (−1 ОБК) · доп. действие ${pb} ходов`);
                  toast.success("Live Fast");
                }}
              >
                Live Fast · доп. действие (−1 ОБК · {pb} ход.)
              </Button>
            )}
            {c.level >= 11 && (
              <Button
                type="button"
                variant="secondary"
                className="col-span-2 h-12 text-xs"
                onClick={() => {
                  if (c.bloodCurrent < 2) return toast.error("Нужно 2 ОБК");
                  pushUndo("Spirit's Touch");
                  spendBlood(2);
                  addLog(`Spirit's Touch (−2 ОБК) · вопросов ≤ ${pb}`);
                  toast.success("Spirit's Touch");
                }}
              >
                Spirit's Touch (−2 ОБК)
              </Button>
            )}
            {c.level >= 15 && (
              <Button
                type="button"
                variant="outline"
                className="col-span-2 h-12 text-xs"
                onClick={() => {
                  if (c.bloodCurrent < 3) return toast.error("Нужно 3 ОБК");
                  pushUndo("Sanctuary");
                  spendBlood(3);
                  useSessionStore.getState().addEffect("Sanctuary (Truly Majestic)", null);
                  addLog("Sanctuary (−3 ОБК) · Truly Majestic");
                  toast.success("Sanctuary");
                }}
              >
                Sanctuary (−3 ОБК)
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className="col-span-2 h-11 text-xs"
              onClick={() => {
                useCharacterStore.getState().toggleCondition("Обездвижен (Bane)");
                addLog("Bane: Restrained (Тореадор)");
                toast.message("Bane Restrained");
              }}
            >
              Bane: Обездвижен (вкл/выкл)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Ventrue default
  return (
    <div className="space-y-3">
      <DominateDc />
    </div>
  );
}
