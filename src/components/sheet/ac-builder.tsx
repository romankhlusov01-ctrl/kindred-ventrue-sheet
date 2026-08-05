import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { abilityMod, formatMod } from "@/lib/utils";
import { useCharacterStore } from "@/lib/character-store";
import { toast } from "sonner";

const ARMORS = [
  { id: "none", name: "Без доспеха", base: 10, dex: true, maxDex: 99 },
  { id: "leather", name: "Кожа", base: 11, dex: true, maxDex: 99 },
  { id: "studded", name: "Клёпаная кожа", base: 12, dex: true, maxDex: 99 },
  { id: "hide", name: "Шкура", base: 12, dex: true, maxDex: 2 },
  { id: "chain", name: "Кольчужная рубаха", base: 13, dex: true, maxDex: 2 },
  { id: "scale", name: "Чешуя", base: 14, dex: true, maxDex: 2 },
  { id: "breast", name: "Нагрудник", base: 14, dex: true, maxDex: 2 },
  { id: "half", name: "Полулаты", base: 15, dex: true, maxDex: 2 },
  { id: "ring", name: "Кольчуга", base: 14, dex: false, maxDex: 0 },
  { id: "chainm", name: "Кольчужный доспех", base: 16, dex: false, maxDex: 0 },
  { id: "splint", name: "Наборный", base: 17, dex: false, maxDex: 0 },
  { id: "plate", name: "Латы", base: 18, dex: false, maxDex: 0 },
];

export function AcBuilder() {
  const c = useCharacterStore((s) => s.character);
  const setField = useCharacterStore((s) => s.setField);
  const dex = abilityMod(c.abilities.dex);

  function apply(a: (typeof ARMORS)[0], shield: boolean) {
    let ac = a.base;
    if (a.dex) ac += Math.min(dex, a.maxDex);
    if (shield) ac += 2;
    setField("ac", ac);
    toast.success(`КД ${ac} (${a.name}${shield ? " + щит" : ""})`);
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <h3 className="mb-1 flex items-center gap-2 font-display text-sm">
        <Shield className="size-4 text-accent" /> Калькулятор КД
      </h3>
      <p className="mb-2 text-[10px] text-muted">Лов {formatMod(dex)} · сейчас КД {c.ac}</p>
      <div className="grid max-h-48 grid-cols-1 gap-1 overflow-y-auto scroll-thin sm:grid-cols-2">
        {ARMORS.map((a) => {
          let ac = a.base + (a.dex ? Math.min(dex, a.maxDex) : 0);
          return (
            <div key={a.id} className="flex gap-1">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-8 flex-1 justify-between text-xs"
                onClick={() => apply(a, false)}
              >
                <span className="truncate">{a.name}</span>
                <span>{ac}</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 px-2 text-xs"
                onClick={() => apply(a, true)}
                title="Со щитом"
              >
                +щ
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
