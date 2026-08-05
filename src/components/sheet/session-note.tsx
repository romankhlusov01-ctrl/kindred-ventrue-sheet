import { StickyNote } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/lib/session-store";

const PRESETS = [
  "Утолить голод без убийства",
  "Запугать / убедить ключевого NPC",
  "Доминировать свидетель",
  "Пережить охотников",
  "Защитить Опору",
  "Собрать информацию в салоне",
];

/** Ephemeral session goal — not saved with character JSON */
export function SessionNote() {
  const note = useSessionStore((s) => s.sessionNote);
  const setSessionNote = useSessionStore((s) => s.setSessionNote);

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
      <h3 className="mb-2 flex items-center gap-2 font-display text-sm">
        <StickyNote className="size-3.5 text-accent" /> Цель сцены
      </h3>
      <Textarea
        className="min-h-24 text-sm"
        placeholder="Что вы хотите добиться этой сценой…"
        value={note}
        onChange={(e) => setSessionNote(e.target.value)}
      />
      <div className="mt-2 flex flex-wrap gap-1">
        {PRESETS.map((p) => (
          <Button
            key={p}
            type="button"
            size="sm"
            variant="outline"
            className="h-9 text-[10px]"
            onClick={() => setSessionNote(p)}
          >
            {p}
          </Button>
        ))}
      </div>
    </div>
  );
}
