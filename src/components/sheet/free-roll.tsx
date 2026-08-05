import { useState } from "react";
import { toast } from "sonner";
import { Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { rollDamage } from "@/lib/roll-engine";
import { useCharacterStore } from "@/lib/character-store";
import { useSessionStore } from "@/lib/session-store";

export function FreeRoll() {
  const [expr, setExpr] = useState("2d6+3");
  const addLog = useCharacterStore((s) => s.addLog);
  const setLastRoll = useSessionStore((s) => s.setLastRoll);

  function go() {
    const r = rollDamage(expr);
    setLastRoll({ label: expr, total: r.total, detail: r.detail, at: Date.now() });
    addLog(`${expr}: ${r.total} (${r.detail})`);
    toast.message(`${expr} = ${r.total}`);
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <h3 className="mb-2 flex items-center gap-2 font-display text-sm">
        <Dices className="size-4 text-accent" /> Свободный урон
      </h3>
      <div className="flex gap-2">
        <Input className="h-9" value={expr} onChange={(e) => setExpr(e.target.value)} />
        <Button type="button" size="sm" variant="secondary" onClick={go}>
          Бросок
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {["1d4", "1d6", "1d8", "1d10", "2d6", "4d6", "8d6"].map((e) => (
          <Button key={e} type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setExpr(e); const r = rollDamage(e); setLastRoll({ label: e, total: r.total, detail: r.detail, at: Date.now() }); addLog(`${e}: ${r.total}`); toast.message(`${e}=${r.total}`); }}>
            {e}
          </Button>
        ))}
      </div>
    </div>
  );
}
