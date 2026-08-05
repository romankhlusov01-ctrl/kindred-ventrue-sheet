import { toast } from "sonner";
import {
  RefreshCw,
  Swords,
  Shield,
  Footprints,
  Zap,
  HeartPulse,
  Skull,
  Focus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatMod, abilityMod, rollDie } from "@/lib/utils";
import { getLevelData } from "@/data/kindred-ru";
import { useCharacterStore } from "@/lib/character-store";

export function SoloCombat() {
  const c = useCharacterStore((s) => s.character);
  const setField = useCharacterStore((s) => s.setField);
  const patch = useCharacterStore((s) => s.patch);
  const newTurn = useCharacterStore((s) => s.newTurn);
  const markDeathSuccess = useCharacterStore((s) => s.markDeathSuccess);
  const markDeathFail = useCharacterStore((s) => s.markDeathFail);
  const resetDeathSaves = useCharacterStore((s) => s.resetDeathSaves);
  const spendHitDie = useCharacterStore((s) => s.spendHitDie);
  const spendProtected = useCharacterStore((s) => s.spendProtected);
  const addLog = useCharacterStore((s) => s.addLog);
  const adjustHp = useCharacterStore((s) => s.adjustHp);
  const pb = getLevelData(c.level).pb;
  const hdLeft = Math.max(0, c.level - c.hitDiceUsed);
  const atZero = c.hpCurrent <= 0;

  function toggle(key: "actionUsed" | "bonusUsed" | "reactionUsed" | "movementUsed") {
    setField(key, !c[key]);
  }

  return (
    <div className="space-y-3">
      {/* Turn tracker */}
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 font-display text-base">
            <Swords className="size-4 text-primary" /> Ход · соло
          </h3>
          <div className="flex gap-1.5">
            {c.initiative != null && (
              <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-xs tabular-nums">
                Иниц {c.initiative}
              </span>
            )}
            <Button type="button" size="sm" variant="secondary" onClick={newTurn}>
              <RefreshCw className="size-3.5" /> Новый ход
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              ["actionUsed", "Действие", Swords],
              ["bonusUsed", "Бонус", Zap],
              ["reactionUsed", "Реакция", Shield],
              ["movementUsed", "Перемещ.", Footprints],
            ] as const
          ).map(([key, label, Icon]) => {
            const used = c[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggle(key)}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-[var(--radius)] border px-2 py-2 text-xs font-medium transition-colors",
                  used
                    ? "border-primary/40 bg-primary/15 text-primary line-through opacity-70"
                    : "border-border bg-surface-2 text-fg",
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            );
          })}
        </div>
        {c.beastActive && (
          <p className="mt-2 text-xs text-beast">
            Зверь активен: преимущество на d20 (сброс на «Новый ход»).
          </p>
        )}
      </div>

      {/* Concentration + HD */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
          <h3 className="mb-2 flex items-center gap-2 font-display text-sm">
            <Focus className="size-4 text-accent" /> Концентрация
          </h3>
          <Input
            placeholder="Заклинание / эффект…"
            value={c.concentrating}
            onChange={(e) => setField("concentrating", e.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                const mod = abilityMod(c.abilities.con);
                // Kindred: damage doesn't break concentration for their spells — still offer CON save for other effects
                const a = rollDie(20);
                const total = a + mod + (c.saveProfs.con ? pb : 0);
                addLog(`Спас концентрации: ${a}${formatMod(mod + (c.saveProfs.con ? pb : 0))} = ${total}`);
                toast.message(`Концентрация: ${total} (Сл = половина урона или 10)`);
              }}
            >
              Спас Тел (конц.)
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setField("concentrating", "");
                toast.message("Концентрация сброшена");
              }}
            >
              Снять
            </Button>
          </div>
          <p className="mt-2 text-[10px] text-muted">
            Сородич: урон не сбивает концентрацию своих заклинаний (PDF).
          </p>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
          <h3 className="mb-2 flex items-center gap-2 font-display text-sm">
            <HeartPulse className="size-4 text-primary" /> Кости хитов
          </h3>
          <div className="mb-2 font-display text-2xl tabular-nums">
            {hdLeft}
            <span className="text-sm text-muted"> / {c.level} (d8)</span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="blood"
            disabled={hdLeft <= 0 || c.hpCurrent <= 0}
            onClick={() => {
              const heal = spendHitDie();
              if (heal == null) {
                toast.error("Нет костей хитов");
                return;
              }
              addLog(`Кость хитов: +${heal}`);
              toast.success(`HD: +${heal} хитов`);
            }}
          >
            Потратить HD (короткий)
          </Button>
        </div>
      </div>

      {/* Death / 0 HP — Kindred special */}
      <div
        className={cn(
          "rounded-[var(--radius-lg)] border p-4",
          atZero ? "border-primary bg-primary/10" : "border-border bg-surface",
        )}
      >
        <h3 className="mb-2 flex items-center gap-2 font-display text-sm">
          <Skull className="size-4" /> 0 хитов · death saves
        </h3>
        <p className="mb-3 text-xs text-muted">
          Сородич: <strong className="text-fg">автоуспех</strong> death saves (Вампирская
          стойкость). 0 от Огня/Луча или обезглавливание — смерть. Protected: 0→1 хит.
        </p>
        <div className="mb-3 flex flex-wrap gap-4">
          <div>
            <div className="mb-1 text-[10px] uppercase text-muted">Успехи</div>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <button
                  key={`s${i}`}
                  type="button"
                  onClick={markDeathSuccess}
                  className={cn(
                    "size-8 rounded-full border-2",
                    i < c.deathSuccess
                      ? "border-success bg-success"
                      : "border-border bg-surface-2",
                  )}
                />
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 text-[10px] uppercase text-muted">Провалы</div>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <button
                  key={`f${i}`}
                  type="button"
                  onClick={markDeathFail}
                  className={cn(
                    "size-8 rounded-full border-2",
                    i < c.deathFail
                      ? "border-primary bg-primary"
                      : "border-border bg-surface-2",
                  )}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              // Kindred auto-success
              markDeathSuccess();
              addLog("Death save: автоуспех (сородич)");
              toast.success("Автоуспех death save");
            }}
          >
            Автоуспех (Kindred)
          </Button>
          <Button
            type="button"
            size="sm"
            variant="blood"
            onClick={() => {
              if (!spendProtected()) {
                toast.error("Нет очков Защищённого");
                return;
              }
              setField("hpCurrent", 1);
              resetDeathSaves();
              addLog("Protected: 0 → 1 хит");
              toast.success("Защищённый: 1 хит");
            }}
          >
            Protected 0→1
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={resetDeathSaves}>
            Сброс
          </Button>
          {atZero && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                adjustHp(1);
                resetDeathSaves();
              }}
            >
              +1 хит
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
