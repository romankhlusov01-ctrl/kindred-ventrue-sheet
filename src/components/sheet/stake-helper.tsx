import { toast } from "sonner";
import { Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCharacterStore } from "@/lib/character-store";

/** Wooden stake / paralysis helper (Kindred Biology) */
export function StakeHelper() {
  const c = useCharacterStore((s) => s.character);
  const setField = useCharacterStore((s) => s.setField);
  const addLog = useCharacterStore((s) => s.addLog);

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <h3 className="mb-1 flex items-center gap-2 font-display text-sm">
        <Pin className="size-4 text-accent" /> Деревянный кол
      </h3>
      <p className="mb-2 text-[10px] text-muted">
        Колющий крит или 0 хитов колом → Паралич, пока кол не вынут (PDF).
      </p>
      <div className="flex flex-wrap gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="blood"
          onClick={() => {
            setField(
              "conditions",
              Array.from(new Set([...c.conditions, "Парализован"])),
            );
            if (!c.notes.includes("[КОЛ]")) {
              setField("notes", (c.notes ? c.notes + "\n" : "") + "[КОЛ] Паралич колом");
            }
            addLog("Кол: паралич");
            toast.error("Парализован колом");
          }}
        >
          Вбит кол
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => {
            setField(
              "conditions",
              c.conditions.filter((x) => x !== "Парализован"),
            );
            setField("notes", c.notes.replace(/\n?\[КОЛ\][^\n]*/g, "").trim());
            addLog("Кол вынут");
            toast.success("Кол вынут");
          }}
        >
          Вынуть кол
        </Button>
      </div>
    </div>
  );
}
