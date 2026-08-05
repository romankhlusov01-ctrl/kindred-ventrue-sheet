import { useCharacterStore } from "@/lib/character-store";
import { Input } from "@/components/ui/input";

/** Self initiative only — no enemy tracker */
export function InitOrder() {
  const c = useCharacterStore((s) => s.character);
  const setField = useCharacterStore((s) => s.setField);

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
      <h3 className="mb-2 font-display text-sm">Ваша инициатива</h3>
      <div className="flex items-center gap-2">
        <span className="flex-1 text-sm">{c.name || "Вы"}</span>
        <Input
          type="number"
          className="h-11 w-20 text-center"
          value={c.initiative ?? ""}
          placeholder="—"
          onChange={(e) =>
            setField(
              "initiative",
              e.target.value === "" ? null : Number(e.target.value) || 0,
            )
          }
        />
      </div>
    </div>
  );
}
