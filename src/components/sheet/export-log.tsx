import { toast } from "sonner";
import { ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCharacterStore } from "@/lib/character-store";
import { useSessionStore } from "@/lib/session-store";

export function ExportLog() {
  const c = useCharacterStore((s) => s.character);
  const note = useSessionStore((s) => s.sessionNote);
  const enemies = useSessionStore((s) => s.enemies);
  const effects = useSessionStore((s) => s.effects);

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
        const enemyBlock = enemies.length
          ? "\nВраги:\n" +
            enemies.map((e) => `  - ${e.name}: ${e.hp}/${e.hpMax} ХП · КД ${e.ac}`).join("\n")
          : "";
        const fx =
          effects.length > 0
            ? "\nЭффекты: " + effects.map((f) => f.name).join(", ")
            : "";
        const text = [
          `Журнал: ${c.name}`,
          note ? `Цель: ${note}` : null,
          `Раунд ${c.round ?? 1} · ХП ${c.hpCurrent}/${c.hpMax} · ОБК ${c.bloodCurrent}`,
          enemyBlock.trim() || null,
          fx.trim() || null,
          "",
          lines || "(пусто)",
        ]
          .filter((x) => x != null)
          .join("\n");
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
