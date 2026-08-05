import { toast } from "sonner";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useCharacterStore } from "@/lib/character-store";
import { abilityMod, formatMod } from "@/lib/utils";
import { effectivePb } from "@/lib/level-utils";
import { rollDie } from "@/lib/utils";
import { useSessionStore } from "@/lib/session-store";

/**
 * Ventrue Dominate / social DC reference + NPC save roller.
 */
export function DominateDc() {
  const c = useCharacterStore((s) => s.character);
  const addLog = useCharacterStore((s) => s.addLog);
  const setLastRoll = useSessionStore((s) => s.setLastRoll);
  const [npcMod, setNpcMod] = useState(0);

  const pb = effectivePb(c.level, c.multiclass);
  const cha = abilityMod(c.abilities.cha);
  const dc = 8 + pb + cha;
  const aweBonus = c.selectedFeats.includes("forceful");
  const voice = c.customResources.find((r) => /голос/i.test(r.name));

  function rollNpcSave() {
    const d = rollDie(20);
    const total = d + npcMod;
    const ok = total >= dc;
    setLastRoll({
      label: `Спас цели vs Сл ${dc}`,
      total,
      detail: `d20 ${d}${formatMod(npcMod)}`,
      at: Date.now(),
    });
    addLog(`Спас цели ${total} vs Сл ${dc} → ${ok ? "успех" : "провал"}`);
    toast.message(ok ? `Спас ${total} ≥ ${dc}` : `Провал ${total} < ${dc}`);
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <h3 className="mb-2 flex items-center gap-2 font-display text-sm">
        <Crown className="size-4 text-primary" /> Доминирование · Сл
      </h3>
      <div className="mb-3">
        <div className="font-display text-4xl tabular-nums leading-none text-primary">{dc}</div>
        <div className="mt-1 text-[11px] text-muted">
          8 + БМ {formatMod(pb)} + ХАР {formatMod(cha)}
        </div>
      </div>
      <ul className="mb-3 space-y-1 text-xs text-muted">
        <li>
          Голос (Приказ / Внушение):{" "}
          {voice
            ? `${voice.current}/${voice.max}`
            : "добавьте ресурс «Голос»"}
        </li>
        <li>
          Forceful Presence:{" "}
          {aweBonus ? "Awe / Daunt доступны" : "черта не взята"}
        </li>
        <li>Mind Tricks: {c.selectedFeats.includes("mind-tricks") ? "да" : "нет"}</li>
        {c.preferredBlood && (
          <li className="text-primary">Bane / предпочтённая кровь: {c.preferredBlood}</li>
        )}
      </ul>

      {voice && (
        <div className="mb-3 grid grid-cols-2 gap-1.5">
          <Button
            type="button"
            variant="blood"
            className="h-11"
            onClick={() => {
              if (voice.current <= 0) {
                toast.error("Голос исчерпан");
                return;
              }
              useCharacterStore.getState().updateResource(voice.id, {
                current: voice.current - 1,
              });
              useCharacterStore.getState().setField("actionUsed", true);
              addLog(`Приказ · Сл ${dc}`);
              toast.success(`Приказ · Сл ${dc}`);
            }}
          >
            Приказ (−Голос)
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-11"
            onClick={() => {
              if (voice.current <= 0) {
                toast.error("Голос исчерпан");
                return;
              }
              useCharacterStore.getState().updateResource(voice.id, {
                current: voice.current - 1,
              });
              useCharacterStore.getState().patch({
                actionUsed: true,
                concentrating: c.concentrating || "Внушение",
              });
              addLog(`Внушение · Сл ${dc}`);
              toast.success(`Внушение · Сл ${dc}`);
            }}
          >
            Внушение (−Голос)
          </Button>
        </div>
      )}

            <div className="flex flex-wrap items-end gap-2">
        <label className="text-[10px] text-muted">
          Мод. спас цели
          <Input
            type="number"
            className="h-8 w-20"
            value={npcMod}
            onChange={(e) => setNpcMod(Number(e.target.value) || 0)}
          />
        </label>
        <Button type="button" size="sm" variant="blood" onClick={rollNpcSave}>
          Спас цели vs Сл
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(String(dc));
              toast.success(`Сл ${dc} скопирована`);
            } catch {
              toast.message(String(dc));
            }
          }}
        >
          Копировать Сл
        </Button>
      </div>
    </div>
  );
}
