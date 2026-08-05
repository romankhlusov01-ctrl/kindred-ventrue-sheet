import { toast } from "sonner";
import { Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getLevelData } from "@/data/kindred-ru";
import { useCharacterStore } from "@/lib/character-store";
import { abilityMod, rollDie } from "@/lib/utils";
import { useSessionStore } from "@/lib/session-store";
import { PREFERRED_BLOOD_PRESETS } from "@/data/builder-ru";

/** Feed yourself — Bane half dice when not preferred blood */
export function FeedWizard() {
  const c = useCharacterStore((s) => s.character);
  const gainBlood = useCharacterStore((s) => s.gainBlood);
  const setField = useCharacterStore((s) => s.setField);
  const addLog = useCharacterStore((s) => s.addLog);
  const setLastRoll = useSessionStore((s) => s.setLastRoll);
  const pushUndo = useSessionStore((s) => s.pushUndo);
  const row = getLevelData(c.level);
  const preferred = (c.preferredBlood || "").trim();

  function feed(half: boolean) {
    const full = row.feedCount;
    const count = half ? Math.max(1, Math.floor(full / 2)) : full;
    const rolls = Array.from({ length: count }, () => rollDie(6));
    const sixes = rolls.filter((x) => x === 6).length;
    const con = Math.max(1, abilityMod(c.abilities.con));
    const sum = rolls.reduce((a, b) => a + b, 0) + con;
    if (sixes) {
      pushUndo("Питание ОБК");
      gainBlood(sixes);
    }
    const label = half ? "Питание (½ Bane)" : "Питание";
    setLastRoll({ label, total: sum, detail: `${rolls.join("+")}+Тел`, at: Date.now() });
    addLog(`${label}: ${sum} [${rolls.join("+")}] · +${sixes} ОБК`);
    toast.success(`${label}: ${sum}${sixes ? ` · +${sixes} ОБК` : ""}`);
  }

  const presets = PREFERRED_BLOOD_PRESETS ?? [
    "аристократы",
    "вино / пьяные",
    "художники",
    "политики",
    "девы",
  ];

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
      <h3 className="mb-1 flex items-center gap-2 font-display text-sm">
        <Droplets className="size-3.5 text-primary" /> Питание
      </h3>
      <p className="mb-2 text-[11px] text-muted">
        {row.feed} · с 5 ур. как БД
        {preferred ? ` · Bane: ${preferred}` : " · укажите предпочтённую кровь"}
      </p>
      <Input
        className="mb-2 h-11"
        placeholder="Предпочтённая кровь (Bane)"
        value={c.preferredBlood}
        onChange={(e) => setField("preferredBlood", e.target.value)}
      />
      <div className="mb-2 flex flex-wrap gap-1">
        {(Array.isArray(presets) ? presets : []).slice(0, 6).map((p) => (
          <Button
            key={String(p)}
            type="button"
            size="sm"
            variant="outline"
            className="h-9 text-[10px]"
            onClick={() => setField("preferredBlood", String(p))}
          >
            {String(p)}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="blood" className="h-14" onClick={() => feed(false)}>
          Полное
        </Button>
        <Button type="button" variant="secondary" className="h-14" onClick={() => feed(true)}>
          ½ Bane
        </Button>
      </div>
    </div>
  );
}
