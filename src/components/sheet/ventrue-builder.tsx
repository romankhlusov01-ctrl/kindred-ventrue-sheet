import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
  Minus,
  Plus,
  Sparkles,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatMod } from "@/lib/utils";
import {
  ABILITY_LABELS,
  ASI_LEVELS,
  BUILDER_STEPS,
  KINDRED_CLASS_SKILLS,
  MECHANICS_GUIDE,
  POINT_BUY_BUDGET,
  POINT_BUY_COST,
  PREFERRED_BLOOD_PRESETS,
  STANDARD_ARRAY,
  abilityMod,
  asiCount,
  calcKindredHp,
  kindredFeatSlots,
  pointBuySpent,
  type BuilderStepId,
} from "@/data/builder-ru";
import {
  BACKGROUNDS_PDF,
  FIENDISH_LEGACIES,
  HUMAN_SPECIES,
  ORIGIN_FEATS,
  SPECIES,
  TIEFLING_SPECIES,
  backgroundById,
  fiendishLegacyById,
  originFeatById,
  speciesByName,
  type FiendishLegacyId,
} from "@/data/origin-ru";
import {
  KINDRED_FEATS,
  KINDRED_TABLE,
  VENTRUE_LORE,
  VENTRUE_FEATURES,
  TOREADOR_LORE,
  TOREADOR_FEATURES,
  getLevelData,
} from "@/data/kindred-ru";
import { SKILLS, type SkillId } from "@/data/skills";
import {
  useCharacterStore,
  type Abilities,
  type CharacterSheet,
} from "@/lib/character-store";
import { BUILD_PRESETS, defaultAttacks, type BuildPreset } from "@/data/builder-presets";
import { VENTRUE_MILESTONES } from "@/data/ventrue-milestones";
import { TOREADOR_MILESTONES } from "@/data/toreador-milestones";
import { FEAT_RECS } from "@/data/feat-recommendations";
import { useSessionStore } from "@/lib/session-store";

