import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONDITIONS } from "@/data/skills";
import { useCharacterStore } from "@/lib/character-store";
import { cn } from "@/lib/utils";

const QUICK = [
  "Голод",
  "Испуган",
  "Отравлен",
  "Сбит с ног",
  "Схвачен",
  "Невидим",
  "Ослеплён",
  "Оглушён",
  "Очарован",
  "Парализован",
] as const;

export function QuickCondition() {
  const c = useCharacterStore((s) => s.character);
  const toggleCondition = useCharacterStore((s) => s.toggleCondition);

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <h3 className="mb-2 flex items-center gap-2 font-display text-sm">
        <AlertTriangle className="size-4 text-accent" /> Быстрые состояния
      </h3>
      <div className="flex flex-wrap gap-1">
        {QUICK.map((name) => {
          const on = c.conditions.includes(name);
          return (
            <Button
              key={name}
              type="button"
              size="sm"
              variant={on ? "blood" : "secondary"}
              className={cn("h-8 text-xs", on && "ring-1 ring-primary")}
              onClick={() => {
                toggleCondition(name);
                toast.message(on ? `− ${name}` : `+ ${name}`);
              }}
            >
              {name}
            </Button>
          );
        })}
      </div>
      <p className="mt-2 text-[10px] text-muted">
        Полный список: {CONDITIONS.length} состояний на вкладке Бой.
      </p>
    </div>
  );
}
