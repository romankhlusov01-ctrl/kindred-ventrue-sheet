import { toast } from "sonner";
import { ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCharacterStore } from "@/lib/character-store";

export function ExportLog() {
  const c = useCharacterStore((s) => s.character);

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      onClick={async () => {
        const lines = c.sessionLog
          .slice()
          .reverse()
          .map((e) => {
            const t = new Date(e.at).toLocaleString("ru-RU");
            return `[${t}] ${e.text}`;
          })
          .join("\n");
        const text = `Журнал: ${c.name}\n\n${lines || "(пусто)"}`;
        try {
          await navigator.clipboard.writeText(text);
          toast.success("Журнал скопирован");
        } catch {
          toast.message("Не удалось скопировать");
        }
      }}
    >
      <ScrollText className="size-3.5" /> Журнал
    </Button>
  );
}
