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
  TOREADOR_AESTHETIC_PRESETS,
  TOREADOR_BANE_FIELD,
  TOREADOR_TOOLS,
  STANDARD_ARRAY,
  abilityMod,
  asiCount,
  calcKindredHp,
  clanBaneLine,
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
  allOriginFeats,
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
import { packagesFor } from "@/data/talent-packages";
import {
  GENERAL_FEAT_CATALOG,
  generalFeatsForLevel,
  recommendedForClan,
  clanFeatSortKey,
} from "@/data/phb-feats-ru";
import { useSessionStore } from "@/lib/session-store";

export function VentrueBuilder() {
  const character = useCharacterStore((s) => s.character);
  const patch = useCharacterStore((s) => s.patch);
  const setField = useCharacterStore((s) => s.setField);
  const setAbility = useCharacterStore((s) => s.setAbility);
  const toggleFeat = useCharacterStore((s) => s.toggleFeat);
  const toggleGeneralFeat = useCharacterStore((s) => s.toggleGeneralFeat);
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
  /** Per ASI level RAW: ASI, general PHB feat, OR Kindred Feat */
  const [asiSlotMode, setAsiSlotMode] = useState<
    Partial<Record<number, "asi" | "general" | "kindred">>
  >({});
  const [classSkills, setClassSkills] = useState<SkillId[]>(["intimidation", "insight"]);
  const [openGuide, setOpenGuide] = useState<string | null>("clan");
  const [builderClan, setBuilderClan] = useState<"ventrue" | "toreador">(
    () => (character.clan === "toreador" ? "toreador" : "ventrue"),
  );
  const [arrayPool, setArrayPool] = useState<number[]>([...STANDARD_ARRAY]);
  const [pickedArray, setPickedArray] = useState<number | null>(null);
  const [rolledPool, setRolledPool] = useState<number[] | null>(null);
  const [featTab, setFeatTab] = useState<"origin" | "kindred" | "general">("kindred");
  const [featClanOnly, setFeatClanOnly] = useState(true);
  const [featQuery, setFeatQuery] = useState("");
  /** Toreador Artist's Soul L3: +2 skills (expertise if already proficient) */
  const [artistSkills, setArtistSkills] = useState<SkillId[]>(() =>
    character.clan === "toreador" ? ["performance", "investigation"] : [],
  );
  const [artistTool, setArtistTool] = useState("Лютня / музыкальный инструмент");
  /** Visionary L11: 3 expertise skills */
  const [visionaryExpertise, setVisionaryExpertise] = useState<SkillId[]>([]);

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
  const unlockedAsiLevels = useMemo(
    () => ASI_LEVELS.filter((l) => level >= l),
    [level],
  );
  const slotMode = (L: number): "asi" | "general" | "kindred" =>
    asiSlotMode[L] ?? "asi";
  const asiSlotsAsi = unlockedAsiLevels.filter((L) => slotMode(L) === "asi").length;
  const asiSlotsGeneral = unlockedAsiLevels.filter((L) => slotMode(L) === "general").length;
  const asiSlotsKindred = unlockedAsiLevels.filter((L) => slotMode(L) === "kindred").length;
  const asiPtsBudget = asiSlotsAsi * 2;
  const asiPtsUsed = Object.values(asiExtra).reduce((a, b) => a + (b ?? 0), 0);
  const asiPtsLeft = asiPtsBudget - asiPtsUsed;
  /** PHB general feats only for ASI slots spent on «general» */
  const gSlots = asiSlotsGeneral;
  /** Kindred feats = class slots 2/7/10/13/17 + ASI spent on Kindred Feat */
  const kSlots = featSlots + asiSlotsKindred;
  const validation = useMemo(() => {
    const issues: string[] = [];
    if (!character.name.trim()) issues.push("Нет имени");
    if (method === "point" && spent > POINT_BUY_BUDGET)
      issues.push(`Point buy ${spent}/${POINT_BUY_BUDGET}`);
    if (classSkills.length !== 2) issues.push("Нужно 2 навыка класса");
    const kTaken = character.selectedFeats.length;
    if (kTaken > kSlots)
      issues.push(`Черт сородича ${kTaken}/${kSlots} (класс + ASI→Kindred)`);
    // Kindred slots recommended but not hard-required mid-build
    const gTaken = character.generalFeats?.length ?? 0;
    if (gTaken > gSlots)
      issues.push(
        `Универсальных черт ${gTaken}/${gSlots} (ASI → PHB)`,
      );
    if (gSlots > 0 && gTaken < gSlots)
      issues.push(`ASI→PHB: выберите черту (${gTaken}/${gSlots}) или смените слот на ASI/Kindred`);
    if (asiPtsLeft < 0) issues.push("Слишком много очков ASI (сбросьте или смените слот на черту)");
    // ASI points optional until user assigns them (presets may leave empty)
    // Bane blood is Ventrue-only; Toreador attention-trap is not preferred blood
    if (builderClan === "ventrue" && !character.preferredBlood.trim()) {
      issues.push("Не указан Bane Вентру (предпочтённая кровь)");
    }
    if (asiPlus2 === asiPlus1) issues.push("+2 и +1 биографии на одну характеристику");
    if (builderClan === "toreador" && level >= 3 && artistSkills.length !== 2) {
      issues.push("Тореадор L3+: выберите 2 навыка Artist's Soul");
    }
    if (builderClan === "toreador" && level >= 11 && visionaryExpertise.length !== 3) {
      issues.push("Тореадор L11+: выберите 3 навыка для Экспертизы (Visionary)");
    }
    // illegal kindred feats
    for (const id of character.selectedFeats) {
      const f = KINDRED_FEATS.find((x) => x.id === id);
      if (!f) continue;
      if (f.levelMin > level) issues.push(`${f.name}: нужен ур. ${f.levelMin}+`);
      if (
        f.clans &&
        !f.clans.includes("any") &&
        !f.clans.includes(builderClan)
      ) {
        issues.push(`${f.name}: не для ${builderClan === "toreador" ? "Тореадор" : "Вентру"}`);
      }
    }
    return issues;
  }, [
    character.name,
    character.selectedFeats,
    character.generalFeats,
    character.preferredBlood,
    builderClan,
    method,
    spent,
    classSkills,
    featSlots,
    gSlots,
    kSlots,
    level,
    asiPtsLeft,
    asiSlotsAsi,
    asiSlotsKindred,
    asiPlus2,
    asiPlus1,
    artistSkills,
    visionaryExpertise,
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
    if (clan === "toreador") {
      setArtistSkills(["performance", "investigation"]);
      if (p.level >= 11) {
        setVisionaryExpertise(["performance", "persuasion", "insight"]);
      }
    } else {
      setArtistSkills([]);
      setVisionaryExpertise([]);
    }
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
      return;
    }
    const skillProfs: CharacterSheet["skillProfs"] = {};
    for (const id of classSkills) skillProfs[id] = "proficient";
    for (const id of bgSkillIds) skillProfs[id] = "proficient";
    const sp = speciesByName(character.species);
    if (sp.skillful && humanSkill) skillProfs[humanSkill] = "proficient";
    // Artist's Soul: +2 skills; if already proficient → expertise
    if (builderClan === "toreador" && level >= 3) {
      for (const id of artistSkills) {
        if (skillProfs[id]) skillProfs[id] = "expertise";
        else skillProfs[id] = "proficient";
      }
    }
    // Visionary L11: expertise on 3 skilled
    if (builderClan === "toreador" && level >= 11) {
      for (const id of visionaryExpertise) {
        if (skillProfs[id]) skillProfs[id] = "expertise";
      }
    }

    const originFeat = character.originFeatId || "lucky";
    let bgFeat = character.backgroundFeatId || bg.featId;
    if (bgFeat === "magic-initiate" || bgFeat === "well-read") bgFeat = "protected";

    const resources: {
      id: string;
      name: string;
      current: number;
      max: number;
      note: string;
    }[] = [];
    if (builderClan === "ventrue" && level >= 3) {
      resources.push({
        id: "cr-voice",
        name: "Голос власти",
        current: pb,
        max: pb,
        note: "Приказ / Внушение · короткий/долгий",
      });
    }
    // Toreador Depth of Feelings costs BP only — no fake PB pool
    if (character.selectedFeats.includes("forceful")) {
      resources.push({
        id: "cr-presence",
        name: "Властное присутствие",
        current: pb,
        max: pb,
        note: "Awe / Daunt · LR",
      });
    }
    if (character.selectedFeats.includes("alacrity")) {
      resources.push({
        id: "cr-alacrity",
        name: "Проворство (Alacrity)",
        current: pb,
        max: pb,
        note: "доп. действие · 1 ОБК · LR note",
      });
    }

    // Live Fast L9: Dex +2 (max 25)
    const appliedScores = { ...finalScores };
    if (builderClan === "toreador" && level >= 9) {
      appliedScores.dex = Math.min(25, appliedScores.dex + 2);
    }

    let hp = calcKindredHp(
      level,
      appliedScores.con,
      builderClan === "ventrue" && level >= 6,
    );
    // Tough (PHB origin): +2 HP per level
    if (character.originFeatId === "tough" || character.backgroundFeatId === "tough") {
      hp += level * 2;
    }
    const attacks = defaultAttacks(level, appliedScores, character.selectedFeats);
    const dexMod = abilityMod(appliedScores.dex);
    const ac = 10 + dexMod + (level >= 1 ? 2 : 0); // studded-ish

    // Resilient-style: if general resilient, leave notes; CHA/CON already class saves
    const saveProfs: CharacterSheet["saveProfs"] = { con: true, cha: true };
    if ((character.generalFeats ?? []).includes("resilient")) {
      // default Wis if not already — common pick for casters/controllers
      saveProfs.wis = true;
    }

    let speed = 30;
    if (character.selectedFeats.includes("alacrity")) speed += 10;

    const visionNote =
      builderClan === "toreador" && level >= 3
        ? "Тёмное зрение 120 фт. (Artist's Soul)"
        : "Тёмное зрение 60 фт.";
    const toolNote =
      builderClan === "toreador" && level >= 3
        ? `Инструмент Artist's Soul: ${artistTool}`
        : "";

    patch({
      abilities: appliedScores,
      skillProfs,
      saveProfs,
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
      speed,
      inspiration: true,
      luckyUsed: 0,
      protectedUsed: 0,
      customResources: resources,
      generalFeats: character.generalFeats ?? [],
      selectedFeats: character.selectedFeats,
      preferredBlood:
        character.preferredBlood ||
        (builderClan === "toreador" ? TOREADOR_BANE_FIELD : "солдаты / военные"),
      attacks,
      feats: [
        sp.id === "tiefling"
          ? `Тифлинг · ${fiendishLegacyById(character.fiendishLegacy || "infernal").name}`
          : `Человек · ${originFeatById(originFeat)?.name ?? originFeat}`,
        `Био · ${originFeatById(bgFeat)?.name ?? bgFeat}`,
        ...character.selectedFeats.map(
          (id) => KINDRED_FEATS.find((f) => f.id === id)?.name ?? id,
        ),
        ...(character.generalFeats ?? []).map((id) => {
          const g = GENERAL_FEAT_CATALOG.find((f) => f.id === id);
          return g ? `PHB: ${g.name}` : id;
        }),
        `Ур. ${level}${character.multiclass ? " / " + character.multiclass : ""}`,
      ].join("\n"),
      equipment:
        character.equipment ||
        `💰 15\n• Короткий меч ×1 (2 lb)\n• Кинжал ×2 (1 lb)\n• Нагрудник ×1 (20 lb)\n• ${bg.equipment}`,
      notes: (() => {
        const auto = [
          `Сл ${spellDc}. ${clanBaneLine(builderClan, character.preferredBlood)}.`,
          visionNote,
          toolNote,
          builderClan === "toreador" && level >= 3
            ? "Artist's Soul: преимущество на Анализ и Внимательность."
            : "",
          builderClan === "toreador" && level >= 9
            ? `Live Fast: Лов ${appliedScores.dex} (incl. +2, макс 25).`
            : "",
          builderClan === "ventrue" && level >= 6
            ? "Dare Not Falter: +макс.ХП; reroll Charm/Fear/Stun."
            : "",
          "Dual luck: Везучий + Защищённый.",
        ]
          .filter(Boolean)
          .join(" ");
        const prev = (character.notes || "").trim();
        if (!prev) return auto;
        if (/Artist's Soul|Dare Not Falter|Live Fast|Тёмное зрение/i.test(prev)) return prev;
        return `${prev}\n${auto}`;
      })(),
    });

    (Object.keys(appliedScores) as (keyof Abilities)[]).forEach((k) =>
      setAbility(k, appliedScores[k]),
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
                      if (id === "toreador") {
                        const cur = character.preferredBlood.trim();
                        if (
                          !cur ||
                          /солдат|аристократ|преступн|учёны|духов|политик/i.test(cur)
                        ) {
                          setField("preferredBlood", TOREADOR_BANE_FIELD);
                        }
                        setArtistSkills((prev) =>
                          prev.length === 2 ? prev : (["performance", "investigation"] as SkillId[]),
                        );
                      } else {
                        // switching to Ventrue: drop Toreador bane text
                        const cur = character.preferredBlood.trim();
                        if (!cur || /d20|Обездвиж|Restrained|Bane:/i.test(cur)) {
                          setField("preferredBlood", "");
                        }
                      }
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
              {bpPreview} · Питание {getLevelData(level).feed} · Kindred-слоты {featSlots}+ASI ·
              ASI/черта×{asiCount(level)}
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
                {allOriginFeats().map((f) => (
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
              {unlockedAsiLevels.length > 0 && (
                <>
                  , затем на ур. {unlockedAsiLevels.join(", ")} —{" "}
                  <strong>ASI / PHB / Kindred Feat</strong> (RAW, одно на уровень)
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

            {unlockedAsiLevels.length > 0 && (
              <div className="space-y-3 rounded-[var(--radius)] border border-primary/30 bg-primary/5 p-3">
                <div>
                  <div className="text-sm font-medium text-fg">
                    ASI · уровни {unlockedAsiLevels.join(", ")}
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    RAW: на каждом уровне — <strong>одно</strong>: +2/+1+1,{" "}
                    <strong>черта PHB</strong> или <strong>Kindred Feat</strong>. Слоты класса
                    2/7/10/13/17 — <em>дополнительно</em> дают черту сородича.
                  </p>
                </div>
                {unlockedAsiLevels.map((L) => {
                  const mode = slotMode(L);
                  const label =
                    mode === "asi"
                      ? "→ +2 / +1+1"
                      : mode === "general"
                        ? "→ PHB"
                        : "→ Kindred";
                  function pickMode(next: "asi" | "general" | "kindred") {
                    setAsiSlotMode((m) => ({ ...m, [L]: next }));
                    if (next !== "asi") {
                      setAsiExtra((extra) => {
                        const newAsiCount = unlockedAsiLevels.filter((x) =>
                          x === L ? false : slotMode(x) === "asi",
                        ).length;
                        const newBudget = newAsiCount * 2;
                        let used = Object.values(extra).reduce((a, b) => a + (b ?? 0), 0);
                        if (used <= newBudget) return extra;
                        const out = { ...extra };
                        for (const k of ["cha", "con", "dex", "str", "wis", "int"] as const) {
                          while ((out[k] ?? 0) > 0 && used > newBudget) {
                            out[k] = (out[k] ?? 0) - 1;
                            used -= 1;
                          }
                        }
                        return out;
                      });
                    }
                    if (next === "general") {
                      setFeatTab("general");
                      toast.message(`Ур.${L}: PHB → шаг «Черты»`);
                    }
                    if (next === "kindred") {
                      setFeatTab("kindred");
                      toast.message(`Ур.${L}: Kindred Feat → шаг «Черты → Сородич»`);
                    }
                  }
                  return (
                    <div
                      key={L}
                      className="rounded-[var(--radius)] border border-border bg-surface p-3"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="font-display text-sm text-fg">Уровень {L}</span>
                        <span className="text-[10px] text-faint">{label}</span>
                      </div>
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
                            onClick={() => pickMode(id)}
                            className={cn(
                              "flex h-14 flex-col items-center justify-center rounded-[var(--radius-sm)] border px-1 text-[11px] font-semibold leading-tight",
                              mode === id
                                ? "border-primary bg-primary/15 text-primary"
                                : "border-border bg-surface-2 text-muted",
                            )}
                          >
                            {title}
                            <span className="mt-0.5 text-[9px] font-normal opacity-80">{sub}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {asiSlotsAsi > 0 && (
                  <div className="rounded-[var(--radius)] border border-border bg-surface-2 p-3">
                    <div className="mb-2 text-sm font-medium">
                      Очки ASI ({asiPtsUsed}/{asiPtsBudget}, осталось {asiPtsLeft})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ABILITY_LABELS.map(({ key, short }) => (
                        <div
                          key={key}
                          className="flex items-center gap-1 rounded border border-border px-2 py-1"
                        >
                          <span className="text-xs text-muted">{short}</span>
                          <button
                            type="button"
                            className="size-7 rounded bg-bg text-sm"
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
                            className="size-7 rounded bg-bg text-sm"
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
                {asiSlotsGeneral > 0 && (
                  <div className="rounded-[var(--radius)] border border-accent/30 bg-accent/5 p-3 text-xs text-muted">
                    ASI → PHB: {asiSlotsGeneral} · выбрано {(character.generalFeats ?? []).length}
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="mt-2 h-10 w-full"
                      onClick={() => {
                        setStep("feats");
                        setFeatTab("general");
                      }}
                    >
                      Выбрать черты PHB
                    </Button>
                  </div>
                )}
                {asiSlotsKindred > 0 && (
                  <div className="rounded-[var(--radius)] border border-primary/30 bg-primary/5 p-3 text-xs text-muted">
                    ASI → Kindred: {asiSlotsKindred} · всего {character.selectedFeats.length}/{kSlots}{" "}
                    (класс {featSlots} + ASI {asiSlotsKindred})
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="mt-2 h-10 w-full"
                      onClick={() => {
                        setStep("feats");
                        setFeatTab("kindred");
                      }}
                    >
                      Выбрать черты сородича
                    </Button>
                  </div>
                )}
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
              {speciesByName(character.species).skillful && (
                <li>• {SKILLS.find((s) => s.id === humanSkill)?.nameRu} — человек</li>
              )}
            </ul>

            {builderClan === "toreador" && level >= 3 && (
              <div className="rounded-[var(--radius)] border border-primary/30 bg-primary/5 p-3">
                <h3 className="mb-1 font-display text-sm">Artist's Soul (L3) · +2 навыка</h3>
                <p className="mb-2 text-[11px] text-muted">
                  RAW: два навыка на выбор. Если уже владеете — Экспертиза. +1 инструмент.
                  Также: преимущество на Анализ/Внимательность, ТЗ 120.
                </p>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {SKILLS.map((sk) => {
                    const on = artistSkills.includes(sk.id);
                    return (
                      <button
                        key={sk.id}
                        type="button"
                        onClick={() => {
                          setArtistSkills((prev) => {
                            if (prev.includes(sk.id)) return prev.filter((x) => x !== sk.id);
                            if (prev.length >= 2) {
                              toast.error("Artist's Soul: ровно 2 навыка");
                              return prev;
                            }
                            return [...prev, sk.id];
                          });
                        }}
                        className={cn(
                          "rounded-full border px-2.5 py-1.5 text-[11px] font-medium",
                          on
                            ? "border-primary bg-primary/20 text-primary"
                            : "border-border bg-surface text-muted",
                        )}
                      >
                        {sk.nameRu}
                      </button>
                    );
                  })}
                </div>
                <p className="mb-1 text-[11px] text-muted">Инструмент:</p>
                <div className="flex flex-wrap gap-1.5">
                  {TOREADOR_TOOLS.map((tool) => (
                    <button
                      key={tool}
                      type="button"
                      onClick={() => setArtistTool(tool.replace("…", "").trim())}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[11px]",
                        artistTool.startsWith(tool.slice(0, 6))
                          ? "border-accent bg-accent/15 text-accent"
                          : "border-border text-muted",
                      )}
                    >
                      {tool}
                    </button>
                  ))}
                </div>
                <Input
                  className="mt-2 h-9"
                  value={artistTool}
                  onChange={(e) => setArtistTool(e.target.value)}
                  placeholder="Инструмент"
                />
              </div>
            )}

            {builderClan === "toreador" && level >= 11 && (
              <div className="rounded-[var(--radius)] border border-accent/30 bg-accent/5 p-3">
                <h3 className="mb-1 font-display text-sm">Visionary (L11) · Экспертиза ×3</h3>
                <p className="mb-2 text-[11px] text-muted">
                  Выберите 3 навыка, которыми уже владеете (класс/био/Artist/человек).
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SKILLS.filter((sk) => {
                    const owned =
                      classSkills.includes(sk.id) ||
                      bgSkillIds.includes(sk.id) ||
                      artistSkills.includes(sk.id) ||
                      humanSkill === sk.id;
                    return owned;
                  }).map((sk) => {
                    const on = visionaryExpertise.includes(sk.id);
                    return (
                      <button
                        key={sk.id}
                        type="button"
                        onClick={() => {
                          setVisionaryExpertise((prev) => {
                            if (prev.includes(sk.id)) return prev.filter((x) => x !== sk.id);
                            if (prev.length >= 3) {
                              toast.error("Visionary: ровно 3");
                              return prev;
                            }
                            return [...prev, sk.id];
                          });
                        }}
                        className={cn(
                          "rounded-full border px-2.5 py-1.5 text-[11px]",
                          on
                            ? "border-accent bg-accent/20 text-accent"
                            : "border-border text-muted",
                        )}
                      >
                        {sk.nameRu}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        
        {step === "feats" && (
          <div className="space-y-4">
            <InfoBox>
              <strong>Три слоя талантов:</strong> (1) происхождение / био — dnd.su + BBB · (2) черты
              сородича — слоты 2/7/10/13/17 · (3) универсальные PHB — вместо ASI на 4/8/12/16/19.
              Рекомендации подстраиваются под{" "}
              <strong>{builderClan === "toreador" ? "Тореадор" : "Вентру"}</strong>.
            </InfoBox>


            <div className="space-y-2">
              <h3 className="font-display text-sm">Пакеты талантов · 1 тап</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {packagesFor(builderClan, level).map((pack) => (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => {
                      const gens = pack.general.filter((id) => {
                        const f = GENERAL_FEAT_CATALOG.find((x) => x.id === id);
                        return f && f.levelMin <= level;
                      });
                      const unlocked = ASI_LEVELS.filter((l) => level >= l);
                      const modes: Partial<Record<number, "asi" | "general" | "kindred">> = {};
                      unlocked.forEach((L, i) => {
                        modes[L] = i < gens.length ? "general" : "asi";
                      });
                      setAsiSlotMode(modes);
                      const kMax = featSlots; // class slots; package kindred list is class-sized
                      setField(
                        "selectedFeats",
                        pack.kindred.filter((id) => {
                          const f = KINDRED_FEATS.find((x) => x.id === id);
                          return f && f.levelMin <= level;
                        }).slice(0, kMax),
                      );
                      setField("generalFeats", gens.slice(0, unlocked.length));
                      if (pack.originFeatId) setField("originFeatId", pack.originFeatId);
                      if (pack.backgroundFeatId) setField("backgroundFeatId", pack.backgroundFeatId);
                      toast.success(`Пакет «${pack.name}» · ASI/черта настроено`);
                      setFeatTab("kindred");
                    }}
                    className="rounded-[var(--radius)] border border-border bg-surface-2 p-3 text-left active:scale-[0.99]"
                  >
                    <div className="font-medium text-fg">{pack.name}</div>
                    <p className="mt-0.5 text-[11px] text-muted">{pack.blurb}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 rounded-[var(--radius)] border border-border bg-surface-2 p-1">
              {(
                [
                  ["origin", "Происх."],
                  ["kindred", "Сородич"],
                  ["general", "PHB/ASI"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFeatTab(id)}
                  className={cn(
                    "flex h-11 items-center justify-center rounded-[var(--radius-sm)] text-xs font-semibold",
                    featTab === id ? "bg-primary text-primary-fg" : "text-muted",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <Input
              placeholder="Поиск черты…"
              value={featQuery}
              onChange={(e) => setFeatQuery(e.target.value)}
              className="h-11"
            />

            {featTab === "origin" && (
              <div className="space-y-3">
                <p className="text-xs text-muted">
                  Сейчас: вид →{" "}
                  <strong className="text-fg">
                    {originFeatById(character.originFeatId)?.name ?? "—"}
                  </strong>
                  {" · "}
                  био →{" "}
                  <strong className="text-fg">
                    {originFeatById(character.backgroundFeatId)?.name ?? "—"}
                  </strong>
                  . Dual luck = Везучий + Защищённый (Опора). Источник: dnd.su + BBB.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {allOriginFeats()
                    .filter((f) => {
                      if (!featQuery.trim()) return true;
                      const q = featQuery.toLowerCase();
                      return `${f.name} ${f.nameEn} ${f.body}`.toLowerCase().includes(q);
                    })
                    .map((f) => {
                      const onOrigin = character.originFeatId === f.id;
                      const onBg = character.backgroundFeatId === f.id;
                      return (
                        <div
                          key={f.id}
                          className={cn(
                            "rounded-[var(--radius)] border p-3 text-left text-sm",
                            onOrigin || onBg
                              ? "border-primary bg-primary/10"
                              : "border-border bg-surface-2",
                          )}
                        >
                          <div className="font-medium text-fg">{f.name}</div>
                          <div className="text-[10px] text-faint">{f.source}</div>
                          <p className="mt-1 text-xs text-muted line-clamp-4">{f.body}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant={onOrigin ? "blood" : "secondary"}
                              className="h-9 text-[11px]"
                              onClick={() => setField("originFeatId", f.id)}
                            >
                              Черта вида
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={onBg ? "blood" : "outline"}
                              className="h-9 text-[11px]"
                              onClick={() => setField("backgroundFeatId", f.id)}
                            >
                              Черта био
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {featTab === "kindred" && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span>
                    Слоты сородича:{" "}
                    <strong>
                      {character.selectedFeats.length}/{kSlots}
                    </strong>{" "}
                    (класс {featSlots}
                    {asiSlotsKindred > 0 ? ` + ASI→Kindred ${asiSlotsKindred}` : ""} · 2/7/10/13/17
                    + опция на 4/8/12/16)
                  </span>
                  <button
                    type="button"
                    className={cn(
                      "rounded-full border px-3 py-1.5 font-medium",
                      featClanOnly
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border text-muted",
                    )}
                    onClick={() => setFeatClanOnly((v) => !v)}
                  >
                    {featClanOnly
                      ? `Сначала ${builderClan === "toreador" ? "Тореадор" : "Вентру"}`
                      : "Все кланы"}
                  </button>
                </div>
                <div className="grid gap-2">
                  {KINDRED_FEATS.filter((f) => f.levelMin <= level)
                    .filter((f) => {
                      if (!featQuery.trim()) return true;
                      const q = featQuery.toLowerCase();
                      return `${f.name} ${f.body} ${f.prereq}`.toLowerCase().includes(q);
                    })
                    .filter((f) => {
                      if (!featClanOnly) return true;
                      if (!f.clans || f.clans.includes("any")) return true;
                      return f.clans.includes(builderClan);
                    })
                    .sort((a, b) => {
                      const ra = clanFeatSortKey(a, builderClan);
                      const rb = clanFeatSortKey(b, builderClan);
                      return ra - rb || a.levelMin - b.levelMin;
                    })
                    .map((f) => {
                      const on = character.selectedFeats.includes(f.id);
                      const full =
                        !on &&
                        character.selectedFeats.length >= kSlots &&
                        !f.repeatable;
                      const rec = FEAT_RECS[f.id];
                      const clanHit =
                        rec?.clans?.includes(builderClan) ||
                        f.clans?.includes(builderClan);
                      return (
                        <button
                          key={f.id}
                          type="button"
                          disabled={full}
                          onClick={() => toggleFeat(f.id)}
                          className={cn(
                            "rounded-[var(--radius)] border p-3 text-left text-sm disabled:opacity-40",
                            on
                              ? "border-primary bg-primary/10"
                              : "border-border bg-surface-2",
                          )}
                        >
                          <div className="flex justify-between gap-2">
                            <span className="font-medium">
                              {clanHit && <span className="text-accent">★ </span>}
                              {f.name}
                            </span>
                            <span className="shrink-0 text-[10px] text-faint">
                              ≥{f.levelMin}
                              {f.tags ? ` · ${f.tags.join(", ")}` : ""}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted">{f.body}</p>
                          <p className="mt-0.5 text-[10px] text-faint">{f.prereq}</p>
                          {rec && (
                            <p className="mt-1 text-[11px] text-accent">
                              ★ {rec.note}
                            </p>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {featTab === "general" && (
              <div className="space-y-3">
                <p className="text-xs text-muted">
                  Универсальные черты PHB 2024 (dnd.su). Слоты = уровни, где выбрали «Черта»,
                  не «ASI» (шаг Характеристики):{" "}
                  <strong>
                    {(character.generalFeats ?? []).length}/{gSlots}
                  </strong>
                  . Если 0 — на шаге Характеристики переключите слот 4/8/… на «Черта».
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium",
                      featClanOnly
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border text-muted",
                    )}
                    onClick={() => setFeatClanOnly((v) => !v)}
                  >
                    {featClanOnly ? "Рекомендованные клану" : "Полный список"}
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {generalFeatsForLevel(level)
                    .filter((f) => {
                      if (!featQuery.trim()) return true;
                      const q = featQuery.toLowerCase();
                      return `${f.name} ${f.nameEn} ${f.body} ${f.tags?.join(" ")}`
                        .toLowerCase()
                        .includes(q);
                    })
                    .filter((f) => {
                      if (!featClanOnly) return true;
                      return (
                        recommendedForClan(f, builderClan) ||
                        !!FEAT_RECS[f.id]?.clans?.includes(builderClan)
                      );
                    })
                    .sort((a, b) => clanFeatSortKey(a, builderClan) - clanFeatSortKey(b, builderClan) || a.levelMin - b.levelMin)
                    .map((f) => {
                      const on = (character.generalFeats ?? []).includes(f.id);
                                            const full =
                        !on && (character.generalFeats ?? []).length >= gSlots;
                      const rec = FEAT_RECS[f.id];
                      return (
                        <button
                          key={f.id}
                          type="button"
                          disabled={full && !on}
                          onClick={() => toggleGeneralFeat(f.id)}
                          className={cn(
                            "rounded-[var(--radius)] border p-3 text-left text-sm disabled:opacity-40",
                            on
                              ? "border-primary bg-primary/10"
                              : "border-border bg-surface-2",
                          )}
                        >
                          <div className="flex justify-between gap-2">
                            <span className="font-medium">
                              {rec?.clans?.includes(builderClan) && (
                                <span className="text-accent">★ </span>
                              )}
                              {f.name}
                            </span>
                            <span className="text-[10px] text-faint">≥{f.levelMin}</span>
                          </div>
                          <div className="text-[10px] text-faint">{f.source}</div>
                          <p className="mt-1 text-xs text-muted line-clamp-5">{f.body}</p>
                          {f.tags && (
                            <p className="mt-1 text-[10px] text-faint">
                              {f.tags.join(" · ")}
                            </p>
                          )}
                          {rec && (
                            <p className="mt-1 text-[11px] text-accent">★ {rec.note}</p>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            <div>
              <h3 className="mb-2 font-display text-sm">
                {builderClan === "toreador"
                  ? "Bane Тореадор · внимание"
                  : "Bane Вентру · предпочтённая кровь"}
              </h3>
              {builderClan === "toreador" ? (
                <>
                  <div className="mb-2 rounded-[var(--radius)] border border-primary/30 bg-primary/10 p-3 text-xs text-fg">
                    <strong className="text-primary">Bane (не про кровь):</strong>{" "}
                    если на <strong>Анализе</strong> или <strong>Внимательности</strong> на d20
                    выпало ≤9 — вы <strong>Обездвижены</strong> (Restrained), спас Мудрости DC 10.
                    Это не Bane Вентру с предпочтённой кровью.
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="blood"
                    className="mb-2 h-10"
                    onClick={() => setField("preferredBlood", TOREADOR_BANE_FIELD)}
                  >
                    Записать Bane на лист
                  </Button>
                  <p className="mb-1 text-[11px] text-muted">
                    Опционально — эстетика / вкус (не требование):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {TOREADOR_AESTHETIC_PRESETS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() =>
                          setField(
                            "preferredBlood",
                            `${TOREADOR_BANE_FIELD} · вкус: ${p.replace("…", "").trim()}`,
                          )
                        }
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-xs",
                          character.preferredBlood?.includes(p.slice(0, 6))
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border text-muted",
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="mb-2 text-[11px] text-muted">
                    Питание «не своей» кровью — половина костей (мин. 1).
                  </p>
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
                </>
              )}
              <Input
                className="mt-2"
                value={character.preferredBlood}
                onChange={(e) => setField("preferredBlood", e.target.value)}
                placeholder={
                  builderClan === "toreador"
                    ? TOREADOR_BANE_FIELD
                    : "напр. солдаты / военные"
                }
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
                {character.species || "Вид"} ·{" "}
                {builderClan === "toreador" ? "Тореадор" : "Вентру"} · Kindred {level}
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
                  ХП {hpPreview}
                  {(character.originFeatId === "tough" || character.backgroundFeatId === "tough")
                    ? ` (+${level * 2} Крепкий)`
                    : ""}{" "}
                  · ОБК {bpPreview} · Сл {spellDc} · БМ {formatMod(pb)}
                </li>
                <li>
                  {bg.name} · {originFeatById(character.originFeatId)?.name} +{" "}
                  {originFeatById(character.backgroundFeatId)?.name}
                </li>
                <li>
                  Сородич ({character.selectedFeats.length}/{kSlots}):{" "}
                  {character.selectedFeats
                    .map((id) => KINDRED_FEATS.find((f) => f.id === id)?.name ?? id)
                    .join(", ") || "—"}
                </li>
                <li>
                  PHB-черты ({(character.generalFeats ?? []).length}/{gSlots}) · ASI-очки{" "}
                  {asiPtsUsed}/{asiPtsBudget}:{" "}
                  {(character.generalFeats ?? [])
                    .map((id) => GENERAL_FEAT_CATALOG.find((f) => f.id === id)?.name ?? id)
                    .join(", ") || "—"}
                </li>
                <li>
                  Bane:{" "}
                  {builderClan === "toreador"
                    ? clanBaneLine("toreador")
                    : character.preferredBlood || "—"}
                </li>
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
