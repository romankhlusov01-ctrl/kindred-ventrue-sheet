import { useState } from "react";
import { toast } from "sonner";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getLevelData, KINDRED_TABLE } from "@/data/kindred-ru";
import { ASI_LEVELS, calcKindredHp, kindredFeatSlots } from "@/data/builder-ru";
import { VENTRUE_MILESTONES } from "@/data/ventrue-milestones";
import { TOREADOR_MILESTONES } from "@/data/toreador-milestones";
import { GENERAL_FEAT_CATALOG, generalFeatsForLevel } from "@/data/phb-feats-ru";
import { FEAT_RECS } from "@/data/feat-recommendations";
import { useCharacterStore } from "@/lib/character-store";
import type { Abilities } from "@/lib/character-store";

const ABIL: { key: keyof Abilities; short: string }[] = [
  { key: "str", short: "СИЛ" },
  { key: "dex", short: "ЛОВ" },
  { key: "con", short: "ТЕЛ" },
  { key: "int", short: "ИНТ" },
  { key: "wis", short: "МУД" },
  { key: "cha", short: "ХАР" },
];

/** Level up with ASI **or** general feat choice on 4/8/12/16/19 */
export function LevelUpHelper() {
  const c = useCharacterStore((s) => s.character);
  const patch = useCharacterStore((s) => s.patch);
  const addLog = useCharacterStore((s) => s.addLog);

  const [asiOrFeat, setAsiOrFeat] = useState<"asi" | "feat">("asi");
  const [asiA, setAsiA] = useState<keyof Abilities>("cha");
  const [asiB, setAsiB] = useState<keyof Abilities | "">("");
  const [pickedFeat, setPickedFeat] = useState<string | null>(null);

  if (c.level >= 20) return null;

  const next = c.level + 1;
  const row = getLevelData(next);
  const prevSlots = kindredFeatSlots(c.level);
  const nextSlots = kindredFeatSlots(next);
  const newKindredFeat = nextSlots > prevSlots;
  const features = KINDRED_TABLE[next - 1]?.features ?? "";
  const newAsi = (ASI_LEVELS as readonly number[]).includes(next);
  const milestones =
    c.clan === "toreador" ? TOREADOR_MILESTONES : VENTRUE_MILESTONES;
  const milestone = milestones.find((m) => m.level === next);
  const phbFeats = generalFeatsForLevel(next).filter((f) => f.id !== "asi");

  function applyLevel() {
    const hp = calcKindredHp(
      next,
      c.abilities.con,
      c.clan !== "toreador" && next >= 6,
    );
    const gain = Math.max(1, hp - c.hpMax);
    const resources = c.customResources.map((r) => {
      if (/голос|присутств|forceful|aura/i.test(r.name)) {
        return { ...r, max: row.pb, current: Math.min(r.current + 1, row.pb) };
      }
      return r;
    });

    if (newAsi) {
      if (asiOrFeat === "asi") {
        const scores = { ...c.abilities };
        if (asiB && asiB !== asiA) {
          scores[asiA] = Math.min(20, scores[asiA] + 1);
          scores[asiB] = Math.min(20, scores[asiB] + 1);
        } else {
          scores[asiA] = Math.min(20, scores[asiA] + 2);
        }
        patch({
          level: next,
          hpMax: hp,
          hpCurrent: c.hpCurrent + gain,
          bloodCurrent: Math.min(row.bp, c.bloodCurrent + 1),
          customResources: resources,
          abilities: scores,
        });
        addLog(
          `Уровень ${next}: ASI ${asiB && asiB !== asiA ? `+1 ${asiA}/+1 ${asiB}` : `+2 ${asiA}`}, +${gain} ХП`,
        );
        toast.success(`Ур.${next} · ASI`);
      } else {
        if (!pickedFeat) {
          toast.error("Выберите черту PHB или переключитесь на ASI");
          return;
        }
        const feats = c.generalFeats?.includes(pickedFeat)
          ? c.generalFeats
          : [...(c.generalFeats ?? []), pickedFeat];
        const fname =
          GENERAL_FEAT_CATALOG.find((f) => f.id === pickedFeat)?.name ?? pickedFeat;
        patch({
          level: next,
          hpMax: hp,
          hpCurrent: c.hpCurrent + gain,
          bloodCurrent: Math.min(row.bp, c.bloodCurrent + 1),
          customResources: resources,
          generalFeats: feats,
        });
        addLog(`Уровень ${next}: черта PHB «${fname}», +${gain} ХП`);
        toast.success(`Ур.${next} · черта ${fname}`);
      }
    } else {
      patch({
        level: next,
        hpMax: hp,
        hpCurrent: c.hpCurrent + gain,
        bloodCurrent: Math.min(row.bp, c.bloodCurrent + 1),
        customResources: resources,
      });
      addLog(
        `Уровень ${next}: +${gain} макс. ХП, ОБК макс ${row.bp}${
          newKindredFeat ? " · +слот черты сородича" : ""
        }`,
      );
      toast.success(
        `Уровень ${next}${newKindredFeat ? " — черта сородича" : ""}`,
      );
    }
    setPickedFeat(null);
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-accent/30 bg-accent/5 p-3">
      <h3 className="mb-1 flex items-center gap-2 font-display text-sm">
        <TrendingUp className="size-4 text-accent" /> Повышение уровня
      </h3>
      <p className="mb-3 text-xs leading-relaxed text-muted">
        <strong className="text-fg">
          {c.level} → {next}
        </strong>
        : {features}. ОБК {row.bp}, питание {row.feed}, БМ +{row.pb}
        {newKindredFeat ? " · +слот черты сородича" : ""}
        {newAsi ? " · ASI или черта PHB" : ""}.
        {milestone ? ` · ${milestone.title}` : ""}
      </p>

      {newAsi && (
        <div className="mb-3 space-y-2">
          <p className="text-[11px] font-medium text-fg">
            Ур.{next}: выберите <strong>ASI</strong> или <strong>черту</strong>
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setAsiOrFeat("asi")}
              className={cn(
                "flex h-12 flex-col items-center justify-center rounded-[var(--radius)] border text-xs font-semibold",
                asiOrFeat === "asi"
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-surface text-muted",
              )}
            >
              ASI
              <span className="text-[10px] font-normal opacity-80">+2 / +1+1</span>
            </button>
            <button
              type="button"
              onClick={() => setAsiOrFeat("feat")}
              className={cn(
                "flex h-12 flex-col items-center justify-center rounded-[var(--radius)] border text-xs font-semibold",
                asiOrFeat === "feat"
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-border bg-surface text-muted",
              )}
            >
              Черта
              <span className="text-[10px] font-normal opacity-80">PHB · dnd.su</span>
            </button>
          </div>

          {asiOrFeat === "asi" && (
            <div className="space-y-2 rounded border border-border bg-surface p-2">
              <label className="flex items-center gap-2 text-xs">
                {asiB ? "+1" : "+2"}
                <select
                  className="h-9 flex-1 rounded border border-border bg-bg px-2"
                  value={asiA}
                  onChange={(e) => setAsiA(e.target.value as keyof Abilities)}
                >
                  {ABIL.map((a) => (
                    <option key={a.key} value={a.key}>
                      {a.short} ({c.abilities[a.key]})
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-xs">
                +1 (опц.)
                <select
                  className="h-9 flex-1 rounded border border-border bg-bg px-2"
                  value={asiB}
                  onChange={(e) =>
                    setAsiB((e.target.value || "") as keyof Abilities | "")
                  }
                >
                  <option value="">— только +2 к первой —</option>
                  {ABIL.filter((a) => a.key !== asiA).map((a) => (
                    <option key={a.key} value={a.key}>
                      {a.short} ({c.abilities[a.key]})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {asiOrFeat === "feat" && (
            <div className="max-h-48 space-y-1 overflow-y-auto rounded border border-border bg-surface p-2">
              {phbFeats.slice(0, 16).map((f) => {
                const on = pickedFeat === f.id;
                const rec = FEAT_RECS[f.id];
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setPickedFeat(f.id)}
                    className={cn(
                      "w-full rounded border px-2 py-2 text-left text-xs",
                      on
                        ? "border-accent bg-accent/15"
                        : "border-border bg-surface-2",
                    )}
                  >
                    <span className="font-medium">{f.name}</span>
                    {rec && (
                      <span className="mt-0.5 block text-[10px] text-accent">
                        ★ {rec.note}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <Button
        type="button"
        variant="secondary"
        className="h-12 w-full"
        onClick={applyLevel}
      >
        Повысить до {next}
        {newAsi ? (asiOrFeat === "asi" ? " · ASI" : " · черта") : ""}
      </Button>
    </div>
  );
}
