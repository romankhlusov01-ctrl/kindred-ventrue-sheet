import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Solo GM helper: compare last/manual roll to target AC/DC.
 */
export function TargetCheck({ lastTotal }: { lastTotal?: number | null }) {
  const [target, setTarget] = useState(15);
  const [last, setLast] = useState<number | null>(lastTotal ?? null);
  const [result, setResult] = useState<"hit" | "miss" | null>(null);

  function compare(roll: number) {
    setLast(roll);
    const ok = roll >= target;
    setResult(ok ? "hit" : "miss");
    toast.message(ok ? `Успех vs ${target}` : `Провал vs ${target}`);
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <h3 className="mb-2 flex items-center gap-2 font-display text-sm">
        <Crosshair className="size-4 text-accent" /> Цель (КД / Сл)
      </h3>
      <div className="flex flex-wrap items-end gap-2">
        <label className="block">
          <span className="text-[10px] uppercase text-muted">КД или Сл</span>
          <Input
            type="number"
            className="w-20"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value) || 0)}
          />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase text-muted">Бросок</span>
          <Input
            type="number"
            className="w-20"
            value={last ?? ""}
            placeholder="—"
            onChange={(e) => setLast(Number(e.target.value) || 0)}
          />
        </label>
        <Button type="button" size="sm" variant="secondary" onClick={() => last != null && compare(last)}>
          Сравнить
        </Button>
      </div>
      {result && last != null && (
        <div
          className={cn(
            "mt-3 rounded-[var(--radius)] border px-3 py-2 font-display text-lg",
            result === "hit"
              ? "border-success/40 bg-success/10 text-success"
              : "border-primary/40 bg-primary/10 text-primary",
          )}
        >
          {last} vs {target} → {result === "hit" ? "УСПЕХ" : "ПРОВАЛ"}
          {last - target >= 0 ? ` (+${last - target})` : ` (${last - target})`}
        </div>
      )}
      <p className="mt-2 text-[10px] text-muted">
        Введи итог атаки/проверки (или возьми из тоста) и сравни с КД врага / Сл эффекта.
      </p>
    </div>
  );
}
