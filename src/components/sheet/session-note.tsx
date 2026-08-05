import { StickyNote } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useSessionStore } from "@/lib/session-store";

/** Ephemeral session goal / GM notes — not saved with character JSON */
export function SessionNote() {
  const note = useSessionStore((s) => s.sessionNote);
  const setSessionNote = useSessionStore((s) => s.setSessionNote);

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <h3 className="mb-2 flex items-center gap-2 font-display text-sm">
        <StickyNote className="size-4 text-accent" /> Цель сцены
      </h3>
      <Textarea
        className="min-h-[72px] text-sm"
        placeholder="Напр.: проникнуть на приём · утолить голод без убийства · запугать охотника…"
        value={note}
        onChange={(e) => setSessionNote(e.target.value)}
      />
    </div>
  );
}
