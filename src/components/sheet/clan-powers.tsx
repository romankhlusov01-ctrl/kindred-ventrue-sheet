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
import { BANE, FEATURES, baneLine } from "@/data/terms-ru";

/** Clan-specific table actions (Ventrue / Toreador) — RU labels from terms-ru */
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
  const magnum = c.selectedFeats.filter((id) => id.startsWith("magnum-"));

  function spendVoice(label: string) {
    if (!voice) {
      toast.error(`Нет «${FEATURES.voice}» — примените билд (Вентру 3+)`);
      return false;
    }
    if (voice.current < 1) {
      toast.error(`${FEATURES.voice}: 0`);
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
            {BANE.toreadorShort} · {FEATURES.artistSoul}: преим. Анализ/Внимательность
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
                    pushUndo("Взгляд ауры");
                    spendBlood(2);
                    addLog(`${FEATURES.depth}: Взгляд ауры (−2 ОБК) · 2 вопроса да/нет`);
                    toast.success("Взгляд ауры");
                  }}
                >
                  Взгляд ауры (−2)
                </Button>
                <Button
                  type="button"
                  variant="blood"
                  className="h-12 text-xs"
                  onClick={() => {
                    if (c.bloodCurrent < 1) return toast.error("Нет ОБК");
                    pushUndo("Очарование/Спокойствие");
                    spendBlood(1);
                    addLog(
                      `${FEATURES.depth}: Calm / Charm (−1 ОБК) · Сл ${dc}`,
                    );
                    toast.success(`Очарование · Сл ${dc}`);
                  }}
                >
                  Очарование / Calm (−1)
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
                  pushUndo(FEATURES.liveFast);
                  spendBlood(1);
                  setField("bonusUsed", true);
                  useSessionStore
                    .getState()
                    .addEffect(`${FEATURES.liveFast} (${pb} ход.)`, pb);
                  addLog(
                    `${FEATURES.liveFast} (−1 ОБК) · доп. действие ${pb} ходов`,
                  );
                  toast.success(FEATURES.liveFast);
                }}
              >
                {FEATURES.liveFast} · доп. действие (−1 · {pb} ход.)
              </Button>
            )}
            {c.level >= 11 && (
              <Button
                type="button"
                variant="secondary"
                className="col-span-2 h-12 text-xs"
                onClick={() => {
                  if (c.bloodCurrent < 2) return toast.error("Нужно 2 ОБК");
                  pushUndo("Касание духа");
                  spendBlood(2);
                  addLog(
                    `${FEATURES.visionary}: Касание духа (−2 ОБК) · вопросов ≤ ${pb}`,
                  );
                  toast.success("Касание духа");
                }}
              >
                Касание духа (−2 ОБК)
              </Button>
            )}
            {c.level >= 15 && (
              <Button
                type="button"
                variant="outline"
                className="col-span-2 h-12 text-xs"
                onClick={() => {
                  if (c.bloodCurrent < 3) return toast.error("Нужно 3 ОБК");
                  pushUndo("Убежище");
                  spendBlood(3);
                  useSessionStore
                    .getState()
                    .addEffect(`Убежище (${FEATURES.majestic})`, null);
                  addLog(
                    `${FEATURES.majestic}: Убежище (−3 ОБК)`,
                  );
                  toast.success("Убежище");
                }}
              >
                Убежище (−3 ОБК) · {FEATURES.majestic}
              </Button>
            )}
            {magnum.length > 0 && (
              <div className="col-span-2 rounded border border-accent/30 bg-accent/5 p-2 text-[11px]">
                <div className="mb-1 font-medium text-fg">{FEATURES.magnum}</div>
                <div className="flex flex-wrap gap-1">
                  {magnum.map((id) => {
                    const labels: Record<string, string> = {
                      "magnum-flicker": "Мерцание",
                      "magnum-clairvoyance": "Ясновидение",
                      "magnum-open-mind": "Открытый разум",
                      "magnum-star": "Звёздный магнетизм",
                    };
                    return (
                      <Button
                        key={id}
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-9 text-[10px]"
                        onClick={() => {
                          addLog(`${FEATURES.magnum}: ${labels[id] ?? id}`);
                          toast.message(labels[id] ?? id);
                        }}
                      >
                        {labels[id] ?? id}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              className="col-span-2 h-11 text-xs"
              onClick={() => {
                useCharacterStore
                  .getState()
                  .toggleCondition(BANE.condition);
                addLog(`Проклятие: ${BANE.condition} (Тореадор)`);
                toast.message(`Проклятие: ${BANE.condition}`);
              }}
            >
              {BANE.condition} (вкл/выкл)
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
          {baneLine("ventrue", c.preferredBlood)}. {FEATURES.unshakable}: преим. на спас Муд.
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          <Button
            type="button"
            variant="blood"
            className="h-12 text-xs"
            onClick={() => spendVoice("Приказ")}
          >
            Приказ (−1 Голос)
          </Button>
          <Button
            type="button"
            variant="blood"
            className="h-12 text-xs"
            onClick={() => spendVoice("Внушение")}
          >
            Внушение (−1 Голос)
          </Button>
          {c.level >= 6 && (
            <Button
              type="button"
              variant="secondary"
              className="col-span-2 h-11 text-xs"
              onClick={() => {
                addLog(
                  `${FEATURES.dnf}: переброс спас vs Очарование/Испуг/Оглушение (раз/ход)`,
                );
                toast.message("Не дрогнуть · переброс");
              }}
            >
              {FEATURES.dnf} · переброс
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
                  pushUndo("Очарование (Entrance)");
                  spendBlood(2);
                  tableCheckSkill("persuasion");
                  addLog(`Очарование / Entrance (−2 ОБК) · Сл = Убеждение`);
                  toast.success("Очарование · 2 ОБК");
                }}
              >
                Очарование (−2 ОБК)
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="h-12 text-xs"
                onClick={() => {
                  if (c.bloodCurrent < 1) return toast.error("1 ОБК");
                  pushUndo("Ужас (Terrify)");
                  spendBlood(1);
                  tableCheckSkill("intimidation");
                  addLog(`Ужас / Terrify (−1 ОБК) · Сл = Запугивание`);
                  toast.success("Ужас · 1 ОБК");
                }}
              >
                Ужас (−1 ОБК)
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 text-xs"
                onClick={() => {
                  if (c.bloodCurrent < 1) return toast.error("1 ОБК");
                  pushUndo("Замешательство");
                  spendBlood(1);
                  addLog(
                    `Замешательство (−1 ОБК) · Гипнотический узор · Сл ${dc}`,
                  );
                  toast.success("Замешательство · 1 ОБК");
                }}
              >
                Замешательство (−1)
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 text-xs"
                onClick={() => {
                  if (c.bloodCurrent < 1) return toast.error("1 ОБК");
                  pushUndo("Убеждение (магия)");
                  spendBlood(1);
                  addLog(
                    `Убеждение (−1 ОБК) · Очаровать чудовище · Сл ${dc}`,
                  );
                  toast.success("Убеждение · 1 ОБК");
                }}
              >
                Убеждение (−1)
              </Button>
            </>
          )}
          {c.level >= 11 && (
            <Button
              type="button"
              variant="blood"
              className="col-span-2 h-12 text-xs"
              onClick={() => {
                const cost =
                  c.level >= 20 ? 6 : c.level >= 18 ? 5 : c.level >= 15 ? 4 : 3;
                if (c.bloodCurrent < cost) return toast.error(`${cost} ОБК`);
                pushUndo("Массовое внушение");
                spendBlood(cost);
                addLog(`Массовое внушение (−${cost} ОБК) · Сл ${dc}`);
                toast.success(`Массовое внушение · ${cost} ОБК`);
              }}
            >
              Массовое внушение (−
              {c.level >= 20 ? 6 : c.level >= 18 ? 5 : c.level >= 15 ? 4 : 3} ОБК)
            </Button>
          )}
          {c.level >= 15 && (
            <Button
              type="button"
              variant="outline"
              className="col-span-2 h-12 text-xs"
              onClick={() => {
                if (c.bloodCurrent < 2) return toast.error("2 ОБК");
                pushUndo("Плоть мрамора");
                spendBlood(2);
                useSessionStore
                  .getState()
                  .addEffect("Плоть мрамора (½ урон)", null);
                addLog(
                  "Плоть мрамора (−2 ОБК, реакция): ½ урона (не огонь/луч); 4 ОБК → 0",
                );
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
                  addLog(
                    `Внушительная аура (пассивно) · спас Муд. Сл ${auraDc} (8+Сил+БМ)`,
                  );
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
                  pushUndo("Призыв");
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
