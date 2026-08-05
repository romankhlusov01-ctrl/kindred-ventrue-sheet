import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { calcKindredHp } from "@/data/builder-ru";
import { useCharacterStore } from "@/lib/character-store";

export function RecalcHp() {
  const c = useCharacterStore((s) => s.character);
  const setField = useCharacterStore((s) => s.setField);
  const hp = calcKindredHp(c.level, c.abilities.con, c.level >= 6 && c.clan === "ventrue");

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={() => {
        const delta = hp - c.hpMax;
        setField("hpMax", hp);
        if (delta > 0) setField("hpCurrent", c.hpCurrent + delta);
        toast.success(`Макс. ХП = ${hp} (d8 average + Dare Not Falter)`);
      }}
    >
      Пересчёт ХП → {hp}
    </Button>
  );
}
