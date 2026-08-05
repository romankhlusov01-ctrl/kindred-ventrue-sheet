import { toast } from "sonner";
import { ShieldPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useCharacterStore } from "@/lib/character-store";
import { useSessionStore } from "@/lib/session-store";

export function TempHp() {
  const tempHp = useCharacterStore((s) => s.character.tempHp);
  const setField = useCharacterStore((s) => s.setField);
  const addLog = useCharacterStore((s) => s.addLog);
  const pushUndo = useSessionStore((s) => s.pushUndo);
  const [val, setVal] = useState(5);

  function setTemp(n: number) {
    pushUndo("Врем. ХП");
    // 2024: temp HP doesn't stack — take the higher
    const next = Math.max(0, n);
    const applied = Math.max(tempHp, next);
    setField("tempHp", applied);
    addLog(`Врем. хиты → ${applied}`);
    toast.message(`Врем. ХП ${applied}`);
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
      <h3 className="mb-2 flex items-center gap-2 font-display text-sm">
        <ShieldPlus className="size-3.5 text-accent" /> Временные хиты
      </h3>
      <p className="mb-2 text-xs text-muted">
        Сейчас: <strong className="font-display text-lg text-fg">{tempHp}</strong> · не
        стакаются (берётся большее)
      </p>
      <div className="grid grid-cols-4 gap-1.5">
        {[3, 5, 8, 10].map((n) => (
          <Button
            key={n}
            type="button"
            variant="secondary"
            className="h-11"
            onClick={() => setTemp(n)}
          >
            {n}
          </Button>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <Input
          type="number"
          className="h-11 w-20"
          value={val}
          onChange={(e) => setVal(Number(e.target.value) || 0)}
        />
        <Button type="button" variant="outline" className="h-11 flex-1" onClick={() => setTemp(val)}>
          Задать
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-11"
          onClick={() => {
            pushUndo("Врем. 0");
            setField("tempHp", 0);
            toast.message("Врем. 0");
          }}
        >
          Сброс
        </Button>
      </div>
    </div>
  );
}
