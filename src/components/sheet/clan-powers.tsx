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
      toast.error("Нет ресурса «Голос власти» — примените билд (Вентру 3+)");
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
            <h3 className="font-display text-sm">Тореадор · силы</h3>
            <span className="text-[10px] text-muted">Сл {dc}</span>
          </div>
          <p className="mb-2 text-[11px] text-accent">
            Проклятие: d20≤9 Анализ/Внимательность → Обездвижен (Сл 10 Муд.) · Душа художника: преим.
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
                useCharacterStore.getState().toggleCondition("Обездвижен (Проклятие)");
                addLog("Проклятие: Обездвижен (Тореадор)");
                toast.message("Проклятие: Обездвижен");
              }}
            >
              Проклятие: Обездвижен (вкл/выкл)
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="col-span-2 h-10 text-xs"
              onClick={() => tableD20Plain("d20 · Проклятие")}
            >
              Чистый d20 (Проклятие)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (c.clan !== "ventrue") {
    return (
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3 text-sm text-muted">
        Выберите клан Вентру или Тореадор в режиме «Создать».
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <DominateDc />
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-sm">Вентру · силы</h3>
          <span className="text-[10px] text-muted">
            Сл {dc}
            {voice ? ` · Голос ${voice.current}/${voice.max}` : ""}
          </span>
        </div>
        <p className="mb-2 text-[11px] text-muted">
          Проклятие: предпочтённая кровь «{c.preferredBlood || "—"}» · иначе ½ костей питания. Непоколебимая уверенность: преим. на спас Муд.
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
                addLog("Не дрогнуть: переброс спас vs Очарование/Испуг/Оглушение (раз/ход)");
                toast.message("Переброс Очарование/Испуг/Оглушение");
              }}
            >
              Не дрогнуть · переброс (заметка)
            </Button>
          )}
          {c.level >= 9 && (
            <>
              <Button
                type="button"
                variant="secondary"
                className="h-12 text-xs"
                onClick={() => {
                  if (c.bloodCurrent < 2) return toast.error("2 ОБК");
                  pushUndo("Entrance");
                  spendBlood(2);
                  tableCheckSkill("persuasion");
                  addLog(`Entrance (−2 ОБК) · Сл = проверка Убеждения`);
                  toast.success("Entrance · 2 ОБК");
                }}
              >
                Entrance (−2 ОБК)
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="h-12 text-xs"
                onClick={() => {
                  if (c.bloodCurrent < 1) return toast.error("1 ОБК");
                  pushUndo("Terrify");
                  spendBlood(1);
                  tableCheckSkill("intimidation");
                  addLog(`Terrify (−1 ОБК) · Сл = проверка Запугивания`);
                  toast.success("Terrify · 1 ОБК");
                }}
              >
                Terrify (−1 ОБК)
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
                if (c.bloodCurrent < 2) return toast.error("2 ОБК");
                pushUndo("Flesh of Marble");
                spendBlood(2);
                useSessionStore.getState().addEffect("Плоть мрамора (½ урон)", null);
                addLog("Плоть мрамора (−2 ОБК, реакция): ½ урона (не огонь/луч); 4 ОБК → 0");
                toast.success("Плоть мрамора · −2 ОБК");
              }}
            >
              Плоть мрамора (−2 ОБК · реакция)
            </Button>
          )}
          {c.level >= 18 && (
            <>
            <Button
              type="button"
              variant="outline"
              className="col-span-2 h-12 text-xs"
              onClick={() => {
                const auraDc = 8 + pb + abilityMod(c.abilities.str);
                addLog(`Внушительная аура (пассивно) · спас Муд. Сл ${auraDc} (8+Сил+БМ)`);
                toast.message(`Аура · Сл ${auraDc}`);
              }}
            >
              Внушительная аура (пасс. · Сл Сил)
            </Button>
            <Button
              type="button"
              variant="blood"
              className="col-span-2 h-12 text-xs"
              onClick={() => {
                if (c.bloodCurrent < 3) return toast.error("3 ОБК");
                pushUndo("Summon");
                spendBlood(3);
                addLog(`Призыв (−3 ОБК) · Сл ${dc}`);
                toast.success("Призыв");
              }}
            >
              Призыв (−3 ОБК)
            </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
