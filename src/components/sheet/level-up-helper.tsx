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
import type { ProfLevel, SkillId } from "@/data/skills";
import { SKILLS } from "@/data/skills";
import { applyAbilityDelta, bonusForFeat } from "@/lib/feat-ability";
import { FEATURES } from "@/data/terms-ru";

const ABIL: { key: keyof Abilities; short: string }[] = [
  { key: "str", short: "СИЛ" },
  { key: "dex", short: "ЛОВ" },
  { key: "con", short: "ТЕЛ" },
  { key: "int", short: "ИНТ" },
  { key: "wis", short: "МУД" },
  { key: "cha", short: "ХАР" },
];

const MAGNUM_OPTS = [
  { id: "magnum-flicker", name: "Flicker", ru: "Мерцание" },
  { id: "magnum-clairvoyance", name: "Clairvoyance", ru: "Ясновидение" },
  { id: "magnum-open-mind", name: "Open Mind", ru: "Открытый разум" },
  { id: "magnum-star", name: "Star Magnetism", ru: "Звёздный магнетизм" },
] as const;

type Asimod = "asi" | "general" | "kindred";

function grantSkill(
  profs: Partial<Record<SkillId, ProfLevel>>,
  id: SkillId,
): Partial<Record<SkillId, ProfLevel>> {
  const cur = profs[id];
  if (cur === "expertise") return profs;
  if (cur === "proficient") return { ...profs, [id]: "expertise" };
  return { ...profs, [id]: "proficient" };
}

