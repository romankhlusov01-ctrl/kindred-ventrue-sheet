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
  const pb = effectivePb(c.level, c.multiclass);
  const dc = 8 + pb + abilityMod(c.abilities.cha);

  const voice = c.customResources.find((r) => /голос|voice/i.test(r.name));

  function spendVoice(label: string) {
    if (!voice) {
      toast.error("Нет ресурса «Голос власти» — примените билд Вентру");
      return false;
    }
    if (voice.current < 1) {
      toast.error("Голос власти: 0");
      return false;
    }
    pushUndo(label);
    updateResource(voice.id, { current: voice.current - 1 });
    addLog(`${label} (−1 Голос) · Сл ${dc}`);
    toast.success(`${label} · Сл ${dc}`);
    return true;
  }

  if (c.clan === "toreador") {
    return (
      <div className="space-y-3">
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-display text-sm">Тореадор · стол</h3>
            <span className="text-[10px] text-muted">Сл {dc}</span>
          </div>
          <p className="mb-2 text-[11px] text-accent">
            Bane: d20≤9 Анализ/Внимательность → Restrained (DC 10 Муд.) · Artist's Soul: adv
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
            <Button
              type="button"
              variant="ghost"
              className="col-span-2 h-10 text-xs"
              onClick={() => tableD20Plain("Bane check d20")}
            >
              Чистый d20 (Bane?)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Ventrue
  return (
    <div className="space-y-3">
      <DominateDc />
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-sm">Вентру · стол</h3>
          <span className="text-[10px] text-muted">
            Сл {dc}
            {voice ? ` · Голос ${voice.current}/${voice.max}` : ""}
          </span>
        </div>
        <p className="mb-2 text-[11px] text-muted">
          Bane: предпочтённая кровь «{c.preferredBlood || "—"}» · иначе ½ костей питания. Unshakable:
          adv спас Муд.
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          <Button
            type="button"
            variant="blood"
            className="h-12 text-xs"
            onClick={() => spendVoice("Приказ (Command)")}
          >
            Приказ (−1 Голос)
          </Button>
          <Button
            type="button"
            variant="blood"
            className="h-12 text-xs"
            onClick={() => spendVoice("Внушение (Suggestion)")}
          >
            Внушение (−1 Голос)
          </Button>
          {c.level >= 6 && (
            <Button
              type="button"
              variant="secondary"
              className="col-span-2 h-11 text-xs"
              onClick={() => {
                addLog("Dare Not Falter: reroll спас vs Charm/Fear/Stun (раз/ход)");
                toast.message("Reroll Charm/Fear/Stun");
              }}
            >
              Dare Not Falter · reroll (заметка)
            </Button>
          )}
          {c.level >= 9 && (
            <>
              <Button
                type="button"
                variant="secondary"
                className="h-12 text-xs"
                onClick={() => {
                  if (c.bloodCurrent < 1) return toast.error("Нет ОБК");
                  pushUndo("Entrance");
                  spendBlood(1);
                  addLog(`Entrance (−1 ОБК) · Сл ${dc}`);
                  toast.success("Entrance");
                }}
              >
                Entrance (−1 ОБК)
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="h-12 text-xs"
                onClick={() => {
                  if (c.bloodCurrent < 2) return toast.error("2 ОБК");
                  pushUndo("Terrify");
                  spendBlood(2);
                  addLog(`Terrify (−2 ОБК) · Сл ${dc}`);
                  toast.success("Terrify");
                }}
              >
                Terrify (−2 ОБК)
              </Button>
            </>
          )}
          {c.level >= 11 && (
            <Button
              type="button"
              variant="blood"
              className="col-span-2 h-12 text-xs"
              onClick={() => {
                if (c.bloodCurrent < 3) return toast.error("3 ОБК");
                pushUndo("Mass Suggestion");
                spendBlood(3);
                addLog(`Mass Suggestion (−3 ОБК) · Сл ${dc}`);
                toast.success("Mass Suggestion");
              }}
            >
              Mass Suggestion (−3 ОБК)
            </Button>
          )}
          {c.level >= 15 && (
            <Button
              type="button"
              variant="outline"
              className="col-span-2 h-12 text-xs"
              onClick={() => {
                pushUndo("Flesh of Marble");
                useSessionStore.getState().addEffect("Flesh of Marble (½ урон)", null);
                addLog("Flesh of Marble: ½ от удара (не огонь/луч) · реакция");
                toast.success("Flesh of Marble");
              }}
            >
              Flesh of Marble (реакция)
            </Button>
          )}
          {c.level >= 18 && (
            <Button
              type="button"
              variant="outline"
              className="col-span-2 h-12 text-xs"
              onClick={() => {
                if (c.bloodCurrent < 2) return toast.error("2 ОБК");
                pushUndo("Imposing Aura");
                spendBlood(2);
                addLog(`Imposing Aura (−2 ОБК) · Сл ${dc}`);
                toast.success("Imposing Aura");
              }}
            >
              Imposing Aura (−2 ОБК)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
