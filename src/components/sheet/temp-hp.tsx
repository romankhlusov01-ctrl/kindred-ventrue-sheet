import { toast } from "sonner";
import { ShieldPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useCharacterStore } from "@/lib/character-store";

export function TempHp() {
  const tempHp = useCharacterStore((s) => s.character.tempHp);
  const setField = useCharacterStore((s) => s.setField);
  const addLog = useCharacterStore((s) => s.addLog);
  const [val, setVal] = useState(5);

  function setTemp(n: number) {
    // 2024: temp HP doesn't stack — take the higher
    const next = Math.max(0, n);
    const applied = Math.max(tempHp, next);
    setField("tempHp", applied);
    addLog(`Врем. хиты → ${applied}`);
    toast.message(`Врем. ХП ${applied}`);
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <h3 className="mb-2 flex items-center gap-2 font-display text-sm">
        <ShieldPlus className="size-4 text-accent" /> Временные хиты
      </h3>
      <p className="mb-2 text-xs text-muted">
        Сейчас: <strong className="text-fg">{tempHp}</strong> · не стакаются (берётся большее)
      </p>
      <div className="flex flex-wrap gap-1.5">
        {[3, 5, 8, 10].map((n) => (
          <Button
            key={n}
            type="button"
            size="sm"
            variant="secondary"
            className="h-8"
            onClick={() => setTemp(n)}
          >
            {n}
          </Button>
        ))}
        <Input
          type="number"
          className="h-8 w-16"
          value={val}
          onChange={(e) => setVal(Number(e.target.value) || 0)}
        />
        <Button type="button" size="sm" variant="outline" className="h-8" onClick={() => setTemp(val)}>
          Задать
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8"
          onClick={() => {
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
