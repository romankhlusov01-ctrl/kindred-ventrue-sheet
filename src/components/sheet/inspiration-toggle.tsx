import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCharacterStore } from "@/lib/character-store";
import { toast } from "sonner";

export function InspirationToggle() {
  const c = useCharacterStore((s) => s.character);
  const setField = useCharacterStore((s) => s.setField);
  const patch = useCharacterStore((s) => s.patch);
  const addLog = useCharacterStore((s) => s.addLog);

  return (
    <button
      type="button"
      onClick={() => {
        if (c.inspiration) {
          setField("inspiration", false);
          patch({ pendingAdv: true });
          addLog("Вдохновение → преимущество на след. d20");
          toast.success("Вдохновение: преимущество");
        } else {
          setField("inspiration", true);
          toast.message("Вдохновение получено");
        }
      }}
      className={cn(
        "flex min-h-12 w-full items-center justify-between gap-2 rounded-[var(--radius-lg)] border px-4 py-2 text-left transition-colors",
        c.inspiration
          ? "border-accent bg-accent/15 text-accent"
          : "border-border bg-surface text-muted",
      )}
    >
      <span className="flex items-center gap-2 font-display text-sm">
        <Sparkles className="size-4" />
        Героическое вдохновение
      </span>
      <span className="text-xs">{c.inspiration ? "ЕСТЬ · тап = использовать" : "нет"}</span>
    </button>
  );
}
