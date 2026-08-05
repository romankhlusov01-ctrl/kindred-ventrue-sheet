import { toast } from "sonner";
import { Swords, Plus, Trash2, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ENEMY_TEMPLATES,
  useSessionStore,
  type Enemy,
} from "@/lib/session-store";
import { useCharacterStore } from "@/lib/character-store";
import { cn, rollDie } from "@/lib/utils";
import { rollDamage } from "@/lib/roll-engine";
import { effectivePb } from "@/lib/level-utils";
import { abilityMod } from "@/lib/utils";

export function EncounterPanel() {
  const enemies = useSessionStore((s) => s.enemies);
  const addEnemy = useSessionStore((s) => s.addEnemy);
  const addEnemyFromTemplate = useSessionStore((s) => s.addEnemyFromTemplate);
  const updateEnemy = useSessionStore((s) => s.updateEnemy);
  const removeEnemy = useSessionStore((s) => s.removeEnemy);
  const damageEnemy = useSessionStore((s) => s.damageEnemy);
  const clearEncounter = useSessionStore((s) => s.clearEncounter);
  const effects = useSessionStore((s) => s.effects);
  const addEffect = useSessionStore((s) => s.addEffect);
  const removeEffect = useSessionStore((s) => s.removeEffect);
  const tickEffects = useSessionStore((s) => s.tickEffects);
  const lastRoll = useSessionStore((s) => s.lastRoll);
  const setLastRoll = useSessionStore((s) => s.setLastRoll);
  const newTurn = useCharacterStore((s) => s.newTurn);
  const c = useCharacterStore((s) => s.character);
  const addLog = useCharacterStore((s) => s.addLog);
  const adjustHp = useCharacterStore((s) => s.adjustHp);

  const pb = effectivePb(c.level, c.multiclass);
  const spellDc = 8 + pb + abilityMod(c.abilities.cha);

  function enemyAttack(e: Enemy) {
    const d20 = rollDie(20);
    const total = d20 + (e.atkBonus ?? 0);
    const hit = total >= c.ac;
    const dmg = rollDamage(e.damage || "1d6");
    setLastRoll({
      label: `${e.name} атака`,
      total,
      detail: `d20 ${d20}+${e.atkBonus ?? 0}`,
      at: Date.now(),
    });
    if (hit) {
      adjustHp(-dmg.total);
      addLog(`${e.name} попал ${total} vs КД ${c.ac} → −${dmg.total} (${dmg.detail})`);
      toast.error(`${e.name}: попадание ${total} → −${dmg.total} ХП`);
    } else {
      addLog(`${e.name} промах ${total} vs КД ${c.ac}`);
      toast.message(`${e.name}: промах ${total}`);
    }
  }

  function enemySave(e: Enemy, saveMod = 0) {
    const d20 = rollDie(20);
    const total = d20 + saveMod;
    const ok = total >= spellDc;
    setLastRoll({
      label: `${e.name} спас vs Сл ${spellDc}`,
      total,
      detail: `d20 ${d20}${saveMod >= 0 ? "+" : ""}${saveMod}`,
      at: Date.now(),
    });
    addLog(
      `${e.name} спас ${total} vs Сл ${spellDc} → ${ok ? "успех" : "провал"}`,
    );
    toast.message(
      ok
        ? `${e.name}: спас ${total} ≥ ${spellDc}`
        : `${e.name}: провал ${total} < ${spellDc}`,
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 font-display text-base">
            <Swords className="size-4 text-primary" /> Враги (соло)
          </h3>
          <div className="flex flex-wrap gap-1">
            <Button type="button" size="sm" variant="secondary" onClick={addEnemy}>
              <Plus className="size-3.5" /> Враг
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                clearEncounter();
                toast.message("Столкновение сброшено");
              }}
            >
              Сброс
            </Button>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-1">
          {ENEMY_TEMPLATES.map((t) => (
            <Button
              key={t.name}
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => {
                addEnemyFromTemplate(t);
                toast.message(`${t.name} · КД ${t.ac} / ${t.hp} ХП`);
              }}
            >
              {t.name}
            </Button>
          ))}
        </div>

        <p className="mb-2 text-[10px] text-muted">
          Сл Доминирования (ХАР): <strong className="text-fg">{spellDc}</strong> · ваш КД{" "}
          <strong className="text-fg">{c.ac}</strong>
        </p>

        {enemies.length === 0 && (
          <p className="text-xs text-muted">
            Шаблоны или «+ Враг»: КД, хиты, атака по вам, спас vs ваша Сл.
          </p>
        )}

        <div className="space-y-2">
          {enemies.map((e) => {
            const dead = e.hp <= 0;
            return (
              <div
                key={e.id}
                className={cn(
                  "rounded-[var(--radius)] border p-3",
                  dead ? "border-faint/40 opacity-60" : "border-border bg-surface-2",
                )}
              >
                <div className="mb-2 flex items-center gap-2">
                  <Input
                    className="h-8 flex-1"
                    value={e.name}
                    onChange={(ev) => updateEnemy(e.id, { name: ev.target.value })}
                  />
                  <button type="button" onClick={() => removeEnemy(e.id)} className="text-muted">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <label className="text-[10px] text-muted">
                    ХП
                    <Input
                      type="number"
                      className="h-8"
                      value={e.hp}
                      onChange={(ev) =>
                        updateEnemy(e.id, { hp: Number(ev.target.value) || 0 })
                      }
                    />
                  </label>
                  <label className="text-[10px] text-muted">
                    Макс
                    <Input
                      type="number"
                      className="h-8"
                      value={e.hpMax}
                      onChange={(ev) =>
                        updateEnemy(e.id, { hpMax: Number(ev.target.value) || 0 })
                      }
                    />
                  </label>
                  <label className="text-[10px] text-muted">
                    КД
                    <Input
                      type="number"
                      className="h-8"
                      value={e.ac}
                      onChange={(ev) =>
                        updateEnemy(e.id, { ac: Number(ev.target.value) || 0 })
                      }
                    />
                  </label>
                  <label className="text-[10px] text-muted">
                    Иниц
                    <Input
                      type="number"
                      className="h-8"
                      value={e.init ?? 10}
                      onChange={(ev) =>
                        updateEnemy(e.id, { init: Number(ev.target.value) || 0 })
                      }
                    />
                  </label>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <label className="text-[10px] text-muted">
                    Атк+
                    <Input
                      type="number"
                      className="h-8"
                      value={e.atkBonus ?? 4}
                      onChange={(ev) =>
                        updateEnemy(e.id, { atkBonus: Number(ev.target.value) || 0 })
                      }
                    />
                  </label>
                  <label className="text-[10px] text-muted">
                    Урон
                    <Input
                      className="h-8"
                      value={e.damage ?? "1d6"}
                      onChange={(ev) => updateEnemy(e.id, { damage: ev.target.value })}
                    />
                  </label>
                </div>
                <Input
                  className="mt-2 h-8 text-xs"
                  value={e.notes}
                  placeholder="Заметки"
                  onChange={(ev) => updateEnemy(e.id, { notes: ev.target.value })}
                />
                <div className="mt-2 flex flex-wrap gap-1">
                  {[-5, -1, 1, 5].map((n) => (
                    <Button
                      key={n}
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-8 px-2"
                      onClick={() => damageEnemy(e.id, -n)}
                    >
                      {n > 0 ? `+${n}` : n}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="blood"
                    className="h-8"
                    disabled={dead}
                    onClick={() => enemyAttack(e)}
                  >
                    Атака вас
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8"
                    disabled={dead}
                    onClick={() => enemySave(e, 0)}
                  >
                    Спас vs {spellDc}
                  </Button>
                  {lastRoll && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-8"
                        onClick={() => {
                          const hit = lastRoll.total >= e.ac;
                          toast.message(
                            hit
                              ? `${e.name}: попадание ${lastRoll.total} vs КД ${e.ac}`
                              : `${e.name}: промах ${lastRoll.total} vs КД ${e.ac}`,
                          );
                        }}
                      >
                        vs КД ({lastRoll.total})
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8"
                        onClick={() => {
                          damageEnemy(e.id, lastRoll.total);
                          toast.message(`${e.name}: −${lastRoll.total} ХП`);
                        }}
                      >
                        −{lastRoll.total} урон
                      </Button>
                    </>
                  )}
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg">
                  <div
                    className={cn(
                      "h-full transition-all",
                      dead ? "bg-faint" : e.hp / e.hpMax < 0.3 ? "bg-primary" : "bg-accent",
                    )}
                    style={{
                      width: `${Math.min(100, (e.hp / Math.max(1, e.hpMax)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-display text-sm">
            <Timer className="size-4 text-accent" /> Эффекты
          </h3>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              tickEffects();
              newTurn();
              toast.message("Ход: эффекты −1 раунд");
            }}
          >
            Ход (−1 раунд)
          </Button>
        </div>
        <div className="mb-2 flex flex-wrap gap-1">
          {[
            ["Awe 10 мин", 10],
            ["Голод", null],
            ["Внушение", 10],
            ["Испуг", 10],
            ["Ярость Зверя", 10],
            ["Концентрация", null],
            ["Очарование", 10],
          ].map(([name, rounds]) => (
            <Button
              key={String(name)}
              type="button"
              size="sm"
              variant="secondary"
              className="h-8 text-xs"
              onClick={() => addEffect(String(name), rounds as number | null)}
            >
              +{name}
            </Button>
          ))}
        </div>
        {effects.length === 0 && (
          <p className="text-xs text-muted">Активных эффектов нет.</p>
        )}
        <ul className="space-y-1">
          {effects.map((fx) => (
            <li
              key={fx.id}
              className="flex items-center justify-between gap-2 rounded border border-border bg-surface-2 px-2 py-1.5 text-sm"
            >
              <span>
                {fx.name}
                {fx.roundsLeft != null && (
                  <span className="ml-2 text-xs text-muted">{fx.roundsLeft} раунд.</span>
                )}
              </span>
              <button type="button" onClick={() => removeEffect(fx.id)} className="text-muted">
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
