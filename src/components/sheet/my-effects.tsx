import { toast } from "sonner";
import { Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/lib/session-store";
import { useCharacterStore } from "@/lib/character-store";

const PRESETS: [string, number | null][] = [
  ["Awe 10 мин", 10],
  ["Внушение", 10],
  ["Голод", null],
  ["Ярость Зверя", 10],
  ["Испуг", 10],
  ["Плоть мрамора", 1],
];

/** Personal buff/debuff timers — no enemies */
export function MyEffects() {
  const effects = useSessionStore((s) => s.effects);
  const addEffect = useSessionStore((s) => s.addEffect);
  const removeEffect = useSessionStore((s) => s.removeEffect);
  const tickEffects = useSessionStore((s) => s.tickEffects);
  const newTurn = useCharacterStore((s) => s.newTurn);

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 font-display text-sm">
          <Timer className="size-3.5 text-accent" /> Эффекты на вас
        </h3>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9"
          onClick={() => {
            tickEffects();
            newTurn();
            toast.message("Ход · эффекты −1");
          }}
        >
          Ход
        </Button>
      </div>
      <div className="mb-2 flex flex-wrap gap-1">
        {PRESETS.map(([name, rounds]) => (
          <Button
            key={name}
            type="button"
            size="sm"
            variant="secondary"
            className="h-9 text-xs"
            onClick={() => {
              addEffect(name, rounds);
              toast.message(`+ ${name}`);
            }}
          >
            +{name}
          </Button>
        ))}
      </div>
      {effects.length === 0 ? (
        <p className="text-xs text-muted">Нет активных эффектов.</p>
      ) : (
        <ul className="space-y-1">
          {effects.map((fx) => (
            <li
              key={fx.id}
              className="flex items-center justify-between gap-2 rounded border border-border bg-surface-2 px-2 py-2 text-sm"
            >
              <span>
                {fx.name}
                {fx.roundsLeft != null && (
                  <span className="ml-2 text-xs text-muted">{fx.roundsLeft} р.</span>
                )}
              </span>
              <button
                type="button"
                className="text-muted"
                onClick={() => removeEffect(fx.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
