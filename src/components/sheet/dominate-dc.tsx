import { toast } from "sonner";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useCharacterStore } from "@/lib/character-store";
import { useSessionStore } from "@/lib/session-store";
import { abilityMod, formatMod } from "@/lib/utils";
import { effectivePb } from "@/lib/level-utils";

/**
 * Your Dominate DC + spend Voice — self convenience only.
 * Optional "check vs my DC" for when DM tells you the target's roll.
 */
export function DominateDc() {
  const c = useCharacterStore((s) => s.character);
  const addLog = useCharacterStore((s) => s.addLog);
  const setLastRoll = useSessionStore((s) => s.setLastRoll);
  const pushUndo = useSessionStore((s) => s.pushUndo);
  const [targetTotal, setTargetTotal] = useState(12);

  const pb = effectivePb(c.level, c.multiclass);
  const cha = abilityMod(c.abilities.cha);
  const dc = 8 + pb + cha;
  const aweBonus = c.selectedFeats.includes("forceful");
  const voice = c.customResources.find((r) => /голос/i.test(r.name));

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
      <h3 className="mb-2 flex items-center gap-2 font-display text-sm">
        <Crown className="size-4 text-primary" /> Доминирование · ваша Сл
      </h3>
      <div className="mb-3 flex items-end gap-3">
        <div>
          <div className="font-display text-5xl tabular-nums leading-none text-primary">{dc}</div>
          <div className="mt-1 text-[11px] text-muted">
            8 + БМ {formatMod(pb)} + ХАР {formatMod(cha)}
          </div>
        </div>
        {voice && (
          <div className="ml-auto text-right">
            <div className="text-[10px] uppercase text-muted">Голос</div>
            <div className="font-display text-2xl tabular-nums">
              {voice.current}/{voice.max}
            </div>
          </div>
        )}
      </div>
      <ul className="mb-3 space-y-1 text-xs text-muted">
        <li>
          Властное присутствие: {aweBonus ? "есть" : "черта не взята"}
        </li>
        <li>Трюки разума: {c.selectedFeats.includes("mind-tricks") ? "да" : "нет"}</li>
        {c.clan === "toreador" && (
          <li className="text-primary">
            Проклятие Тореадор: d20≤9 Анализ/Внимательность → Обездвижен (Сл 10 Муд.)
          </li>
        )}
        {c.clan === "ventrue" && (
          <li className="text-primary">
            Проклятие Вентру · кровь: {c.preferredBlood || "не указана"}
          </li>
        )}
      </ul>

      {voice && (
        <div className="mb-3 grid grid-cols-2 gap-1.5">
          <Button
            type="button"
            variant="blood"
            className="h-12"
            onClick={() => {
              if (voice.current <= 0) {
                toast.error("Голос исчерпан");
                return;
              }
              pushUndo("Голос");
              useCharacterStore.getState().updateResource(voice.id, {
                current: voice.current - 1,
              });
              useCharacterStore.getState().setField("actionUsed", true);
              addLog("Голос: Приказ / Внушение");
              toast.success("Голос −1");
            }}
          >
            Голос −1
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-12"
            onClick={() => {
              pushUndo("Голос +1");
              useCharacterStore.getState().updateResource(voice.id, {
                current: Math.min(voice.max, voice.current + 1),
              });
            }}
          >
            Голос +1
          </Button>
        </div>
      )}

      <div className="rounded-[var(--radius)] border border-border bg-surface-2 p-2.5">
        <label className="mb-1 block text-[10px] text-muted">
          Итог спас. цели (от мастера) vs ваша Сл {dc}
        </label>
        <div className="flex gap-2">
          <Input
            type="number"
            className="h-11"
            value={targetTotal}
            onChange={(e) => setTargetTotal(Number(e.target.value) || 0)}
          />
          <Button
            type="button"
            variant="secondary"
            className="h-11 shrink-0"
            onClick={() => {
              const ok = targetTotal >= dc;
              setLastRoll({
                label: `Спас vs Сл ${dc}`,
                total: targetTotal,
                detail: ok ? "цель устояла" : "цель под контролем",
                at: Date.now(),
              });
              addLog(`Спас ${targetTotal} vs Сл ${dc} → ${ok ? "успех" : "провал"}`);
              toast.message(ok ? `Устояла (${targetTotal})` : `Провал (${targetTotal})`);
            }}
          >
            Сравнить
          </Button>
        </div>
      </div>
    </div>
  );
}