/** Level up: ASI / PHB / Kindred · Artist · Visionary · Magnum · Live Fast */
export function LevelUpHelper() {
  const c = useCharacterStore((s) => s.character);
  const patch = useCharacterStore((s) => s.patch);
  const addLog = useCharacterStore((s) => s.addLog);

  const [mode, setMode] = useState<Asimod>("asi");
  const [asiA, setAsiA] = useState<keyof Abilities>("cha");
  const [asiB, setAsiB] = useState<keyof Abilities | "">("");
  const [pickedFeat, setPickedFeat] = useState<string | null>(null);
  const [artistPicks, setArtistPicks] = useState<SkillId[]>([]);
  const [visionPicks, setVisionPicks] = useState<SkillId[]>([]);
  const [magnumPicks, setMagnumPicks] = useState<string[]>([]);

  if (c.level >= 20) return null;

  const next = c.level + 1;
  const row = getLevelData(next);
  const prevK = kindredFeatSlots(c.level);
  const nextK = kindredFeatSlots(next);
  const newClassKindred = nextK > prevK;
  const features = KINDRED_TABLE[next - 1]?.features ?? "";
  const newAsi = (ASI_LEVELS as readonly number[]).includes(next);
  const needArtist =
    c.clan === "toreador" && c.level < 3 && next >= 3;
  const needVisionary =
    c.clan === "toreador" && c.level < 11 && next >= 11;
  const needMagnum =
    c.clan === "toreador" && c.level < 18 && next >= 18;
  const needKindredPick = newClassKindred && !newAsi;

  const milestones =
    c.clan === "toreador" ? TOREADOR_MILESTONES : VENTRUE_MILESTONES;
  const milestone = milestones.find((m) => m.level === next);
  const phbFeats = generalFeatsForLevel(next).filter((f) => f.id !== "asi");
  const kindredOpts = KINDRED_FEATS.filter(
    (f) =>
      f.levelMin <= next &&
      !c.selectedFeats.includes(f.id) &&
      (f.clans?.includes(c.clan as "ventrue" | "toreador") ||
        f.clans?.includes("any") ||
        !f.clans),
  );

  function toggleArtist(id: SkillId) {
    setArtistPicks((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  }

  function toggleVision(id: SkillId) {
    setVisionPicks((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  function toggleMagnum(id: string) {
    setMagnumPicks((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  }

  function applyLevel() {
    if (needArtist && artistPicks.length !== 2) {
      toast.error("Душа художника: выберите 2 навыка");
      return;
    }
    if (needVisionary && visionPicks.length !== 3) {
      toast.error("Провидец: выберите 3 навыка с владением → экспертиза");
      return;
    }
    if (needMagnum && magnumPicks.length !== 2) {
      toast.error("Magnum Opus: выберите 2 опции");
      return;
    }
    if (needKindredPick && !pickedFeat) {
      toast.error("Возьмите черту сородича (слот класса)");
      return;
    }

    let abilities = { ...c.abilities };
    if (c.clan === "toreador" && c.level < 9 && next >= 9) {
      abilities.dex = Math.min(25, abilities.dex + 2);
    }

    let skillProfs = { ...c.skillProfs };
    if (needArtist) {
      for (const id of artistPicks) skillProfs = grantSkill(skillProfs, id);
    }
    if (needVisionary) {
      for (const id of visionPicks) {
        if (skillProfs[id] === "proficient" || skillProfs[id] === "expertise") {
          skillProfs = { ...skillProfs, [id]: "expertise" };
        }
      }
    }

    let selectedFeats = [...c.selectedFeats];
    if (needMagnum) {
      for (const id of magnumPicks) {
        if (!selectedFeats.includes(id)) selectedFeats.push(id);
      }
    }

    let hp = calcKindredHp(
      next,
      abilities.con,
      c.clan === "ventrue" && next >= 6,
    );
    if (
      c.originFeatId === "tough" ||
      c.backgroundFeatId === "tough" ||
      (c.generalFeats ?? []).includes("tough-general")
    ) {
      hp += next * 2;
    }
    const gain = Math.max(1, hp - c.hpMax);
    const resources = c.customResources.map((r) => {
      if (/голос|присутств|forceful|aura|провор|alacrity/i.test(r.name + r.note)) {
        return { ...r, max: row.pb, current: Math.min(r.current + 1, row.pb) };
      }
      return r;
    });
    // Ensure Alacrity resource if feat present
    let customResources = resources;
    if (
      selectedFeats.includes("alacrity") &&
      !customResources.some((r) => /провор|alacrity/i.test(r.name))
    ) {
      customResources = [
        ...customResources,
        {
          id: `cr-alacrity-${Date.now()}`,
          name: "Проворство",
          current: row.pb,
          max: row.pb,
          note: "Alacrity · БМ / LR",
        },
      ];
    }

    const base = {
      level: next,
      abilities,
      skillProfs,
      selectedFeats,
      hpMax: hp,
      hpCurrent: c.hpCurrent + gain,
      bloodCurrent: Math.min(
        row.bp +
          (selectedFeats.includes("vitae-conc")
            ? Math.max(1, Math.floor((abilities.con - 10) / 2))
            : 0) +
          (selectedFeats.includes("boon-gen") ? 5 : 0),
        c.bloodCurrent + 1,
      ),
      customResources,
    };

    const extraNotes: string[] = [];
    if (needArtist) {
      extraNotes.push(
        `${FEATURES.artistSoul}: ${artistPicks
          .map((id) => SKILLS.find((s) => s.id === id)?.nameRu ?? id)
          .join(", ")}`,
      );
    }
    if (c.clan === "toreador" && c.level < 9 && next >= 9) {
      extraNotes.push(`${FEATURES.liveFast}: Лов +2 → ${abilities.dex}`);
    }
    if (needVisionary) {
      extraNotes.push(
        `${FEATURES.visionary}: экспертиза ${visionPicks
          .map((id) => SKILLS.find((s) => s.id === id)?.nameRu ?? id)
          .join(", ")}`,
      );
    }
    if (needMagnum) {
      extraNotes.push(
        `${FEATURES.magnum}: ${magnumPicks
          .map((id) => MAGNUM_OPTS.find((m) => m.id === id)?.ru ?? id)
          .join(" + ")}`,
      );
    }

    if (newAsi) {
      if (mode === "asi") {
        const scores = { ...abilities };
        if (asiB && asiB !== asiA) {
          scores[asiA] = Math.min(20, scores[asiA] + 1);
          scores[asiB] = Math.min(20, scores[asiB] + 1);
        } else {
          scores[asiA] = Math.min(20, scores[asiA] + 2);
        }
        patch({ ...base, abilities: scores });
        addLog(
          `Ур.${next}: ASI ${asiB && asiB !== asiA ? `+1 ${asiA}/+1 ${asiB}` : `+2 ${asiA}`}, +${gain} ХП` +
            (extraNotes.length ? ` · ${extraNotes.join(" · ")}` : ""),
        );
        toast.success(`Ур.${next} · ASI`);
      } else if (mode === "general") {
        if (!pickedFeat) {
          toast.error("Выберите PHB-черту");
          return;
        }
        const feats = c.generalFeats?.includes(pickedFeat)
          ? c.generalFeats
          : [...(c.generalFeats ?? []), pickedFeat];
        const fname =
          GENERAL_FEAT_CATALOG.find((f) => f.id === pickedFeat)?.name ?? pickedFeat;
        const nextAbilities = applyAbilityDelta(
          abilities,
          bonusForFeat(pickedFeat),
          1,
        );
        let hp2 = calcKindredHp(
          next,
          nextAbilities.con,
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
          abilities: nextAbilities,
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
        addLog(
          `Ур.${next}: PHB «${fname}»${abNote}, +${gain2} ХП` +
            (extraNotes.length ? ` · ${extraNotes.join(" · ")}` : ""),
        );
        toast.success(`Ур.${next} · ${fname}`);
      } else {
        if (!pickedFeat) {
          toast.error("Выберите черту сородича");
          return;
        }
        const feats = selectedFeats.includes(pickedFeat)
          ? selectedFeats
          : [...selectedFeats, pickedFeat];
        const fname =
          KINDRED_FEATS.find((f) => f.id === pickedFeat)?.name ?? pickedFeat;
        const nextAbilities = applyAbilityDelta(
          abilities,
          bonusForFeat(pickedFeat),
          1,
        );
        let hp2 = calcKindredHp(
          next,
          nextAbilities.con,
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
            ? Math.max(1, Math.floor((nextAbilities.con - 10) / 2))
            : 0) +
          (feats.includes("boon-gen") ? 5 : 0);
        patch({
          ...base,
          selectedFeats: feats,
          abilities: nextAbilities,
          featScoreSync: 1,
          hpMax: hp2,
          hpCurrent: c.hpCurrent + gain2,
          bloodCurrent: Math.min(bloodMax, c.bloodCurrent + 1),
        });
        addLog(
          `Ур.${next}: ${FEATURES.kindredFeat} «${fname}», +${gain2} ХП` +
            (extraNotes.length ? ` · ${extraNotes.join(" · ")}` : ""),
        );
        toast.success(`Ур.${next} · ${fname}`);
      }
    } else if (needKindredPick && pickedFeat) {
      const feats = selectedFeats.includes(pickedFeat)
        ? selectedFeats
        : [...selectedFeats, pickedFeat];
      const fname =
        KINDRED_FEATS.find((f) => f.id === pickedFeat)?.name ?? pickedFeat;
      const nextAbilities = applyAbilityDelta(
        abilities,
        bonusForFeat(pickedFeat),
        1,
      );
      let hp2 = calcKindredHp(
        next,
        nextAbilities.con,
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
      patch({
        ...base,
        selectedFeats: feats,
        abilities: nextAbilities,
        featScoreSync: 1,
        hpMax: hp2,
        hpCurrent: c.hpCurrent + gain2,
      });
      addLog(
        `Ур.${next}: ${FEATURES.kindredFeat} «${fname}», +${gain2} ХП` +
          (extraNotes.length ? ` · ${extraNotes.join(" · ")}` : ""),
      );
      toast.success(`Ур.${next} · ${fname}`);
    } else {
      patch(base);
      addLog(
        `Ур.${next}: +${gain} ХП, ОБК ${row.bp}` +
          (extraNotes.length ? ` · ${extraNotes.join(" · ")}` : ""),
      );
      toast.success(`Уровень ${next}`);
    }
    setPickedFeat(null);
    setArtistPicks([]);
    setVisionPicks([]);
    setMagnumPicks([]);
  }

  const proficientSkills = SKILLS.filter(
    (s) =>
      c.skillProfs[s.id] === "proficient" ||
      c.skillProfs[s.id] === "expertise",
  );

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
        {newClassKindred ? ` · +слот ${FEATURES.kindredFeat}` : ""}
        {newAsi ? ` · ${FEATURES.asi} / PHB / сородич` : ""}.
        {milestone ? ` · ${milestone.title}` : ""}
      </p>

      {needArtist && (
        <div className="mb-3 space-y-2 rounded border border-accent/40 bg-surface p-2">
          <p className="text-[11px] font-medium text-fg">
            {FEATURES.artistSoul}: 2 навыка ({artistPicks.length}/2)
          </p>
          <p className="text-[10px] text-muted">
            Уже владеете → экспертиза. Плюс преимущество на Анализ/Внимательность, ТЗ 120.
          </p>
          <div className="grid max-h-40 grid-cols-2 gap-1 overflow-y-auto">
            {SKILLS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleArtist(s.id)}
                className={cn(
                  "rounded border px-2 py-1.5 text-left text-[11px]",
                  artistPicks.includes(s.id)
                    ? "border-accent bg-accent/15"
                    : "border-border bg-surface-2",
                )}
              >
                {s.nameRu}
                {c.skillProfs[s.id] === "proficient" && (
                  <span className="text-faint"> · →★</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {needVisionary && (
        <div className="mb-3 space-y-2 rounded border border-accent/40 bg-surface p-2">
          <p className="text-[11px] font-medium text-fg">
            {FEATURES.visionary}: 3 экспертизы ({visionPicks.length}/3)
          </p>
          <div className="grid max-h-36 grid-cols-2 gap-1 overflow-y-auto">
            {proficientSkills.map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={c.skillProfs[s.id] === "expertise" && !visionPicks.includes(s.id)}
                onClick={() => toggleVision(s.id)}
                className={cn(
                  "rounded border px-2 py-1.5 text-left text-[11px]",
                  visionPicks.includes(s.id)
                    ? "border-accent bg-accent/15"
                    : "border-border bg-surface-2",
                )}
              >
                {s.nameRu}
              </button>
            ))}
          </div>
          {proficientSkills.length < 3 && (
            <p className="text-[10px] text-accent">
              Нужно ≥3 навыков с владением. Возьмите навыки раньше (Artist / билдер).
            </p>
          )}
        </div>
      )}

      {needMagnum && (
        <div className="mb-3 space-y-2 rounded border border-accent/40 bg-surface p-2">
          <p className="text-[11px] font-medium text-fg">
            {FEATURES.magnum}: 2 выбора ({magnumPicks.length}/2)
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {MAGNUM_OPTS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleMagnum(m.id)}
                className={cn(
                  "rounded border px-2 py-2 text-left text-[11px]",
                  magnumPicks.includes(m.id)
                    ? "border-primary bg-primary/15"
                    : "border-border bg-surface-2",
                )}
              >
                <span className="font-medium">{m.ru}</span>
                <span className="mt-0.5 block text-[9px] text-faint">{m.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {(newAsi || needKindredPick) && (
        <div className="mb-3 space-y-2">
          {newAsi && (
            <>
              <p className="text-[11px] font-medium text-fg">
                Ур.{next}: выберите одно (RAW)
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    ["asi", "ASI", "+2 / +1+1"],
                    ["general", "PHB", "черта"],
                    ["kindred", "Сородич", "Kindred"],
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
            </>
          )}

          {needKindredPick && (
            <p className="text-[11px] font-medium text-fg">
              Слот {FEATURES.kindredFeat} (класс) — выберите черту
            </p>
          )}

          {((newAsi && mode === "asi") || false) && (
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

          {newAsi && mode === "general" && (
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

          {((newAsi && mode === "kindred") || needKindredPick) && (
            <div className="max-h-48 space-y-1 overflow-y-auto rounded border border-border bg-surface p-2">
              {kindredOpts.slice(0, 24).map((f) => (
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
              : " · Сородич"
          : needKindredPick
            ? " · черта"
            : needArtist
              ? " · Душа художника"
              : needMagnum
                ? " · Magnum"
                : ""}
      </Button>
    </div>
  );
}
