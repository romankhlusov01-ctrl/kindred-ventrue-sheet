import { toast } from "sonner";
import { Swords, Plus, Trash2, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSessionStore } from "@/lib/session-store";
import { useCharacterStore } from "@/lib/character-store";
import { cn } from "@/lib/utils";

export function EncounterPanel() {
  const enemies = useSessionStore((s) => s.enemies);
  const addEnemy = useSessionStore((s) => s.addEnemy);
  const updateEnemy = useSessionStore((s) => s.updateEnemy);
  const removeEnemy = useSessionStore((s) => s.removeEnemy);
  const damageEnemy = useSessionStore((s) => s.damageEnemy);
  const clearEncounter = useSessionStore((s) => s.clearEncounter);
  const effects = useSessionStore((s) => s.effects);
  const addEffect = useSessionStore((s) => s.addEffect);
  const removeEffect = useSessionStore((s) => s.removeEffect);
  const tickEffects = useSessionStore((s) => s.tickEffects);
  const lastRoll = useSessionStore((s) => s.lastRoll);
  const newTurn = useCharacterStore((s) => s.newTurn);

  return (
    <div className="space-y-3">
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 font-display text-base">
            <Swords className="size-4 text-primary" /> Враги (соло)
          </h3>
          <div className="flex gap-1">
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

        {enemies.length === 0 && (
          <p className="text-xs text-muted">
            Добавьте врагов для соло-боя: КД, хиты, быстрый урон с последнего броска.
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
                <div className="grid grid-cols-3 gap-2">
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
                </div>
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
                  {lastRoll && (
                    <Button
                      type="button"
                      size="sm"
                      variant="blood"
                      className="h-8"
                      onClick={() => {
                        const hit = lastRoll.total >= e.ac;
                        if (hit) {
                          toast.success(`${e.name}: попадание ${lastRoll.total} vs КД ${e.ac}`);
                        } else {
                          toast.message(`${e.name}: промах ${lastRoll.total} vs КД ${e.ac}`);
                        }
                      }}
                    >
                      vs КД ({lastRoll.total})
                    </Button>
                  )}
                </div>
                {/* HP bar */}
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg">
                  <div
                    className="h-full bg-primary transition-all"
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
