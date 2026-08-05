import { cn } from "@/lib/utils";

type Props = {
  label: string;
  current: number;
  max: number;
  color?: "blood" | "beast" | "hp";
  onSpend?: () => void;
  onGain?: () => void;
  onToggle?: (index: number) => void;
};

const colorMap = {
  blood: {
    filled: "bg-blood border-primary shadow-[0_0_8px_rgb(196_30_58_/_0.45)]",
    empty: "bg-surface-2 border-border-strong",
  },
  beast: {
    filled: "bg-beast border-beast shadow-[0_0_8px_rgb(124_58_237_/_0.4)]",
    empty: "bg-surface-2 border-border-strong",
  },
  hp: {
    filled: "bg-success border-success/80",
    empty: "bg-surface-2 border-border-strong",
  },
};

export function ResourcePool({
  label,
  current,
  max,
  color = "blood",
  onSpend,
  onGain,
  onToggle,
}: Props) {
  const styles = colorMap[color];
  const safeMax = Math.max(0, max);
  const dots = Array.from({ length: safeMax }, (_, i) => i < current);

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-display text-sm tracking-wide text-fg">{label}</span>
        <span className="tabular-nums text-sm text-muted">
          {current}/{safeMax}
        </span>
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {dots.map((filled, i) => (
          <button
            key={i}
            type="button"
            aria-label={`${label} ${i + 1}`}
            onClick={() => onToggle?.(i)}
            className={cn(
              "h-7 w-7 rounded-full border-2 transition-transform active:scale-95",
              filled ? styles.filled : styles.empty,
            )}
          />
        ))}
        {safeMax === 0 && (
          <span className="text-xs text-muted">Нет слотов</span>
        )}
      </div>
      {(onSpend || onGain) && (
        <div className="flex gap-2">
          {onSpend && (
            <button
              type="button"
              onClick={onSpend}
              className="h-9 flex-1 rounded-[var(--radius-sm)] border border-border bg-surface-2 text-xs font-medium text-fg hover:bg-surface-3"
            >
              −1
            </button>
          )}
          {onGain && (
            <button
              type="button"
              onClick={onGain}
              className="h-9 flex-1 rounded-[var(--radius-sm)] border border-border bg-surface-2 text-xs font-medium text-fg hover:bg-surface-3"
            >
              +1
            </button>
          )}
        </div>
      )}
    </div>
  );
}
