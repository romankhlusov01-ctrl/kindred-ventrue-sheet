import { useCharacterStore, getBloodMax, getLuckMax } from "@/lib/character-store";
import { getLevelData } from "@/data/kindred-ru";
import { useSessionStore } from "@/lib/session-store";
import { abilityMod } from "@/lib/utils";
import { effectivePb } from "@/lib/level-utils";

export function SessionSummary() {
  const c = useCharacterStore((s) => s.character);
  const enemies = useSessionStore((s) => s.enemies);
  const effects = useSessionStore((s) => s.effects);
  const lastRoll = useSessionStore((s) => s.lastRoll);
  const note = useSessionStore((s) => s.sessionNote);
  const pb = effectivePb(c.level, c.multiclass);
  const alive = enemies.filter((e) => e.hp > 0).length;

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 text-sm">
      <h3 className="mb-2 font-display text-base">Сводка сессии</h3>
      <ul className="space-y-1.5 text-muted">
        <li>
          <span className="text-fg">{c.name}</span> · ур.{c.level} · раунд {c.round ?? 1}
          {c.initiative != null ? ` · иниц ${c.initiative}` : ""}
        </li>
        {note && (
          <li className="text-fg">
            Цель: <span className="text-accent">{note}</span>
          </li>
        )}
        <li>
          ХП {c.hpCurrent}/{c.hpMax}
          {c.tempHp ? ` (+${c.tempHp})` : ""} · ОБК {c.bloodCurrent}/{getBloodMax(c)} · Зверь{" "}
          {Math.max(0, pb - c.beastUsed)}/{pb}
        </li>
        <li>
          Удача {getLuckMax(c.level) - c.luckyUsed}/{getLuckMax(c.level)} +{" "}
          {getLuckMax(c.level) - c.protectedUsed}/{getLuckMax(c.level)} · вдохн.{" "}
          {c.inspiration ? "да" : "нет"}
        </li>
        <li>
          Ход:{" "}
          {[
            c.actionUsed && "Действие",
            c.bonusUsed && "БД",
            c.reactionUsed && "Реакция",
            c.movementUsed && "Перемещ.",
          ]
            .filter(Boolean)
            .join(", ") || "всё доступно"}
        </li>
        <li>
          Враги: {alive}/{enemies.length} живы · эффекты: {effects.length}
        </li>
        {lastRoll && (
          <li>
            Последний бросок: {lastRoll.label} ={" "}
            <span className="font-display text-primary">{lastRoll.total}</span>
          </li>
        )}
        {c.concentrating && <li>Концентрация: {c.concentrating}</li>}
        <li>
          Сл {8 + pb + abilityMod(c.abilities.cha)} · Bane: {c.preferredBlood || "—"}
        </li>
        {c.conditions.length > 0 && (
          <li>Состояния: {c.conditions.join(", ")}</li>
        )}
      </ul>
    </div>
  );
}
