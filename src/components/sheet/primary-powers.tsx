import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCharacterStore } from "@/lib/character-store";
import { useSessionStore } from "@/lib/session-store";
import { abilityMod, rollDie } from "@/lib/utils";
import { effectivePb } from "@/lib/level-utils";

/** Always-visible top Kindred spends — not buried in collapse */
export function PrimaryPowers() {
  const c = useCharacterStore((s) => s.character);
  const spendBlood = useCharacterStore((s) => s.spendBlood);
  const adjustHp = useCharacterStore((s) => s.adjustHp);
  const addLog = useCharacterStore((s) => s.addLog);
  const updateResource = useCharacterStore((s) => s.updateResource);
  const patch = useCharacterStore((s) => s.patch);
  const pushUndo = useSessionStore((s) => s.pushUndo);
  const setLastRoll = useSessionStore((s) => s.setLastRoll);
  const pb = effectivePb(c.level, c.multiclass);
  const cha = abilityMod(c.abilities.cha);
  const dc = 8 + pb + cha;
  const presence = c.customResources.find((r) => /присутств|forceful|awe/i.test(r.name));

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-display text-sm">Силы сейчас</h3>
        <span className="text-[10px] text-muted">Сл {dc}</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <Button
          type="button"
          variant="blood"
          className="h-12"
          onClick={() => {
            if (c.bloodCurrent < 1) return toast.error("Нет ОБК");
            pushUndo("Лечение");
            spendBlood(1);
            const heal = rollDie(10) + c.level;
            adjustHp(heal);
            addLog(`Исцеление: +${heal}`);
            setLastRoll({ label: "Исцеление", total: heal, detail: `d10+${c.level}`, at: Date.now() });
            toast.success(`+${heal} ХП`);
          }}
        >
          Лечение (−1 ОБК)
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-12"
          onClick={() => {
            if (c.bloodCurrent < 1) return toast.error("Нет ОБК");
            pushUndo("Снять голод");
            spendBlood(1);
            patch({
              hunger: false,
              conditions: c.conditions.filter((x) => x !== "Голод"),
            });
            toast.message("Голод снят");
          }}
        >
          Снять голод (−1)
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-12"
          disabled={!presence || presence.current <= 0}
          onClick={() => {
            if (!presence || presence.current <= 0) return toast.error("Нет Awe");
            pushUndo("Awe");
            updateResource(presence.id, { current: presence.current - 1 });
            patch({ bonusUsed: true });
            addLog("Awe 10 мин");
            useSessionStore.getState().addEffect("Awe 10 мин", 10);
            toast.message("Awe");
          }}
        >
          Awe (−БД)
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-12"
          onClick={() => {
            useCharacterStore.getState().shortRest();
            toast.success("Короткий отдых");
          }}
        >
          Короткий отдых
        </Button>
      </div>
    </div>
  );
}
