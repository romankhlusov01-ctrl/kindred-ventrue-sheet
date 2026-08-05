import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCharacterStore } from "@/lib/character-store";
import type { RollMode } from "@/lib/roll-engine";

/** One-row sticky d20 mode — always in thumb reach */
export function RollModeBar() {
  const c = useCharacterStore((s) => s.character);
  const setRollMode = useCharacterStore((s) => s.setRollMode);
  const setField = useCharacterStore((s) => s.setField);
  const mode = c.rollMode ?? "norm";

  const modes: { id: RollMode; label: string; hint: string }[] = [
    { id: "norm", label: "N", hint: "Обычный" },
    { id: "adv", label: "↑", hint: "Преим." },
    { id: "dis", label: "↓", hint: "Помеха" },
  ];

  return (
    <div className="flex items-center gap-1.5 rounded-[var(--radius-lg)] border border-border bg-surface p-1.5">
      <span className="shrink-0 px-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
        d20
      </span>
      {modes.map((m) => (
        <button
          key={m.id}
          type="button"
          title={m.hint}
          onClick={() => {
            setRollMode(m.id);
            toast.message(m.hint);
          }}
          className={cn(
            "flex h-11 min-w-[2.75rem] flex-1 items-center justify-center rounded-[var(--radius)] text-sm font-bold active:scale-[0.97]",
            mode === m.id
              ? m.id === "adv"
                ? "bg-accent/25 text-accent"
                : m.id === "dis"
                  ? "bg-primary/25 text-primary"
                  : "bg-surface-3 text-fg"
              : "bg-surface-2 text-muted",
          )}
        >
          {m.label}
        </button>
      ))}
      {(c.pendingAdv || c.pendingDis || c.beastActive) && (
        <button
          type="button"
          className="flex h-11 shrink-0 items-center gap-1 rounded-[var(--radius)] border border-accent/40 bg-accent/10 px-2 text-[10px] font-medium text-accent"
          onClick={() => {
            setField("pendingAdv", false);
            setField("pendingDis", false);
            if (c.beastActive) {
              useCharacterStore.getState().clearBeast();
            }
            toast.message("Модификаторы сняты");
          }}
        >
          {c.beastActive && <span className="text-beast">Зв★</span>}
          {c.pendingAdv && <span>↑след</span>}
          {c.pendingDis && <span className="text-primary">↓след</span>}
          ×
        </button>
      )}
    </div>
  );
}
