import { toast } from "sonner";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCharacterStore } from "@/lib/character-store";
import { useSessionStore } from "@/lib/session-store";

export function ExportLog() {
  const c = useCharacterStore((s) => s.character);
  const note = useSessionStore((s) => s.sessionNote);
  const effects = useSessionStore((s) => s.effects);

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="h-10"
      onClick={() => {
        const lines = [
          `# Журнал · ${c.name}`,
          `Ур.${c.level}${c.multiclass ? ` / ${c.multiclass}` : ""} · ${new Date().toLocaleString("ru")}`,
          note ? `\nЗаметка сессии:\n${note}` : "",
          effects.length
            ? `\nЭффекты на вас:\n${effects.map((e) => `  - ${e.name}${e.roundsLeft != null ? ` (${e.roundsLeft} р.)` : ""}`).join("\n")}`
            : "",
          "\n— Лог —",
          ...c.sessionLog.map(
            (e) =>
              `${new Date(e.at).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })} ${e.text}`,
          ),
        ];
        const blob = new Blob([lines.filter(Boolean).join("\n")], {
          type: "text/plain;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `log-${c.name || "kindred"}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Лог скачан");
      }}
    >
      <FileDown className="size-3.5" />
      <span className="hidden sm:inline">Лог</span>
    </Button>
  );
}
