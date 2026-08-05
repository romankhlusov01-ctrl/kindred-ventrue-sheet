import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Progressive disclosure — default collapsed to fight mobile overload */
export function ToolSection({
  title,
  hint,
  defaultOpen = false,
  badge,
  children,
  accent,
}: {
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  badge?: ReactNode;
  children: ReactNode;
  accent?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg)] border",
        accent ? "border-primary/35 bg-primary/5" : "border-border bg-surface",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-12 w-full items-center gap-2 px-3.5 py-2.5 text-left transition-colors active:bg-surface-2"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm tracking-wide text-fg">{title}</span>
            {badge}
          </div>
          {hint && !open && (
            <p className="mt-0.5 truncate text-[11px] text-muted">{hint}</p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="space-y-3 border-t border-border px-3 pb-3 pt-3">{children}</div>
      )}
    </div>
  );
}
