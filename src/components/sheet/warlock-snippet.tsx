import { toast } from "sonner";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { abilityMod, formatMod, rollDie } from "@/lib/utils";
import { getLevelData } from "@/data/kindred-ru";
import { useCharacterStore } from "@/lib/character-store";
import { rollD20 } from "@/lib/roll-engine";
import { conditionMode } from "@/lib/play-helpers";

/** Compact warlock tools when multiclass text mentions колдун/warlock */
export function WarlockSnippet() {
  const c = useCharacterStore((s) => s.character);
  const addLog = useCharacterStore((s) => s.addLog);
  const updateResource = useCharacterStore((s) => s.updateResource);
  const mc = (c.multiclass || "").toLowerCase();
  if (!/колдун|warlock|пакт/.test(mc)) return null;

  const pb = getLevelData(c.level).pb;
  // total character level approx: if "1" in multiclass and kindred 7 → often total 8
  const cha = abilityMod(c.abilities.cha);
  const atk = cha + pb;

  return (
    <div className="rounded-[var(--radius-lg)] border border-beast/40 bg-beast/10 p-4">
      <h3 className="mb-2 flex items-center gap-2 font-display text-sm">
        <Flame className="size-4 text-beast" /> Колдун (мультикласс)
      </h3>
      <p className="mb-2 text-xs text-muted">{c.multiclass} · атака закл. {formatMod(atk)}</p>
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
            const dmg = rollDie(10) + (c.level >= 5 ? rollDie(10) : 0);
            // simple: 1 beam at low level
            const beams = Math.max(1, Math.ceil((c.level + 1) / 6));
            let total = 0;
            const parts: number[] = [];
            for (let i = 0; i < beams; i++) {
              const d = rollDie(10);
              parts.push(d);
              total += d;
            }
            addLog(`EB: hit ${r.total}, урон ${parts.join("+")}=${total}`);
            toast.success(`EB ${r.total} → ${total} силовой (${beams} луч.)`);
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
      </div>
    </div>
  );
}
