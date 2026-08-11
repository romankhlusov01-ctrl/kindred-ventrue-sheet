import { useState } from "react";
import { toast } from "sonner";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getLevelData, KINDRED_TABLE, KINDRED_FEATS } from "@/data/kindred-ru";
import { ASI_LEVELS, calcKindredHp, kindredFeatSlots } from "@/data/builder-ru";
import { VENTRUE_MILESTONES } from "@/data/ventrue-milestones";
import { TOREADOR_MILESTONES } from "@/data/toreador-milestones";
import { GENERAL_FEAT_CATALOG, generalFeatsForLevel } from "@/data/phb-feats-ru";
import { FEAT_RECS } from "@/data/feat-recommendations";
import { useCharacterStore } from "@/lib/character-store";
import type { Abilities } from "@/lib/character-store";
import { applyAbilityDelta, bonusForFeat } from "@/lib/feat-ability";

const ABIL: { key: keyof Abilities; short: string }[] = [
  { key: "str", short: "СИЛ" },
  { key: "dex", short: "ЛОВ" },
  { key: "con", short: "ТЕЛ" },
  { key: "int", short: "ИНТ" },
  { key: "wis", short: "МУД" },
  { key: "cha", short: "ХАР" },
];

type Asimod = "asi" | "general" | "kindred";

