import { Info } from "lucide-react";
import { useCharacterStore } from "@/lib/character-store";
import { getLevelData } from "@/data/kindred-ru";
import { clanBaneLine } from "@/data/builder-ru";

/** One-line RAW reminders for yourself — not a wall of text */
export function SelfReminders() {
  const c = useCharacterStore((s) => s.character);
  const row = getLevelData(c.level);
  const tips = [
    "Огонь / луч ×2",
    c.bloodCurrent < 1 ? "0 ОБК · Awaken ограничен" : null,
    c.hunger || c.conditions.includes("Голод") ? "Голод активен" : null,
    `Питание ${row.feed}`,
    clanBaneLine(c.clan, c.preferredBlood),
  ].filter(Boolean) as string[];

  return (
    <div className="flex items-start gap-2 rounded-[var(--radius)] border border-border/80 bg-surface-2/60 px-2.5 py-2 text-[11px] text-muted">
      <Info className="mt-0.5 size-3.5 shrink-0 text-faint" />
      <p className="leading-relaxed">{tips.join(" · ")}</p>
    </div>
  );
}