export function VentrueBuilder() {
  const character = useCharacterStore((s) => s.character);
  const patch = useCharacterStore((s) => s.patch);
  const setField = useCharacterStore((s) => s.setField);
  const setAbility = useCharacterStore((s) => s.setAbility);
  const toggleFeat = useCharacterStore((s) => s.toggleFeat);
  const addLog = useCharacterStore((s) => s.addLog);

  const [step, setStep] = useState<BuilderStepId>("concept");
  const [method, setMethod] = useState<"array" | "point" | "manual" | "roll">("array");
  const [baseScores, setBaseScores] = useState<Abilities>(() => ({
    str: 8,
    dex: 14,
    con: 15,
    int: 8,
    wis: 10,
    cha: 13,
  }));
  const [asiPlus2, setAsiPlus2] = useState<keyof Abilities>("cha");
  const [asiPlus1, setAsiPlus1] = useState<keyof Abilities>("con");
  /** Extra ASI from levels 4/8/... as freeform +2 total points applied to finals after bg */
  const [asiExtra, setAsiExtra] = useState<Partial<Record<keyof Abilities, number>>>({});
  const [classSkills, setClassSkills] = useState<SkillId[]>(["intimidation", "insight"]);
  const [openGuide, setOpenGuide] = useState<string | null>("clan");
  const [builderClan, setBuilderClan] = useState<"ventrue" | "toreador">(
    () => (character.clan === "toreador" ? "toreador" : "ventrue"),
  );
  const [arrayPool, setArrayPool] = useState<number[]>([...STANDARD_ARRAY]);
  const [pickedArray, setPickedArray] = useState<number | null>(null);
  const [rolledPool, setRolledPool] = useState<number[] | null>(null);

  const level = character.level;
  const lore = builderClan === "toreador" ? TOREADOR_LORE : VENTRUE_LORE;
  const clanFeatures = builderClan === "toreador" ? TOREADOR_FEATURES : VENTRUE_FEATURES;
  const milestones = builderClan === "toreador" ? TOREADOR_MILESTONES : VENTRUE_MILESTONES;
  const bg = backgroundById(character.backgroundId) ?? BACKGROUNDS_PDF[0]!;
  const featSlots = kindredFeatSlots(level);
  const pb = getLevelData(level).pb;
  const bgAbilityKeys = useMemo(() => parseBgAbilities(bg.abilityScores), [bg]);

  const finalScores = useMemo(() => {
    const s = { ...baseScores };
    if (asiPlus2 !== asiPlus1) {
      s[asiPlus2] = Math.min(20, s[asiPlus2] + 2);
      s[asiPlus1] = Math.min(20, s[asiPlus1] + 1);
    }
    for (const k of Object.keys(asiExtra) as (keyof Abilities)[]) {
      s[k] = Math.min(20, s[k] + (asiExtra[k] ?? 0));
    }
    return s;
  }, [baseScores, asiPlus2, asiPlus1, asiExtra]);

  const spent = pointBuySpent(Object.values(baseScores));
  const hpPreview = calcKindredHp(
    level,
    finalScores.con,
    builderClan === "ventrue" && level >= 6,
  );
  const bpPreview = getLevelData(level).bp;
  const spellDc = 8 + pb + abilityMod(finalScores.cha);
  const bgSkillIds = useMemo(() => skillsFromBg(bg.skills), [bg]);
  const humanSkill = (character.humanSkill || "deception") as SkillId;
  const stepIndex = BUILDER_STEPS.findIndex((s) => s.id === step);
  const asiPtsLeft =
    asiCount(level) * 2 -
    Object.values(asiExtra).reduce((a, b) => a + (b ?? 0), 0);

  const validation = useMemo(() => {
    const issues: string[] = [];
    if (!character.name.trim()) issues.push("Нет имени");
    if (method === "point" && spent > POINT_BUY_BUDGET)
      issues.push(`Point buy ${spent}/${POINT_BUY_BUDGET}`);
    if (classSkills.length !== 2) issues.push("Нужно 2 навыка класса");
    if (character.selectedFeats.length > featSlots)
      issues.push(`Черт сородича ${character.selectedFeats.length}/${featSlots}`);
    if (asiPtsLeft < 0) issues.push("Слишком много ASI");
    if (!character.preferredBlood.trim()) issues.push("Не выбран Bane (кровь)");
    if (asiPlus2 === asiPlus1) issues.push("+2 и +1 биографии на одну характеристику");
    return issues;
  }, [
    character.name,
    character.selectedFeats,
    character.preferredBlood,
    method,
    spent,
    classSkills,
    featSlots,
    asiPtsLeft,
    asiPlus2,
    asiPlus1,
  ]);

  function go(delta: number) {
    const next = BUILDER_STEPS[stepIndex + delta];
    if (next) setStep(next.id);
  }

  function applyPreset(p: BuildPreset) {
    const clan = p.clan === "toreador" ? "toreador" : "ventrue";
    setBuilderClan(clan);
    setField("clan", clan);
    setBaseScores({ ...p.baseScores });
    setAsiPlus2(p.asiPlus2);
    setAsiPlus1(p.asiPlus1);
    setClassSkills([...p.classSkills]);
    setAsiExtra({});
    setMethod("array");
    setField("level", p.level);
    setField("multiclass", p.multiclass);
    setField("backgroundId", p.backgroundId);
    setField("background", backgroundById(p.backgroundId)?.name ?? p.backgroundId);
    setField("originFeatId", p.originFeatId);
    setField("humanSkill", p.humanSkill);
    setField("preferredBlood", p.preferredBlood);
    setField("name", p.nameSuggestion);
    // feats
    const current = new Set(character.selectedFeats);
    // clear then set via patch
    patch({
      selectedFeats: [...p.selectedFeats],
      backgroundFeatId:
        p.backgroundId === "touchstone"
          ? "protected"
          : backgroundById(p.backgroundId)?.featId === "healthy"
            ? "healthy"
            : "protected",
    });
    toast.success(`Пресет: ${p.name}`);
  }

  function bumpScore(key: keyof Abilities, delta: number) {
    setBaseScores((s) => {
      const next = Math.min(15, Math.max(8, s[key] + delta));
      if (method === "point") {
        const trial = { ...s, [key]: next };
        if (pointBuySpent(Object.values(trial)) > POINT_BUY_BUDGET && delta > 0) {
          toast.error("Не хватает очков point buy");
          return s;
        }
      }
      if (method !== "point" && method !== "manual") {
        // still allow adjust
      }
      return { ...s, [key]: method === "manual" ? Math.min(20, Math.max(3, s[key] + delta)) : next };
    });
  }

  function assignArrayTo(key: keyof Abilities) {
    if (pickedArray == null) {
      toast.message("Сначала выберите число из массива");
      return;
    }
    const prev = baseScores[key];
    setBaseScores((s) => ({ ...s, [key]: pickedArray }));
    setArrayPool((pool) => {
      const without = pool.filter((n, i) => n !== pickedArray || pool.indexOf(pickedArray) !== i);
      // put old score back if it was from standard
      if (STANDARD_ARRAY.includes(prev as (typeof STANDARD_ARRAY)[number])) {
        return [...without, prev].sort((a, b) => b - a);
      }
      return without;
    });
    // simpler: rebuild pool as unused
    setPickedArray(null);
    setMethod("array");
  }

  function roll4d6() {
    const scores: number[] = [];
    for (let i = 0; i < 6; i++) {
      const dice = [1, 2, 3, 4].map(() => Math.floor(Math.random() * 6) + 1);
      dice.sort((a, b) => a - b);
      scores.push(dice[1]! + dice[2]! + dice[3]!);
    }
    scores.sort((a, b) => b - a);
    setRolledPool(scores);
    setMethod("roll");
    // auto assign CHA>CON>DEX>WIS>INT>STR
    const order: (keyof Abilities)[] = ["cha", "con", "dex", "wis", "int", "str"];
    const next = { ...baseScores };
    order.forEach((k, i) => {
      next[k] = scores[i] ?? 10;
    });
    setBaseScores(next);
    toast.message(`4d6: ${scores.join(", ")} (разложено под Вентру)`);
  }

  function toggleClassSkill(id: SkillId) {
    setClassSkills((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) {
        toast.error("Класс даёт 2 навыка");
        return prev;
      }
      return [...prev, id];
    });
  }

  function applyToSheet() {
    if (validation.length) {
      toast.error(validation[0]);
    }
    const skillProfs: CharacterSheet["skillProfs"] = {};
    for (const id of classSkills) skillProfs[id] = "proficient";
    for (const id of bgSkillIds) skillProfs[id] = "proficient";
    const sp = speciesByName(character.species);
    if (sp.skillful && humanSkill) skillProfs[humanSkill] = "proficient";

    const originFeat = character.originFeatId || "lucky";
    let bgFeat = character.backgroundFeatId || bg.featId;
    if (bgFeat === "magic-initiate" || bgFeat === "well-read") bgFeat = "protected";

    const resources =
      builderClan === "ventrue"
        ? [
            {
              id: "cr-voice",
              name: "Голос власти",
              current: pb,
              max: pb,
              note: "Приказ / Внушение · короткий",
            },
          ]
        : [
            {
              id: "cr-artist",
              name: "Aura Sight",
              current: pb,
              max: pb,
              note: "Depth of Feelings · 2 ОБК за использование вне пула",
            },
          ];
    if (character.selectedFeats.includes("forceful")) {
      resources.push({
        id: "cr-presence",
        name: "Властное присутствие",
        current: pb,
        max: pb,
        note: "Awe / Daunt · LR",
      });
    }

    const hp = calcKindredHp(level, finalScores.con, builderClan === "ventrue" && level >= 6);
    const attacks = defaultAttacks(level, finalScores, character.selectedFeats);
    const dexMod = abilityMod(finalScores.dex);
    const ac = 10 + dexMod + (level >= 1 ? 2 : 0); // studded-ish

    patch({
      abilities: finalScores,
      skillProfs,
      saveProfs: { con: true, cha: true },
      species: sp.name,
      fiendishLegacy: sp.id === "tiefling" ? (character.fiendishLegacy || "infernal") : "",
      clan: builderClan,
      background: bg.name,
      backgroundId: bg.id,
      originFeatId: originFeat,
      backgroundFeatId: bgFeat,
      humanSkill,
      hpMax: hp,
      hpCurrent: hp,
      bloodCurrent: bpPreview,
      ac,
      speed: 30,
      inspiration: true,
      luckyUsed: 0,
      protectedUsed: 0,
      customResources: resources,
      preferredBlood:
        character.preferredBlood ||
        (builderClan === "toreador" ? "артисты / красавцы" : "солдаты / военные"),
      attacks,
      feats: [
        sp.id === "tiefling"
          ? `Тифлинг · ${fiendishLegacyById(character.fiendishLegacy || "infernal").name}`
          : `Человек · ${originFeatById(originFeat)?.name ?? originFeat}`,
        `Био · ${originFeatById(bgFeat)?.name ?? bgFeat}`,
        ...character.selectedFeats.map(
          (id) => KINDRED_FEATS.find((f) => f.id === id)?.name ?? id,
        ),
        `Ур. ${level}${character.multiclass ? " / " + character.multiclass : ""}`,
      ].join("\n"),
      equipment:
        character.equipment ||
        `💰 15\n• Короткий меч ×1 (2 lb)\n• Кинжал ×2 (1 lb)\n• Нагрудник ×1 (20 lb)\n• ${bg.equipment}`,
      notes:
        character.notes ||
        `Сл ${spellDc}. Bane: ${character.preferredBlood}. Dual luck: Везучий + Защищённый.`,
    });

    (Object.keys(finalScores) as (keyof Abilities)[]).forEach((k) =>
      setAbility(k, finalScores[k]),
    );

    addLog("Билдер: билд применён");
    toast.success("Билд на листе · режим «Играть»");
    useSessionStore.getState().requestPlayMode();
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-14 z-10 -mx-1 flex gap-1 overflow-x-auto scroll-thin bg-bg/95 px-1 py-1.5 pb-1 backdrop-blur">
        {BUILDER_STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStep(s.id)}
            className={cn(
              "flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium",
              step === s.id
                ? "border-primary bg-primary text-primary-fg"
                : i < stepIndex
                  ? "border-success/40 bg-success/10 text-success"
                  : "border-border bg-surface text-muted",
            )}
          >
            {i < stepIndex ? <Check className="size-3.5" /> : i + 1}
            {s.short}
          </button>
        ))}
      </div>

      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 sm:p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-[var(--radius)] bg-primary/15 text-primary">
            <User className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-xl tracking-wide">
              Билдер · {lore.name}
            </h2>
            <p className="text-sm text-muted">
              {BUILDER_STEPS[stepIndex]?.title} · шаг {stepIndex + 1}/
              {BUILDER_STEPS.length}
            </p>
          </div>
        </div>

        {/* Live preview strip */}
        <div className="mb-4 grid grid-cols-3 gap-2 rounded-[var(--radius)] border border-border bg-surface-2 p-2 text-center text-xs sm:grid-cols-6">
          {ABILITY_LABELS.map(({ key, short }) => (
            <div key={key}>
              <div className="text-faint">{short}</div>
              <div className="font-display text-lg text-accent">{finalScores[key]}</div>
              <div className="text-muted">{formatMod(abilityMod(finalScores[key]))}</div>
            </div>
          ))}
        </div>

        {step === "concept" && (
          <div className="space-y-4">
            <InfoBox>
              Класс <strong>Сородич (Kindred)</strong>. Клан: <strong>{lore.name}</strong>.
              Источники: Bound by Blood PDF + dnd.su (человек, Lucky). Старт с 3 ур. рекомендуется.
            </InfoBox>

            <div>
              <h3 className="mb-2 text-sm font-medium">Клан (подкласс)</h3>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["ventrue", VENTRUE_LORE.name, VENTRUE_LORE.tagline],
                    ["toreador", TOREADOR_LORE.name, TOREADOR_LORE.tagline],
                  ] as const
                ).map(([id, name, tag]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setBuilderClan(id);
                      setField("clan", id);
                    }}
                    className={cn(
                      "rounded-[var(--radius)] border p-3 text-left",
                      builderClan === id
                        ? "border-primary bg-primary/15"
                        : "border-border bg-surface-2",
                    )}
                  >
                    <div className="font-medium text-fg">{name}</div>
                    <p className="mt-0.5 text-[11px] text-muted">{tag}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium">Быстрые пресеты · {builderClan === "toreador" ? "Тореадор" : "Вентру"}</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {BUILD_PRESETS.filter((p) => (p.clan ?? "ventrue") === builderClan).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="rounded-[var(--radius)] border border-border bg-surface-2 p-3 text-left hover:border-primary/50"
                  >
                    <div className="font-medium text-fg">{p.name}</div>
                    <p className="mt-1 text-xs text-muted">{p.blurb}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Имя">
                <Input
                  value={character.name}
                  onChange={(e) => setField("name", e.target.value)}
                />
              </Field>
              <Field label="Игрок">
                <Input
                  value={character.player}
                  onChange={(e) => setField("player", e.target.value)}
                />
              </Field>
              <Field label="Уровень Kindred">
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={level}
                  onChange={(e) =>
                    setField(
                      "level",
                      Math.min(20, Math.max(1, Number(e.target.value) || 1)),
                    )
                  }
                />
              </Field>
              <Field label="Мультикласс">
                <Input
                  value={character.multiclass}
                  onChange={(e) => setField("multiclass", e.target.value)}
                  placeholder="Колдун 1"
                />
              </Field>
            </div>
            <div className="rounded-[var(--radius)] border border-border bg-surface-2 p-3 text-sm text-muted">
              <strong className="text-fg">Ур. {level}:</strong> БМ {formatMod(pb)} · ОБК{" "}
              {bpPreview} · Питание {getLevelData(level).feed} · черты сородича {featSlots} ·
              ASI×{asiCount(level)}
              <div className="mt-1 text-xs">{KINDRED_TABLE[level - 1]?.features}</div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium">Вехи · {lore.name}</h3>
              <ul className="max-h-40 space-y-1 overflow-y-auto scroll-thin text-xs text-muted">
                {milestones.filter((m) => m.level <= level).map((m) => (
                  <li
                    key={m.level}
                    className={cn(
                      "rounded border border-border px-2 py-1",
                      m.level === level && "border-primary/50 bg-primary/10 text-fg",
                    )}
                  >
                    <strong>ур.{m.level} {m.title}:</strong> {m.items.join(" · ")}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {step === "origin" && (
          <div className="space-y-4">
            <section>
              <h3 className="mb-2 font-display text-base">Вид (раса)</h3>
              <div className="mb-3 grid gap-2 sm:grid-cols-2">
                {SPECIES.map((spOpt) => {
                  const active = speciesByName(character.species).id === spOpt.id;
                  return (
                    <button
                      key={spOpt.id}
                      type="button"
                      onClick={() => {
                        setField("species", spOpt.name);
                        if (spOpt.id === "tiefling" && !character.fiendishLegacy) {
                          setField("fiendishLegacy", "infernal");
                        }
                        if (spOpt.id === "human") {
                          setField("fiendishLegacy", "");
                        }
                      }}
                      className={cn(
                        "rounded-[var(--radius)] border p-3 text-left transition-colors active:scale-[0.99]",
                        active
                          ? "border-primary bg-primary/10"
                          : "border-border bg-surface-2",
                      )}
                    >
                      <div className="font-medium text-fg">
                        {spOpt.name}{" "}
                        <span className="text-xs text-muted">[{spOpt.nameEn}]</span>
                      </div>
                      <p className="mt-1 text-xs text-muted">{spOpt.summary}</p>
                      <div className="mt-1 text-[10px] text-faint">{spOpt.source}</div>
                    </button>
                  );
                })}
              </div>

              {(() => {
                const sp = speciesByName(character.species);
                return (
                  <>
                    <InfoBox source={sp.source}>{sp.summary}</InfoBox>
                    {sp.traits.map((tr) => (
                      <div
                        key={tr.name}
                        className="mt-2 rounded-[var(--radius)] border border-border bg-surface-2 p-3 text-sm"
                      >
                        <div className="font-medium">{tr.name}</div>
                        <p className="mt-1 text-muted">{tr.body}</p>
                      </div>
                    ))}

                    {sp.skillful && (
                      <Field label="Навык Умелый (Skillful)" className="mt-3">
                        <select
                          className="h-11 w-full rounded-[var(--radius)] border border-border bg-bg px-3"
                          value={humanSkill}
                          onChange={(e) => setField("humanSkill", e.target.value as SkillId)}
                        >
                          {SKILLS.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.nameRu} ({s.ability.toUpperCase()})
                            </option>
                          ))}
                        </select>
                      </Field>
                    )}

                    {sp.id === "tiefling" && (
                      <div className="mt-3 space-y-2">
                        <h4 className="text-sm font-medium">Наследие (Fiendish Legacy)</h4>
                        <div className="grid gap-2">
                          {FIENDISH_LEGACIES.map((leg) => {
                            const on = (character.fiendishLegacy || "infernal") === leg.id;
                            return (
                              <button
                                key={leg.id}
                                type="button"
                                onClick={() =>
                                  setField("fiendishLegacy", leg.id as FiendishLegacyId)
                                }
                                className={cn(
                                  "rounded-[var(--radius)] border p-3 text-left text-sm",
                                  on
                                    ? "border-accent bg-accent/10"
                                    : "border-border bg-surface-2",
                                )}
                              >
                                <div className="font-medium">
                                  {leg.name}{" "}
                                  <span className="text-xs text-muted">[{leg.nameEn}]</span>
                                </div>
                                <ul className="mt-1 space-y-0.5 text-xs text-muted">
                                  <li>ур.1: {leg.level1}</li>
                                  <li>ур.3: {leg.level3}</li>
                                  <li>ур.5: {leg.level5}</li>
                                </ul>
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-[11px] text-faint">
                          Способность заклинаний наследия: Интеллект, Мудрость или Харизма (запишите
                          в заметках; для Вентру обычно Хар).
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </section>

            <section>
              <h3 className="mb-2 font-display text-base">Биография</h3>
              {BACKGROUNDS_PDF.map((b) => {
                const active = character.backgroundId === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setField("backgroundId", b.id);
                      setField("background", b.name);
                      const feat =
                        b.featId === "magic-initiate" || b.featId === "well-read"
                          ? "protected"
                          : ORIGIN_FEATS.some((f) => f.id === b.featId)
                            ? b.featId
                            : "protected";
                      setField("backgroundFeatId", feat);
                      const keys = parseBgAbilities(b.abilityScores);
                      if (keys[0]) setAsiPlus2(keys[0]);
                      if (keys[1]) setAsiPlus1(keys[1]);
                    }}
                    className={cn(
                      "mb-2 w-full rounded-[var(--radius)] border p-3 text-left",
                      active ? "border-primary bg-primary/10" : "border-border bg-surface-2",
                    )}
                  >
                    <div className="font-medium">{b.name}</div>
                    <p className="mt-1 text-xs text-muted">{b.description}</p>
                    <div className="mt-2 text-[11px] text-faint">
                      {b.abilityScores} · {b.skills} ·{" "}
                      {originFeatById(b.featId)?.name ?? b.featId}
                    </div>
                  </button>
                );
              })}
            </section>

            <section>
              <h3 className="mb-2 font-display text-base">
                Черта происхождения
                {speciesByName(character.species).versatileOriginFeat
                  ? " (Гибкий / Versatile)"
                  : " (из биографии)"}
              </h3>
              {!speciesByName(character.species).versatileOriginFeat && (
                <p className="mb-2 text-xs text-muted">
                  У тифлинга нет Versatile — слот черты происхождения идёт от биографии (часто
                  Защищённый у Опоры). Можно выбрать доп. черту, если мастер разрешил.
                </p>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                {ORIGIN_FEATS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setField("originFeatId", f.id)}
                    className={cn(
                      "rounded-[var(--radius)] border p-3 text-left text-sm",
                      character.originFeatId === f.id
                        ? "border-accent bg-accent/10"
                        : "border-border bg-surface-2",
                    )}
                  >
                    <div className="font-medium">{f.name}</div>
                    <div className="text-[10px] text-faint">{f.source}</div>
                    <p className="mt-1 line-clamp-4 text-xs text-muted">{f.body}</p>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {step === "abilities" && (
          <div className="space-y-4">
            <InfoBox>
              Сначала базовые значения, затем биография <strong>+2 / +1</strong> из{" "}
              {bg.abilityScores}
              {asiCount(level) > 0 && (
                <>
                  , затем ASI уровней ({ASI_LEVELS.filter((l) => level >= l).join(", ")}):{" "}
                  {asiCount(level) * 2} очков (+1 = 1 очко, макс 20)
                </>
              )}
              .
            </InfoBox>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={method === "array" ? "blood" : "secondary"}
                onClick={() => {
                  setMethod("array");
                  setBaseScores({
                    str: 8,
                    dex: 14,
                    con: 15,
                    int: 10,
                    wis: 12,
                    cha: 13,
                  });
                  setArrayPool([...STANDARD_ARRAY]);
                }}
              >
                Массив 15–8
              </Button>
              <Button
                type="button"
                size="sm"
                variant={method === "point" ? "blood" : "secondary"}
                onClick={() => {
                  setMethod("point");
                  setBaseScores({ str: 8, dex: 13, con: 14, int: 8, wis: 10, cha: 15 });
                }}
              >
                Point buy
              </Button>
              <Button
                type="button"
                size="sm"
                variant={method === "roll" ? "blood" : "secondary"}
                onClick={roll4d6}
              >
                4d6dl
              </Button>
              <Button
                type="button"
                size="sm"
                variant={method === "manual" ? "blood" : "secondary"}
                onClick={() => setMethod("manual")}
              >
                Вручную
              </Button>
            </div>
            {method === "point" && (
              <p className={cn("text-sm", spent > POINT_BUY_BUDGET ? "text-primary" : "text-success")}>
                Point buy: {spent}/{POINT_BUY_BUDGET}
                {spent === 27 && " · как стандартный массив"}
              </p>
            )}
            {rolledPool && (
              <p className="text-xs text-muted">Бросок: {rolledPool.join(", ")}</p>
            )}

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ABILITY_LABELS.map(({ key, ru, short }) => (
                <div
                  key={key}
                  className="rounded-[var(--radius)] border border-border bg-surface-2 p-3"
                >
                  <div className="text-xs font-semibold text-muted">
                    {ru} · {short}
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-1">
                    <button
                      type="button"
                      className="flex size-9 items-center justify-center rounded border border-border bg-bg"
                      onClick={() => bumpScore(key, -1)}
                    >
                      <Minus className="size-4" />
                    </button>
                    <button
                      type="button"
                      className="min-w-[3rem] font-display text-2xl text-fg"
                      onClick={() => method === "array" && assignArrayTo(key)}
                      title="Назначить выбранное из массива"
                    >
                      {baseScores[key]}
                    </button>
                    <button
                      type="button"
                      className="flex size-9 items-center justify-center rounded border border-border bg-bg"
                      onClick={() => bumpScore(key, 1)}
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                  <div className="mt-1 text-center text-xs text-muted">
                    итог {finalScores[key]} ({formatMod(abilityMod(finalScores[key]))})
                    {method === "point" && (
                      <span className="block text-faint">
                        cost {POINT_BUY_COST[baseScores[key]] ?? "—"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-[var(--radius)] border border-border p-3">
              <div className="mb-2 text-sm font-medium">Биография +2 / +1</div>
              <div className="flex flex-wrap gap-3 text-sm">
                <label className="flex items-center gap-2">
                  +2
                  <select
                    className="h-9 rounded border border-border bg-bg px-2"
                    value={asiPlus2}
                    onChange={(e) => setAsiPlus2(e.target.value as keyof Abilities)}
                  >
                    {bgAbilityKeys.map((k) => (
                      <option key={k} value={k}>
                        {ABILITY_LABELS.find((a) => a.key === k)?.ru}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  +1
                  <select
                    className="h-9 rounded border border-border bg-bg px-2"
                    value={asiPlus1}
                    onChange={(e) => setAsiPlus1(e.target.value as keyof Abilities)}
                  >
                    {bgAbilityKeys
                      .filter((k) => k !== asiPlus2)
                      .map((k) => (
                        <option key={k} value={k}>
                          {ABILITY_LABELS.find((a) => a.key === k)?.ru}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
            </div>

            {asiCount(level) > 0 && (
              <div className="rounded-[var(--radius)] border border-border p-3">
                <div className="mb-2 text-sm font-medium">
                  ASI уровней (осталось очков: {asiPtsLeft})
                </div>
                <p className="mb-2 text-xs text-muted">
                  Каждый ASI = 2 очка (+2 к одной или +1 к двум). Не заменяет черту сородича.
                </p>
                <div className="flex flex-wrap gap-2">
                  {ABILITY_LABELS.map(({ key, short }) => (
                    <div key={key} className="flex items-center gap-1 rounded border border-border px-2 py-1">
                      <span className="text-xs text-muted">{short}</span>
                      <button
                        type="button"
                        className="size-7 rounded bg-surface-2 text-sm"
                        onClick={() =>
                          setAsiExtra((e) => ({
                            ...e,
                            [key]: Math.max(0, (e[key] ?? 0) - 1),
                          }))
                        }
                      >
                        −
                      </button>
                      <span className="w-4 text-center text-sm">{asiExtra[key] ?? 0}</span>
                      <button
                        type="button"
                        className="size-7 rounded bg-surface-2 text-sm"
                        onClick={() => {
                          if (asiPtsLeft <= 0) {
                            toast.error("Нет очков ASI");
                            return;
                          }
                          setAsiExtra((e) => ({
                            ...e,
                            [key]: (e[key] ?? 0) + 1,
                          }));
                        }}
                      >
                        +
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <StatChip label="ХП" value={String(hpPreview)} />
              <StatChip label="Сл" value={String(spellDc)} />
              <StatChip label="ОБК" value={String(bpPreview)} />
            </div>
          </div>
        )}

        {step === "skills" && (
          <div className="space-y-4">
            <InfoBox>
              <strong>2 навыка класса</strong>. Биография и Skillful добавляются сами.
            </InfoBox>
            <div className="flex flex-wrap gap-1.5">
              {KINDRED_CLASS_SKILLS.map((id) => {
                const sk = SKILLS.find((s) => s.id === id)!;
                const on = classSkills.includes(id);
                const locked = bgSkillIds.includes(id) || id === humanSkill;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleClassSkill(id)}
                    className={cn(
                      "rounded-full border h-10 px-3 py-2 text-xs font-medium",
                      on
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-border bg-surface-2 text-muted",
                      locked && "ring-1 ring-accent/50",
                    )}
                  >
                    {sk.nameRu}
                    <span className="ml-1 text-faint">
                      {formatMod(
                        abilityMod(finalScores[sk.ability]) +
                          (on || locked ? pb : 0),
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            <ul className="space-y-1 text-sm text-muted">
              {classSkills.map((id) => (
                <li key={id}>• {SKILLS.find((s) => s.id === id)?.nameRu} — класс</li>
              ))}
              {bgSkillIds.map((id) => (
                <li key={`b-${id}`}>• {SKILLS.find((s) => s.id === id)?.nameRu} — био</li>
              ))}
              <li>• {SKILLS.find((s) => s.id === humanSkill)?.nameRu} — человек</li>
            </ul>
          </div>
        )}

        {step === "feats" && (
          <div className="space-y-4">
            <InfoBox>
              Слоты черт сородича (ур. 2/7/10/13/17): <strong>{featSlots}</strong>. Выбрано:{" "}
              {character.selectedFeats.length}.
            </InfoBox>
            <div className="grid gap-2">
              {KINDRED_FEATS.filter((f) => f.levelMin <= level).map((f) => {
                const on = character.selectedFeats.includes(f.id);
                const full =
                  !on && character.selectedFeats.length >= featSlots && !f.repeatable;
                return (
                  <button
                    key={f.id}
                    type="button"
                    disabled={full}
                    onClick={() => toggleFeat(f.id)}
                    className={cn(
                      "rounded-[var(--radius)] border p-3 text-left text-sm disabled:opacity-40",
                      on ? "border-primary bg-primary/10" : "border-border bg-surface-2",
                    )}
                  >
                    <div className="flex justify-between gap-2">
                      <span className="font-medium">{f.name}</span>
                      <span className="text-[10px] text-faint">≥{f.levelMin}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted">{f.body}</p>
                    {FEAT_RECS[f.id] && (
                      <p className="mt-1 text-[11px] text-accent">
                        ★ {FEAT_RECS[f.id]!.note}
                        <span className="ml-1 text-faint">
                          [{FEAT_RECS[f.id]!.tags.join(", ")}]
                        </span>
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
            <div>
              <h3 className="mb-2 font-display text-sm">Bane · предпочтённая кровь</h3>
              <div className="flex flex-wrap gap-1.5">
                {PREFERRED_BLOOD_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setField("preferredBlood", p.replace("…", "").trim())}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs",
                      character.preferredBlood &&
                        p.startsWith(character.preferredBlood.slice(0, 5))
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border text-muted",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <Input
                className="mt-2"
                value={character.preferredBlood}
                onChange={(e) => setField("preferredBlood", e.target.value)}
              />
            </div>
          </div>
        )}

        {step === "mechanics" && (
          <div className="space-y-2">
            {MECHANICS_GUIDE.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setOpenGuide(openGuide === g.id ? null : g.id)}
                className="w-full rounded-[var(--radius)] border border-border bg-surface-2 p-3 text-left"
              >
                <div className="flex items-center gap-2 font-medium">
                  <BookOpen className="size-4 text-accent" />
                  {g.title}
                </div>
                {openGuide === g.id && (
                  <p className="mt-2 whitespace-pre-line text-sm text-muted">{g.body}</p>
                )}
              </button>
            ))}
            <div className="rounded-[var(--radius)] border border-primary/30 bg-primary/5 p-3 text-sm">
              <div className="font-display text-primary">{lore.title}</div>
              <p className="mt-1 text-muted">{lore.description}</p>
              {builderClan === "toreador" && (
                <p className="mt-2 text-xs text-accent">
                  Bane: d20 ≤9 на Анализ/Внимательность → Обездвижен (DC 10 Муд.).
                </p>
              )}
              <ul className="mt-2 space-y-1 text-xs text-faint">
                {clanFeatures.filter((f) => f.level <= level).map((f) => (
                  <li key={f.id}>
                    ур.{f.level} · {f.name} — {f.summary}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {step === "finish" && (
          <div className="space-y-4">
            {validation.length > 0 && (
              <div className="rounded-[var(--radius)] border border-primary/40 bg-primary/10 p-3 text-sm text-primary">
                <div className="font-medium">Проверьте:</div>
                <ul className="mt-1 list-disc pl-4">
                  {validation.map((v) => (
                    <li key={v}>{v}</li>
                  ))}
                </ul>
              </div>
            )}
            {validation.length === 0 && (
              <div className="rounded-[var(--radius)] border border-success/40 bg-success/10 p-3 text-sm text-success">
                Билд валиден — можно применять.
              </div>
            )}
            <div className="rounded-[var(--radius)] border border-accent/40 bg-accent/5 p-4">
              <h3 className="font-display text-lg">{character.name || "Без имени"}</h3>
              <p className="text-sm text-muted">
                {character.species || "Вид"} · Вентру · Kindred {level}
                {character.multiclass ? ` / ${character.multiclass}` : ""}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
                {ABILITY_LABELS.map(({ key, short }) => (
                  <div key={key} className="rounded bg-surface-2 py-2">
                    <div className="text-[10px] text-muted">{short}</div>
                    <div className="font-display text-xl">{finalScores[key]}</div>
                    <div className="text-xs text-accent">
                      {formatMod(abilityMod(finalScores[key]))}
                    </div>
                  </div>
                ))}
              </div>
              <ul className="mt-3 space-y-1 text-sm text-muted">
                <li>
                  ХП {hpPreview} · ОБК {bpPreview} · Сл {spellDc} · БМ {formatMod(pb)}
                </li>
                <li>
                  {bg.name} · {originFeatById(character.originFeatId)?.name} +{" "}
                  {originFeatById(character.backgroundFeatId)?.name}
                </li>
                <li>
                  Черты:{" "}
                  {character.selectedFeats
                    .map((id) => KINDRED_FEATS.find((f) => f.id === id)?.name ?? id)
                    .join(", ") || "—"}
                </li>
                <li>Bane: {character.preferredBlood || "—"}</li>
              </ul>
            </div>
            <Button
              type="button"
              variant="blood"
              className="h-12 w-full text-base"
              onClick={applyToSheet}
            >
              <Sparkles className="size-4" /> Применить билд к листу
            </Button>
          </div>
        )}

        <div className="sticky bottom-16 z-10 mt-6 flex justify-between gap-2 border-t border-border bg-bg/95 py-3 backdrop-blur sm:bottom-0">
          <Button type="button" className="h-12 flex-1" variant="secondary" disabled={stepIndex === 0} onClick={() => go(-1)}>
            <ChevronLeft className="size-4" /> Назад
          </Button>
          {step !== "finish" ? (
            <Button className="h-12 flex-1" type="button" variant="blood" onClick={() => go(1)}>
              Далее <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button type="button" className="h-12 flex-1" variant="blood" onClick={applyToSheet}>
              Применить
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function parseBgAbilities(s: string): (keyof Abilities)[] {
  const map: Record<string, keyof Abilities> = {
    Сил: "str",
    Лов: "dex",
    Тел: "con",
    Инт: "int",
    Муд: "wis",
    Хар: "cha",
  };
  const out: (keyof Abilities)[] = [];
  for (const [ru, key] of Object.entries(map)) {
    if (s.includes(ru)) out.push(key);
  }
  return out.length ? out : ["cha", "con", "dex"];
}

function skillsFromBg(skillsRu: string): SkillId[] {
  const map: Record<string, SkillId> = {};
  for (const s of SKILLS) map[s.nameRu] = s.id;
  return skillsRu
    .split(/[,，]/)
    .map((x) => x.trim())
    .map((ru) => map[ru])
    .filter(Boolean) as SkillId[];
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-1", className)}>
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</span>
      {children}
    </label>
  );
}

function InfoBox({
  children,
  source,
  className,
}: {
  children: React.ReactNode;
  source?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-2 rounded-[var(--radius)] border border-border bg-surface-2 p-3 text-sm text-muted",
        className,
      )}
    >
      <Info className="mt-0.5 size-4 shrink-0 text-accent" />
      <div>
        <div>{children}</div>
        {source && <div className="mt-1 text-[10px] text-faint">{source}</div>}
      </div>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface-2 py-2">
      <div className="text-[10px] text-muted">{label}</div>
      <div className="font-display text-lg text-fg">{value}</div>
    </div>
  );
}
