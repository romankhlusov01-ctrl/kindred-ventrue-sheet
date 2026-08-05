import { toast } from "sonner";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { abilityMod, formatMod, rollDie } from "@/lib/utils";
import { effectivePb } from "@/lib/level-utils";
import { useCharacterStore } from "@/lib/character-store";
import { rollD20 } from "@/lib/roll-engine";
import { conditionMode } from "@/lib/play-helpers";
import { useSessionStore } from "@/lib/session-store";

/** Compact warlock tools when multiclass text mentions колдун/warlock */
export function WarlockSnippet() {
  const c = useCharacterStore((s) => s.character);
  const addLog = useCharacterStore((s) => s.addLog);
  const updateResource = useCharacterStore((s) => s.updateResource);
  const setLastRoll = useSessionStore((s) => s.setLastRoll);
  const mc = (c.multiclass || "").toLowerCase();
  if (!/колдун|warlock|пакт/.test(mc)) return null;

  const pb = effectivePb(c.level, c.multiclass);
  const cha = abilityMod(c.abilities.cha);
  const atk = cha + pb;
  // Agonizing Blast assumed if CHA investment (common for this build)
  const agonizing = cha > 0;

  return (
    <div className="rounded-[var(--radius-lg)] border border-beast/40 bg-beast/10 p-4">
      <h3 className="mb-2 flex items-center gap-2 font-display text-sm">
        <Flame className="size-4 text-beast" /> Колдун (мультикласс)
      </h3>
      <p className="mb-2 text-xs text-muted">
        {c.multiclass} · атака закл. {formatMod(atk)}
        {agonizing ? ` · Agonizing +${cha}` : ""}
      </p>
      <div className="flex flex-wrap gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => {
            const mode = conditionMode(
              c,
              "attack",
              c.beastActive ? "adv" : c.rollMode ?? "norm",
            );
            const r = rollD20("Мистический заряд", atk, mode);
            const wl = (c.multiclass.match(/(\d+)/) || [])[1];
            const charLevel = c.level + (wl ? Number(wl) : 0);
            const beams = charLevel >= 17 ? 4 : charLevel >= 11 ? 3 : charLevel >= 5 ? 2 : 1;
            let dmgTotal = 0;
            const parts: number[] = [];
            for (let i = 0; i < beams; i++) {
              const d = rollDie(10) + (agonizing ? cha : 0);
              parts.push(d);
              dmgTotal += d;
            }
            setLastRoll({
              label: "Мист. заряд",
              total: r.total,
              detail: r.detail,
              at: Date.now(),
            });
            addLog(`EB: hit ${r.total}, урон ${parts.join("+")}=${dmgTotal}`);
            toast.success(`EB ${r.total} → ${dmgTotal} силовой (${beams} луч.)`);
          }}
        >
          Мист. заряд
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            const res = c.customResources.find((r) => /пакт|pact|ячейк/i.test(r.name));
            if (res) {
              if (res.current <= 0) {
                toast.error("Ячейка пакта пуста");
                return;
              }
              updateResource(res.id, { current: res.current - 1 });
              toast.message("Ячейка пакта −1");
              addLog("Потрачена ячейка пакта");
            } else {
              toast.message("Добавьте ресурс «Ячейка пакта» в лист");
            }
          }}
        >
          −Ячейка пакта
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            // Hex / Hexblade curse placeholder log
            addLog("Hex / проклятие: отметьте помеху на спас / бонус урона вручную");
            toast.message("Hex: см. лог");
          }}
        >
          Hex
        </Button>
      </div>
    </div>
  );
}
