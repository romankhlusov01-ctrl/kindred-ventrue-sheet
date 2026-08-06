import { cn } from "@/lib/utils";
import { scenarioHints } from "@/lib/play-helpers";
import { useCharacterStore } from "@/lib/character-store";
import { Swords, MessageCircle, Droplets, Moon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { clanBaneLine, isToreadorClan } from "@/data/builder-ru";

const SCENES = [
  { id: "combat", label: "Бой", icon: Swords },
  { id: "social", label: "Соц", icon: MessageCircle },
  { id: "feed", label: "Питание", icon: Droplets },
  { id: "rest", label: "Отдых", icon: Moon },
] as const;

export function ScenarioBar() {
  const scenario = useCharacterStore((s) => s.character.scenario ?? "combat");
  const preferredBlood = useCharacterStore((s) => s.character.preferredBlood);
  const clan = useCharacterStore((s) => s.character.clan);
  const hunger = useCharacterStore((s) => s.character.hunger);
  const setField = useCharacterStore((s) => s.setField);
  const hints = scenarioHints(scenario);
  const toreador = isToreadorClan(clan);

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
        Сценарий соло
      </div>
      <div className="mb-3 grid grid-cols-4 gap-1.5">
        {SCENES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setField("scenario", id)}
            className={cn(
              "flex h-12 flex-col items-center justify-center gap-0.5 rounded-[var(--radius)] border text-xs font-medium",
              scenario === id
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-surface-2 text-muted",
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>
      <p className="mb-2 rounded border border-border/60 bg-surface-2/50 px-2 py-1.5 text-[11px] text-muted">
        {clanBaneLine(clan, preferredBlood)}
      </p>
      {!toreador && (scenario === "feed" || scenario === "social") && (
        <label className="mb-2 block text-[10px] text-muted">
          Предпочтённая кровь (Bane Вентру)
          <Input
            className="mt-0.5 h-8"
            value={preferredBlood}
            placeholder="напр. знать, солдаты, политики…"
            onChange={(e) => setField("preferredBlood", e.target.value)}
          />
        </label>
      )}
      {hunger && (
        <p className="mb-2 rounded border border-primary/30 bg-primary/10 px-2 py-1 text-[11px] text-primary">
          Голод: помеха на проверки характеристик (вкл. соц.)
        </p>
      )}
      <ol className="space-y-1 text-xs text-muted">
        {hints.map((h) => (
          <li key={h} className="leading-snug">
            {h}
          </li>
        ))}
      </ol>
    </div>
  );
}
