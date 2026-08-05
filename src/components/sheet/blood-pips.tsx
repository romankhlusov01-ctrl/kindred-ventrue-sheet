import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getBloodMax,
  useCharacterStore,
} from "@/lib/character-store";
import { useSessionStore } from "@/lib/session-store";

/** Visual blood pool — tap pip to set level (VtM-style convenience) */
export function BloodPips() {
  const c = useCharacterStore((s) => s.character);
  const setField = useCharacterStore((s) => s.setField);
  const pushUndo = useSessionStore((s) => s.pushUndo);
  const max = getBloodMax(c);

  function setTo(n: number) {
    if (n === c.bloodCurrent) return;
    pushUndo(`ОБК ${c.bloodCurrent}→${n}`);
    setField("bloodCurrent", n);
    toast.message(`ОБК ${n}/${max}`);
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-display text-sm">
          Очки крови{" "}
          <span className="tabular-nums text-primary">
            {c.bloodCurrent}/{max}
          </span>
        </h3>
        <div className="flex gap-1">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded border border-border bg-surface-2 text-sm font-bold"
            onClick={() => setTo(Math.max(0, c.bloodCurrent - 1))}
          >
            −
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded border border-border bg-surface-2 text-sm font-bold"
            onClick={() => setTo(Math.min(max, c.bloodCurrent + 1))}
          >
            +
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: max }, (_, i) => {
          const filled = i < c.bloodCurrent;
          return (
            <button
              key={i}
              type="button"
              aria-label={`ОБК ${i + 1}`}
              onClick={() => {
                // tap filled last pip → empty to i; tap empty → fill to i+1
                if (filled && i === c.bloodCurrent - 1) setTo(i);
                else setTo(i + 1);
              }}
              className={cn(
                "h-8 w-8 rounded-full border-2 transition-colors active:scale-95 sm:h-7 sm:w-7",
                filled
                  ? "border-primary bg-primary shadow-[0_0_8px_rgb(196_30_58_/_0.45)]"
                  : "border-border-strong bg-bg",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