/** Level up: ASI / PHB feat / Kindred Feat on 4·8·12·16; kindred slot on 2·7·10·13·17 */
export function LevelUpHelper() {
  const c = useCharacterStore((s) => s.character);
  const patch = useCharacterStore((s) => s.patch);
  const addLog = useCharacterStore((s) => s.addLog);

  const [mode, setMode] = useState<Asimod>("asi");
  const [asiA, setAsiA] = useState<keyof Abilities>("cha");
  const [asiB, setAsiB] = useState<keyof Abilities | "">("");
  const [pickedFeat, setPickedFeat] = useState<string | null>(null);

  if (c.level >= 20) return null;

  const next = c.level + 1;
  const row = getLevelData(next);
  const prevK = kindredFeatSlots(c.level);
  const nextK = kindredFeatSlots(next);
  const newClassKindred = nextK > prevK;
  const features = KINDRED_TABLE[next - 1]?.features ?? "";
  const newAsi = (ASI_LEVELS as readonly number[]).includes(next);

  const milestones =
    c.clan === "toreador" ? TOREADOR_MILESTONES : VENTRUE_MILESTONES;
  const milestone = milestones.find((m) => m.level === next);
  const phbFeats = generalFeatsForLevel(next).filter((f) => f.id !== "asi");
  const kindredOpts = KINDRED_FEATS.filter(
    (f) => f.levelMin <= next && !c.selectedFeats.includes(f.id),
  );

  function applyLevel() {
    let hp = calcKindredHp(
      next,
      c.abilities.con,
      c.clan === "ventrue" && next >= 6,
    );
    // Tough origin / general: +2 HP per level (match applyToSheet)
    if (
      c.originFeatId === "tough" ||
      c.backgroundFeatId === "tough" ||
      (c.generalFeats ?? []).includes("tough-general")
    ) {
      hp += next * 2;
    }
    // Live Fast L9: if leveling into 9+ as Toreador and Dex not yet bumped — leave to builder notes
    const gain = Math.max(1, hp - c.hpMax);
    const resources = c.customResources.map((r) => {
      if (/голос|присутств|forceful|aura/i.test(r.name)) {
        return { ...r, max: row.pb, current: Math.min(r.current + 1, row.pb) };
      }
      return r;
    });

    const base = {
      level: next,
      hpMax: hp,
      hpCurrent: c.hpCurrent + gain,
      bloodCurrent: Math.min(
        // table BP; vitae feats applied via getBloodMax if imported — keep row.bp+feats soft
        row.bp +
          (c.selectedFeats.includes("vitae-conc")
            ? Math.max(1, Math.floor((c.abilities.con - 10) / 2))
            : 0) +
          (c.selectedFeats.includes("boon-gen") ? 5 : 0),
        c.bloodCurrent + 1,
      ),
      customResources: resources,
    };

    if (newAsi) {
      if (mode === "asi") {
        const scores = { ...c.abilities };
        if (asiB && asiB !== asiA) {
          scores[asiA] = Math.min(20, scores[asiA] + 1);
          scores[asiB] = Math.min(20, scores[asiB] + 1);
        } else {
          scores[asiA] = Math.min(20, scores[asiA] + 2);
        }
        patch({ ...base, abilities: scores });
        addLog(
          `Ур.${next}: ASI ${asiB && asiB !== asiA ? `+1 ${asiA}/+1 ${asiB}` : `+2 ${asiA}`}, +${gain} ХП`,
        );
        toast.success(`Ур.${next} · ASI`);
      } else if (mode === "general") {
        if (!pickedFeat) {
          toast.error("Выберите PHB-черту или другой вариант");
          return;
        }
        const feats = c.generalFeats?.includes(pickedFeat)
          ? c.generalFeats
          : [...(c.generalFeats ?? []), pickedFeat];
        const fname =
          GENERAL_FEAT_CATALOG.find((f) => f.id === pickedFeat)?.name ?? pickedFeat;
        const abilities = applyAbilityDelta(
          c.abilities,
          bonusForFeat(pickedFeat),
          1,
        );
        // HP may change if CON rose
        let hp2 = calcKindredHp(
          next,
          abilities.con,
          c.clan === "ventrue" && next >= 6,
        );
        if (
          c.originFeatId === "tough" ||
          c.backgroundFeatId === "tough" ||
          feats.includes("tough-general")
        ) {
          hp2 += next * 2;
        }
        const gain2 = Math.max(1, hp2 - c.hpMax);
        patch({
          ...base,
          generalFeats: feats,
          abilities,
          featScoreSync: 1,
          hpMax: hp2,
          hpCurrent: c.hpCurrent + gain2,
        });
        const abLab = bonusForFeat(pickedFeat);
        const abNote = Object.keys(abLab).length
          ? ` · ${Object.entries(abLab)
              .map(([k, n]) => `${k}+${n}`)
              .join(" ")}`
          : "";
        addLog(`Ур.${next}: PHB «${fname}»${abNote}, +${gain2} ХП`);
        toast.success(`Ур.${next} · ${fname}${abNote}`);
      } else {
        if (!pickedFeat) {
          toast.error("Выберите Kindred Feat");
          return;
        }
        const feats = c.selectedFeats.includes(pickedFeat)
          ? c.selectedFeats
          : [...c.selectedFeats, pickedFeat];
        const fname = KINDRED_FEATS.find((f) => f.id === pickedFeat)?.name ?? pickedFeat;
        const abilities = applyAbilityDelta(
          c.abilities,
          bonusForFeat(pickedFeat),
          1,
        );
        let hp2 = calcKindredHp(
          next,
          abilities.con,
          c.clan === "ventrue" && next >= 6,
        );
        if (
          c.originFeatId === "tough" ||
          c.backgroundFeatId === "tough" ||
          (c.generalFeats ?? []).includes("tough-general")
        ) {
          hp2 += next * 2;
        }
        const gain2 = Math.max(1, hp2 - c.hpMax);
        const bloodMax =
          row.bp +
          (feats.includes("vitae-conc")
            ? Math.max(1, Math.floor((abilities.con - 10) / 2))
            : 0) +
          (feats.includes("boon-gen") ? 5 : 0);
        patch({
          ...base,
          selectedFeats: feats,
          abilities,
          featScoreSync: 1,
          hpMax: hp2,
          hpCurrent: c.hpCurrent + gain2,
          bloodCurrent: Math.min(bloodMax, c.bloodCurrent + 1),
        });
        const abLab = bonusForFeat(pickedFeat);
        const abNote = Object.keys(abLab).length
          ? ` · ${Object.entries(abLab)
              .map(([k, n]) => `${k}+${n}`)
              .join(" ")}`
          : "";
        addLog(`Ур.${next}: Kindred «${fname}»${abNote}, +${gain2} ХП`);
        toast.success(`Ур.${next} · Kindred ${fname}${abNote}`);
      }
    } else if (newClassKindred) {
      // auto open kindred pick optional: just level + toast reminder
      patch(base);
      addLog(`Ур.${next}: +${gain} ХП · +слот черты сородича (класс)`);
      toast.success(`Ур.${next} · возьмите Kindred Feat в билдере/листе`);
    } else {
      patch(base);
      addLog(`Ур.${next}: +${gain} ХП, ОБК ${row.bp}`);
      toast.success(`Уровень ${next}`);
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
        {newClassKindred ? " · +слот Kindred (класс)" : ""}
        {newAsi ? " · ASI / PHB / сородич" : ""}.
        {milestone ? ` · ${milestone.title}` : ""}
      </p>

      {newAsi && (
        <div className="mb-3 space-y-2">
          <p className="text-[11px] font-medium text-fg">
            Ур.{next}: выберите одно из трёх (RAW)
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                ["asi", "ASI", "+2 / +1+1"],
                ["general", "PHB", "черта"],
                ["kindred", "Kindred", "сородич"],
              ] as const
            ).map(([id, title, sub]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setMode(id);
                  setPickedFeat(null);
                }}
                className={cn(
                  "flex h-14 flex-col items-center justify-center rounded-[var(--radius)] border px-1 text-[11px] font-semibold",
                  mode === id
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-surface text-muted",
                )}
              >
                {title}
                <span className="text-[9px] font-normal opacity-80">{sub}</span>
              </button>
            ))}
          </div>

          {mode === "asi" && (
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
                  <option value="">— только +2 —</option>
                  {ABIL.filter((a) => a.key !== asiA).map((a) => (
                    <option key={a.key} value={a.key}>
                      {a.short} ({c.abilities[a.key]})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {mode === "general" && (
            <div className="max-h-48 space-y-1 overflow-y-auto rounded border border-border bg-surface p-2">
              {phbFeats.slice(0, 18).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setPickedFeat(f.id)}
                  className={cn(
                    "w-full rounded border px-2 py-2 text-left text-xs",
                    pickedFeat === f.id
                      ? "border-accent bg-accent/15"
                      : "border-border bg-surface-2",
                  )}
                >
                  <span className="font-medium">{f.name}</span>
                  {FEAT_RECS[f.id] && (
                    <span className="mt-0.5 block text-[10px] text-accent">
                      ★ {FEAT_RECS[f.id]!.note}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {mode === "kindred" && (
            <div className="max-h-48 space-y-1 overflow-y-auto rounded border border-border bg-surface p-2">
              {kindredOpts.slice(0, 20).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setPickedFeat(f.id)}
                  className={cn(
                    "w-full rounded border px-2 py-2 text-left text-xs",
                    pickedFeat === f.id
                      ? "border-primary bg-primary/15"
                      : "border-border bg-surface-2",
                  )}
                >
                  <span className="font-medium">{f.name}</span>
                  <span className="mt-0.5 block text-[10px] text-faint">
                    ур.{f.levelMin}+
                  </span>
                </button>
              ))}
              {kindredOpts.length === 0 && (
                <p className="text-[11px] text-muted">Нет доступных / уже взяты</p>
              )}
            </div>
          )}
        </div>
      )}

      <Button type="button" variant="secondary" className="h-12 w-full" onClick={applyLevel}>
        Повысить до {next}
        {newAsi
          ? mode === "asi"
            ? " · ASI"
            : mode === "general"
              ? " · PHB"
              : " · Kindred"
          : newClassKindred
            ? " · +Kindred-слот"
            : ""}
      </Button>
    </div>
  );
}
