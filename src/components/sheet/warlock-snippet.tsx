import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCharacterStore } from "@/lib/character-store";
import { useSessionStore } from "@/lib/session-store";
import { abilityMod, formatMod, rollDie } from "@/lib/utils";
import { effectivePb } from "@/lib/level-utils";
import { rollD20 } from "@/lib/roll-engine";
import { conditionMode } from "@/lib/play-helpers";

/** Compact Warlock 1 helpers if multiclass mentions warlock */
export function WarlockSnippet() {
  const c = useCharacterStore((s) => s.character);
  const addLog = useCharacterStore((s) => s.addLog);
  const consumeRollMode = useCharacterStore((s) => s.consumeRollMode);
  const setLastRoll = useSessionStore((s) => s.setLastRoll);
  const pushUndo = useSessionStore((s) => s.pushUndo);
  const updateResource = useCharacterStore((s) => s.updateResource);

  const isWarlock = /колдун|warlock/i.test(c.multiclass || "");
  if (!isWarlock) return null;

  const pb = effectivePb(c.level, c.multiclass);
  const cha = abilityMod(c.abilities.cha);
  const dc = 8 + pb + cha;
  const atk = pb + cha;
  const pact = c.customResources.find((r) => /пакт|pact|слот/i.test(r.name + r.note));

  return (
    <div className="rounded-[var(--radius-lg)] border border-beast/30 bg-beast/5 p-3">
      <h3 className="mb-2 flex items-center gap-2 font-display text-sm text-beast">
        <Sparkles className="size-3.5" /> Колдун (мульти)
      </h3>
      <div className="mb-2 grid grid-cols-2 gap-2 text-center text-xs">
        <div className="rounded border border-border bg-surface-2 py-2">
          <div className="text-muted">Сл закл.</div>
          <div className="font-display text-2xl text-primary">{dc}</div>
        </div>
        <div className="rounded border border-border bg-surface-2 py-2">
          <div className="text-muted">Атака закл.</div>
          <div className="font-display text-2xl text-accent">{formatMod(atk)}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <Button
          type="button"
          variant="secondary"
          className="h-12"
          onClick={() => {
            let base = c.rollMode ?? "norm";
            if (c.beastActive || c.pendingAdv) base = base === "dis" ? "norm" : "adv";
            const r = rollD20("Атака закл.", atk, conditionMode(c, "attack", base));
            consumeRollMode();
            setLastRoll({ label: r.label, total: r.total, detail: r.detail, at: Date.now() });
            addLog(`${r.label}: ${r.total}`);
            toast.message(`Атака ${r.total}`);
          }}
        >
          Атака {formatMod(atk)}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-12"
          onClick={() => {
            if (!pact || pact.current <= 0) {
              toast.error("Нет слота пакта");
              return;
            }
            pushUndo("Пакт");
            updateResource(pact.id, { current: pact.current - 1 });
            toast.message(`Пакт ${pact.current - 1}/${pact.max}`);
          }}
        >
          Пакт −1
          {pact ? ` (${pact.current})` : ""}
        </Button>
        <Button
          type="button"
          variant="blood"
          className="h-12 col-span-2"
          onClick={() => {
            const d = rollDie(10) + cha;
            setLastRoll({ label: "Eldritch Blast", total: d, detail: `1d10${formatMod(cha)}`, at: Date.now() });
            addLog(`EB: ${d}`);
            toast.success(`EB ${d}`);
          }}
        >
          Eldritch Blast урон
        </Button>
      </div>
    </div>
  );
}
