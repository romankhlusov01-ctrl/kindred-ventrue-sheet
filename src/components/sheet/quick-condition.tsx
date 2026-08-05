import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCharacterStore } from "@/lib/character-store";

const QUICK = [
  "Голод",
  "Очарован",
  "Испуган",
  "Отравленный",
  "Недееспособный",
  "Ослеплён",
  "Оглушён",
  "Схвачен",
];

/** One-tap conditions on yourself */
export function QuickCondition() {
  const c = useCharacterStore((s) => s.character);
  const toggleCondition = useCharacterStore((s) => s.toggleCondition);

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
      <h3 className="mb-2 flex items-center gap-1.5 font-display text-sm">
        <AlertTriangle className="size-3.5 text-accent" /> Состояния
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {QUICK.map((name) => {
          const on = c.conditions.includes(name) || (name === "Голод" && c.hunger);
          return (
            <Button
              key={name}
              type="button"
              size="sm"
              variant={on ? "blood" : "secondary"}
              className="h-10"
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
      {c.conditions.length > 0 && (
        <p className="mt-2 text-[11px] text-muted">
          Активно: {c.conditions.join(", ")} · тап чтобы снять
        </p>
      )}
    </div>
  );
}
