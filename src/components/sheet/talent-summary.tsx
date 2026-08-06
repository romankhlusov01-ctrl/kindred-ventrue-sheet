import { KINDRED_FEATS } from "@/data/kindred-ru";
import { originFeatById } from "@/data/origin-ru";
import { GENERAL_FEAT_CATALOG } from "@/data/phb-feats-ru";
import { kindredFeatSlots, asiCount } from "@/data/builder-ru";
import { useCharacterStore } from "@/lib/character-store";
import { cn } from "@/lib/utils";

/** Compact active-talent readout for play / features */
export function TalentSummary({ className }: { className?: string }) {
  const c = useCharacterStore((s) => s.character);
  const kSlots = kindredFeatSlots(c.level);
  const gSlots = asiCount(c.level);
  const origin = originFeatById(c.originFeatId);
  const bg = originFeatById(c.backgroundFeatId);
  const kindred = c.selectedFeats.map((id) => KINDRED_FEATS.find((f) => f.id === id)?.name ?? id);
  const general = (c.generalFeats ?? []).map(
    (id) => GENERAL_FEAT_CATALOG.find((f) => f.id === id)?.name ?? id,
  );

  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-border bg-surface p-3",
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="font-display text-sm tracking-wide text-fg">Таланты</h3>
        <span className="text-[10px] text-faint">
          Сородич {c.selectedFeats.length}/{kSlots} · PHB {general.length}/{gSlots}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {origin && (
          <Chip tone="accent" label={`${origin.name} · вид`} />
        )}
        {bg && <Chip tone="accent" label={`${bg.name} · био`} />}
        {kindred.map((n) => (
          <Chip key={n} tone="primary" label={n} />
        ))}
        {general.map((n) => (
          <Chip key={`g-${n}`} tone="muted" label={`PHB · ${n}`} />
        ))}
        {!kindred.length && !general.length && (
          <span className="text-xs text-muted">Нет выбранных черт — открой билдер / Черты</span>
        )}
      </div>
    </div>
  );
}

function Chip({
  label,
  tone,
}: {
  label: string;
  tone: "primary" | "accent" | "muted";
}) {
  return (
    <span
      className={cn(
        "max-w-full truncate rounded-full border px-2.5 py-1 text-[11px] font-medium",
        tone === "primary" && "border-primary/40 bg-primary/15 text-primary",
        tone === "accent" && "border-accent/40 bg-accent/15 text-accent",
        tone === "muted" && "border-border bg-surface-2 text-muted",
      )}
    >
      {label}
    </span>
  );
}
