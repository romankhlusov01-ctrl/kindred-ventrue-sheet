import { clanBaneLine } from "@/data/builder-ru";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCharacterStore, getBloodMax, getLuckMax } from "@/lib/character-store";
import { getLevelData } from "@/data/kindred-ru";
import { useSessionStore } from "@/lib/session-store";
import { abilityMod, formatMod } from "@/lib/utils";
import { effectivePb } from "@/lib/level-utils";

export function SessionSummary() {
  const c = useCharacterStore((s) => s.character);
  const patch = useCharacterStore((s) => s.patch);
  const effects = useSessionStore((s) => s.effects);
  const lastRoll = useSessionStore((s) => s.lastRoll);
  const note = useSessionStore((s) => s.sessionNote);
  const clearUndo = useSessionStore((s) => s.clearUndo);
  const pb = effectivePb(c.level, c.multiclass);
  const luckMax = getLuckMax(c.level, c.multiclass);

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 text-sm">
      <h3 className="mb-2 font-display text-base">Сводка</h3>
      <ul className="mb-3 space-y-1.5 text-muted">
        <li>
          <span className="text-fg">{c.name}</span> · ур.{c.level} · R{c.round ?? 1}
          {c.initiative != null ? ` · иниц ${c.initiative}` : ""}
        </li>
        <li>
          ХП {c.hpCurrent}/{c.hpMax}
          {c.tempHp ? ` (+${c.tempHp})` : ""} · ОБК {c.bloodCurrent}/{getBloodMax(c)} · Зверь{" "}
          {pb - c.beastUsed}/{pb}
        </li>
        <li>
          Удача {luckMax - c.luckyUsed}/{luckMax} + {luckMax - c.protectedUsed}/{luckMax} ·
          вдохн. {c.inspiration ? "да" : "нет"}
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
        {effects.length > 0 && <li>Эффекты: {effects.map((e) => e.name).join(", ")}</li>}
        {lastRoll && (
          <li>
            Последний: {lastRoll.label} ={" "}
            <span className="font-display text-primary">{lastRoll.total}</span>
          </li>
        )}
        {c.concentrating && <li>Концентрация: {c.concentrating}</li>}
        <li>
          Сл {8 + pb + abilityMod(c.abilities.cha)} · {clanBaneLine(c.clan, c.preferredBlood)} · Питание{" "}
          {getLevelData(c.level).feed} · БМ {formatMod(pb)}
        </li>
        {note && <li className="text-fg">Цель: {note}</li>}
      </ul>
      <Button
        type="button"
        variant="secondary"
        className="h-12 w-full"
        onClick={() => {
          patch({
            round: 1,
            actionUsed: false,
            bonusUsed: false,
            reactionUsed: false,
            movementUsed: false,
            beastActive: false,
            pendingAdv: false,
            pendingDis: false,
            initiative: null,
            deathSuccess: 0,
            deathFail: 0,
          });
          useSessionStore.setState({ effects: [], rollHistory: [], lastRoll: null });
          clearUndo();
          toast.success("Сессия сброшена (ресурсы ХП/ОБК сохранены)");
        }}
      >
        Новый бой · сброс хода
      </Button>
    </div>
  );
}
