import { toast } from "sonner";
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useCharacterStore } from "@/lib/character-store";

/**
 * Track blood bond steps (1–3) for your character — self narrative.
 */
export function BloodBond() {
  const c = useCharacterStore((s) => s.character);
  const setField = useCharacterStore((s) => s.setField);
  const addLog = useCharacterStore((s) => s.addLog);
  const [name, setName] = useState("");

  const level =
    c.conditions.includes("Кровная связь III")
      ? 3
      : c.conditions.includes("Кровная связь II")
        ? 2
        : c.conditions.includes("Кровная связь") || c.conditions.includes("Кровная связь I")
          ? 1
          : 0;

  function setBond(n: number) {
    const cleaned = c.conditions.filter((x) => !/^Кровная связь/i.test(x));
    let tags = cleaned;
    if (n === 1) tags = [...cleaned, "Кровная связь"];
    if (n === 2) tags = [...cleaned, "Кровная связь II"];
    if (n === 3) tags = [...cleaned, "Кровная связь III"];
    setField("conditions", tags);
    const who = name || "цель";
    addLog(`Кровная связь ${n || "снята"} · ${who}`);
    toast.message(n ? `Связь ${n} · ${who}` : "Связь снята");
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
      <h3 className="mb-1 flex items-center gap-2 font-display text-sm">
        <Link2 className="size-3.5 text-primary" /> Кровная связь
      </h3>
      <p className="mb-2 text-[11px] text-muted">
        Ступени 1–3 (вы или на вас). Сейчас:{" "}
        <strong className="text-fg">{level || "нет"}</strong>
      </p>
      <Input
        className="mb-2 h-11"
        placeholder="С кем (имя)…"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="grid grid-cols-4 gap-1.5">
        {[0, 1, 2, 3].map((n) => (
          <Button
            key={n}
            type="button"
            variant={level === n ? "blood" : "secondary"}
            className="h-12"
            onClick={() => setBond(n)}
          >
            {n === 0 ? "Нет" : n}
          </Button>
        ))}
      </div>
    </div>
  );
}
