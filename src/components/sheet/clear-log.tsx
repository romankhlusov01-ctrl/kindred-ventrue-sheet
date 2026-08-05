import { toast } from "sonner";
import { Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCharacterStore } from "@/lib/character-store";

export function ClearLog() {
  const setField = useCharacterStore((s) => s.setField);
  const n = useCharacterStore((s) => s.character.sessionLog.length);

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={() => {
        if (!n) {
          toast.message("Журнал пуст");
          return;
        }
        if (!window.confirm(`Очистить ${n} записей журнала?`)) return;
        setField("sessionLog", []);
        toast.message("Журнал очищен");
      }}
    >
      <Eraser className="size-3.5" /> Очистить лог
    </Button>
  );
}
