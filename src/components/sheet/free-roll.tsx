import { useState } from "react";
import { toast } from "sonner";
import { Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { rollDamage } from "@/lib/roll-engine";
import { useCharacterStore } from "@/lib/character-store";
import { useSessionStore } from "@/lib/session-store";

const PRESETS = ["1d4", "1d6", "1d8", "1d10", "2d6", "2d8", "4d6", "8d6", "1d20"];

export function FreeRoll() {
  const [expr, setExpr] = useState("2d6+3");
  const addLog = useCharacterStore((s) => s.addLog);
  const setLastRoll = useSessionStore((s) => s.setLastRoll);

  function go(e = expr) {
    const r = rollDamage(e);
    setLastRoll({ label: e, total: r.total, detail: r.detail, at: Date.now() });
    addLog(`${e}: ${r.total} (${r.detail})`);
    toast.message(`${e} = ${r.total}`);
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
      <h3 className="mb-2 flex items-center gap-2 font-display text-sm">
        <Dices className="size-3.5 text-accent" /> Свободный урон
      </h3>
      <div className="flex gap-2">
        <Input
          className="h-12"
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") go();
          }}
        />
        <Button type="button" variant="secondary" className="h-12 shrink-0 px-4" onClick={() => go()}>
          Бросок
        </Button>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-5">
        {PRESETS.map((e) => (
          <Button
            key={e}
            type="button"
            variant="outline"
            className="h-11 text-xs"
            onClick={() => {
              setExpr(e);
              go(e);
            }}
          >
            {e}
          </Button>
        ))}
      </div>
    </div>
  );
}
