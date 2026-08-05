import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
  Sparkles,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  FEAT_LUCKY,
  FEAT_PROTECTED,
  HUMAN_SPECIES,
  ORIGIN_FEATS,
  backgroundById,
  originFeatById,
} from "@/data/origin-ru";
import {
  KINDRED_FEATS,
  KINDRED_TABLE,
  VENTRUE_LORE,
  VENTRUE_FEATURES,
  getLevelData,
} from "@/data/kindred-ru";
import { SKILLS, type SkillId } from "@/data/skills";
import {
  useCharacterStore,
  type Abilities,
  type CharacterSheet,
} from "@/lib/character-store";

const emptyScores = (): Abilities => ({
  str: 10,
  dex: 10,
  con: 10,
  int: 10,
  wis: 10,
  cha: 10,
});

export function VentrueBuilder() {
  const character = useCharacterStore((s) => s.character);
  const patch = useCharacterStore((s) => s.patch);
  const setField = useCharacterStore((s) => s.setField);
  const setAbility = useCharacterStore((s) => s.setAbility);
  const toggleFeat = useCharacterStore((s) => s.toggleFeat);
  const addLog = useCharacterStore((s) => s.addLog);

  const [step, setStep] = useState<BuilderStepId>("concept");
  const [method, setMethod] = useState<"array" | "point" | "manual">("array");
  const [baseScores, setBaseScores] = useState<Abilities>(() => ({
    str: 8,
    dex: 14,
    con: 15,
    int: 8,
    wis: 10,
    cha: 13,
  }));
  /** Background ASI: +2 and +1 keys from the three allowed */
  const [asiPlus2, setAsiPlus2] = useState<keyof Abilities>("cha");
  const [asiPlus1, setAsiPlus1] = useState<keyof Abilities>("con");
  const [classSkills, setClassSkills] = useState<SkillId[]>(["intimidation", "insight"]);
  const [openGuide, setOpenGuide] = useState<string | null>("feed");

  const level = character.level;
  const bg = backgroundById(character.backgroundId) ?? BACKGROUNDS_PDF[0]!;
  const featSlots = kindredFeatSlots(level);
  const pb = getLevelData(level).pb;

  const bgAbilityKeys = useMemo(() => parseBgAbilities(bg.abilityScores), [bg]);

  const finalScores = useMemo(() => {
    const s = { ...baseScores };
    // apply +2/+1 if keys distinct and in bg list
    if (asiPlus2 !== asiPlus1) {
      s[asiPlus2] = Math.min(20, s[asiPlus2] + 2);
      s[asiPlus1] = Math.min(20, s[asiPlus1] + 1);
    }
    return s;
  }, [baseScores, asiPlus2, asiPlus1]);

  const spent = pointBuySpent(Object.values(baseScores));
  const hpPreview = calcKindredHp(level, finalScores.con, level >= 6);
  const bpPreview = getLevelData(level).bp;
  const spellDc = 8 + pb + abilityMod(finalScores.cha);

  const bgSkillIds = useMemo(() => skillsFromBg(bg.skills), [bg]);
  const humanSkill = (character.humanSkill || "deception") as SkillId;

  const stepIndex = BUILDER_STEPS.findIndex((s) => s.id === step);

  function go(delta: number) {
    const next = BUILDER_STEPS[stepIndex + delta];
    if (next) setStep(next.id);
  }

  function applyStandardArray() {
    // Optimal-ish Ventrue social: CHA>CON>DEX>WIS>INT>STR
    setBaseScores({
      str: 8,
      dex: 14,
      con: 15,
      int: 10,
      wis: 12,
      cha: 13,
    });
    setMethod("array");
    toast.message("Стандартный массив 15/14/13/12/10/8 разложен под Вентру");
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
    // Skills: class 2 + bg 2 + human 1
    const skillProfs: CharacterSheet["skillProfs"] = {};
    for (const id of classSkills) skillProfs[id] = "proficient";
    for (const id of bgSkillIds) skillProfs[id] = "proficient";
    if (humanSkill) skillProfs[humanSkill] = "proficient";

    const originFeat = character.originFeatId || "lucky";
    const bgFeat = character.backgroundFeatId || bg.featId;
    // remap unknown feats to protected for sheet
    const bgFeatSafe =
      originFeatById(bgFeat) || bgFeat === "protected" || bgFeat === "lucky"
        ? bgFeat === "magic-initiate" || bgFeat === "well-read"
          ? "protected"
          : bgFeat
        : "protected";

    const ventrue = level >= 3;
    const resources = [
      {
        id: "cr-voice",
        name: "Голос власти",
        current: pb,
        max: pb,
        note: "Приказ / Внушение · короткий",
      },
    ];
    if (character.selectedFeats.includes("forceful") || level >= 2) {
      // suggest Forceful Presence resource if feat selected
      if (character.selectedFeats.includes("forceful")) {
        resources.push({
          id: "cr-presence",
          name: "Властное присутствие",
          current: pb,
          max: pb,
          note: "Awe / Daunt · LR",
        });
      }
    }

    const hp = calcKindredHp(level, finalScores.con, level >= 6 && ventrue);

    patch({
      abilities: finalScores,
      skillProfs,
      saveProfs: { con: true, cha: true },
      species: "Человек",
      clan: "ventrue",
      background: bg.name,
      backgroundId: bg.id,
      originFeatId: originFeat,
      backgroundFeatId: bgFeatSafe === "magic-initiate" || bgFeatSafe === "well-read" ? "protected" : bgFeatSafe,
      humanSkill,
      hpMax: hp,
      hpCurrent: hp,
      bloodCurrent: bpPreview,
      ac: 10 + abilityMod(finalScores.dex) + (finalScores.dex >= 14 ? 2 : 1), // rough light armor-ish
      speed: 30,
      inspiration: true,
      luckyUsed: 0,
      protectedUsed: 0,
      customResources: resources,
      preferredBlood: character.preferredBlood || "солдаты / военные",
      feats: buildFeatNotes(level, character.selectedFeats, originFeat, bgFeatSafe),
      equipment: character.equipment || bg.equipment,
    });

    // also write final scores via setAbility for reactivity
    (Object.keys(finalScores) as (keyof Abilities)[]).forEach((k) =>
      setAbility(k, finalScores[k]),
    );

    addLog("Билдер: персонаж применён");
    toast.success("Билд применён к листу");
  }

  return (
    <div className="space-y-4">
      {/* Step nav */}
      <div className="flex gap-1 overflow-x-auto scroll-thin pb-1">
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
            {i < stepIndex ? <Check className="size-3.5" /> : <span className="opacity-60">{i + 1}</span>}
            {s.short}
          </button>
        ))}
      </div>

      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 sm:p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-[var(--radius)] bg-primary/15 text-primary">
            <User className="size-5" />
          </div>
          <div>
            <h2 className="font-display text-xl tracking-wide">
              Билдер · {VENTRUE_LORE.name}
            </h2>
            <p className="text-sm text-muted">
              {VENTRUE_LORE.tagline}. Шаг {stepIndex + 1}/{BUILDER_STEPS.length}:{" "}
              {BUILDER_STEPS[stepIndex]?.title}
            </p>
          </div>
        </div>

        {step === "concept" && (
          <div className="space-y-4">
            <InfoBox>
              Создаём <strong>Сородича (Kindred)</strong> клана <strong>Вентру</strong>. В Мире
              Тьмы рекомендуется начинать с 3 уровня (подкласс). Источники: Bound by Blood PDF +
              dnd.su (PHB 2024: человек, Lucky).
            </InfoBox>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Имя">
                <Input
                  value={character.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="Имя персонажа"
                />
              </Field>
              <Field label="Игрок">
                <Input
                  value={character.player}
                  onChange={(e) => setField("player", e.target.value)}
                />
              </Field>
              <Field label="Уровень Kindred (1–20)">
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={level}
                  onChange={(e) =>
                    setField("level", Math.min(20, Math.max(1, Number(e.target.value) || 1)))
                  }
                />
              </Field>
              <Field label="Мультикласс (опционально)">
                <Input
                  value={character.multiclass}
                  onChange={(e) => setField("multiclass", e.target.value)}
                  placeholder="напр. Колдун 1"
                />
              </Field>
              <Field label="Мировоззрение">
                <Input
                  value={character.alignment}
                  onChange={(e) => setField("alignment", e.target.value)}
                />
              </Field>
              <Field label="Клан">
                <Input value="Вентру" disabled />
              </Field>
            </div>
            <div className="rounded-[var(--radius)] border border-border bg-surface-2 p-3 text-sm">
              <div className="font-medium text-accent">На уровне {level}</div>
              <ul className="mt-1 space-y-1 text-muted">
                <li>БМ {formatMod(pb)} · ОБК {bpPreview} · Питание {getLevelData(level).feed}</li>
                <li>Черты сородича: {featSlots} слот(ов)</li>
                <li>ASI: {asiCount(level)} ({ASI_LEVELS.filter((l) => level >= l).join(", ") || "—"})</li>
                <li>{KINDRED_TABLE[level - 1]?.features}</li>
              </ul>
            </div>
          </div>
        )}

        {step === "origin" && (
          <div className="space-y-4">
            <section>
              <h3 className="mb-2 font-display text-base">Вид · Человек</h3>
              <InfoBox source={HUMAN_SPECIES.source}>
                Для Вентру-социала человек — лучший старт: вдохновение каждый LR + skill + origin
                feat (Везучий).
              </InfoBox>
              <ul className="mt-2 space-y-2">
                {HUMAN_SPECIES.traits.map((t) => (
                  <li
                    key={t.name}
                    className="rounded-[var(--radius)] border border-border bg-surface-2 p-3 text-sm"
                  >
                    <div className="font-medium text-fg">{t.name}</div>
                    <p className="mt-1 text-muted">{t.body}</p>
                  </li>
                ))}
              </ul>
              <Field label="Навык от Умелого (Skillful)" className="mt-3">
                <select
                  className="h-10 w-full rounded-[var(--radius)] border border-border bg-bg px-3"
                  value={humanSkill}
                  onChange={(e) => setField("humanSkill", e.target.value as SkillId)}
                >
                  {SKILLS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameRu}
                    </option>
                  ))}
                </select>
              </Field>
            </section>

            <section>
              <h3 className="mb-2 font-display text-base">Биография</h3>
              <div className="grid gap-2">
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
                            : b.featId;
                        setField("backgroundFeatId", feat in { lucky: 1, protected: 1, healthy: 1, nocturnal: 1, "thin-blooded": 1 } ? feat : "protected");
                        // default ASI picks first two from list
                        const keys = parseBgAbilities(b.abilityScores);
                        if (keys[0]) setAsiPlus2(keys[0]);
                        if (keys[1]) setAsiPlus1(keys[1]);
                      }}
                      className={cn(
                        "rounded-[var(--radius)] border p-3 text-left transition-colors",
                        active
                          ? "border-primary bg-primary/10"
                          : "border-border bg-surface-2 hover:border-border-strong",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{b.name}</span>
                        {active && <Check className="size-4 text-primary" />}
                      </div>
                      <p className="mt-1 text-xs text-muted">{b.description}</p>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-faint">
                        <span>Статы: {b.abilityScores}</span>
                        <span>Навыки: {b.skills}</span>
                        <span>Черта: {originFeatById(b.featId)?.name ?? b.featId}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <InfoBox className="mt-3">
                <strong>Опора</strong> даёт черту <strong>Защищённый</strong> (PDF) — вторая удача
                рядом с Везучим человека. Для «двух удач» выберите Опору + origin feat Везучий.
              </InfoBox>
            </section>

            <section>
              <h3 className="mb-2 font-display text-base">Черта происхождения (Versatile)</h3>
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
                    <p className="mt-1 line-clamp-3 text-xs text-muted">{f.body}</p>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {step === "abilities" && (
          <div className="space-y-4">
            <InfoBox>
              PHB 2024: после выбора массива/покупки биография даёт{" "}
              <strong>+2 к одной и +1 к другой</strong> из трёх перечисленных (сейчас:{" "}
              {bg.abilityScores}).
            </InfoBox>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={method === "array" ? "blood" : "secondary"}
                onClick={applyStandardArray}
              >
                Стандартный массив
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
                Point buy (27)
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
              <p
                className={cn(
                  "text-sm",
                  spent > POINT_BUY_BUDGET ? "text-primary" : "text-success",
                )}
              >
                Потрачено {spent} / {POINT_BUY_BUDGET}
                {spent > POINT_BUY_BUDGET && " — перебор!"}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ABILITY_LABELS.map(({ key, ru, short }) => (
                <div
                  key={key}
                  className="rounded-[var(--radius)] border border-border bg-surface-2 p-3"
                >
                  <div className="text-xs font-semibold text-muted">
                    {ru} ({short})
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Input
                      type="number"
                      min={3}
                      max={20}
                      className="h-10 w-20 text-center font-display text-lg"
                      value={baseScores[key]}
                      onChange={(e) =>
                        setBaseScores((s) => ({
                          ...s,
                          [key]: Math.min(20, Math.max(3, Number(e.target.value) || 8)),
                        }))
                      }
                    />
                    <span className="font-display text-xl text-faint">→</span>
                    <div className="text-center">
                      <div className="font-display text-2xl text-accent">{finalScores[key]}</div>
                      <div className="text-xs text-muted">
                        {formatMod(abilityMod(finalScores[key]))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-[var(--radius)] border border-border p-3">
              <div className="mb-2 text-sm font-medium">Бонусы биографии (+2 / +1)</div>
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
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <StatChip label="ХП (прогноз)" value={String(hpPreview)} />
              <StatChip label="Сл закл." value={String(spellDc)} />
              <StatChip label="Иниц" value={formatMod(abilityMod(finalScores.dex))} />
            </div>
          </div>
        )}

        {step === "skills" && (
          <div className="space-y-4">
            <InfoBox>
              Выберите <strong>2 навыка класса</strong>. Биография и Skillful добавляются
              автоматически (нельзя «снять», только сменить Skillful на шаге происхождения).
            </InfoBox>
            <div>
              <h3 className="mb-2 text-sm font-medium">
                Класс Сородич ({classSkills.length}/2)
              </h3>
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
                        "rounded-full border px-3 py-1.5 text-xs font-medium",
                        on
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-border bg-surface-2 text-muted",
                        locked && "ring-1 ring-accent/40",
                      )}
                    >
                      {sk.nameRu}
                      {locked ? " · био/чел" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="rounded-[var(--radius)] border border-border bg-surface-2 p-3 text-sm">
              <div className="font-medium">Итого владения</div>
              <ul className="mt-2 space-y-1 text-muted">
                {classSkills.map((id) => (
                  <li key={id}>• {SKILLS.find((s) => s.id === id)?.nameRu} (класс)</li>
                ))}
                {bgSkillIds.map((id) => (
                  <li key={id}>• {SKILLS.find((s) => s.id === id)?.nameRu} (биография)</li>
                ))}
                <li>• {SKILLS.find((s) => s.id === humanSkill)?.nameRu} (человек)</li>
              </ul>
            </div>
            <p className="text-xs text-muted">
              Expertise (×2 БМ) можно выставить позже во вкладке Навыки — RAW Kindred сам по себе
              expertise не даёт (кроме отдельных черт/фич).
            </p>
          </div>
        )}

        {step === "feats" && (
          <div className="space-y-4">
            <InfoBox>
              Слоты <strong>черт сородича</strong> на ур. 2, 7, 10, 13, 17 — сейчас доступно:{" "}
              <strong>{featSlots}</strong>. Это не ASI. Выбрано:{" "}
              {character.selectedFeats.length}.
            </InfoBox>
            <div className="grid gap-2">
              {KINDRED_FEATS.filter((f) => f.levelMin <= level).map((f) => {
                const on = character.selectedFeats.includes(f.id);
                const over = !on && character.selectedFeats.length >= featSlots && !f.repeatable;
                return (
                  <button
                    key={f.id}
                    type="button"
                    disabled={over}
                    onClick={() => {
                      if (on) toggleFeat(f.id);
                      else if (character.selectedFeats.length < featSlots || f.repeatable)
                        toggleFeat(f.id);
                      else toast.error(`Макс. ${featSlots} черт сородича`);
                    }}
                    className={cn(
                      "rounded-[var(--radius)] border p-3 text-left text-sm disabled:opacity-40",
                      on ? "border-primary bg-primary/10" : "border-border bg-surface-2",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{f.name}</span>
                      <span className="text-[10px] text-faint">с {f.levelMin} ур.</span>
                    </div>
                    <p className="mt-1 text-xs text-muted">{f.prereq}</p>
                    <p className="mt-1 text-xs text-fg/80">{f.body}</p>
                  </button>
                );
              })}
            </div>
            <div className="rounded-[var(--radius)] border border-border p-3">
              <h3 className="mb-2 font-display text-sm">Bane · предпочтённая кровь</h3>
              <div className="flex flex-wrap gap-1.5">
                {PREFERRED_BLOOD_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setField("preferredBlood", p.replace("…", ""))}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs",
                      character.preferredBlood.includes(p.slice(0, 6))
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
                placeholder="Свой тип крови…"
              />
              <p className="mt-2 text-xs text-muted">
                Не тот тип → half Feed Dice (мин. 1). Выберите тему, которая бьёт по истории
                персонажа.
              </p>
            </div>
          </div>
        )}

        {step === "mechanics" && (
          <div className="space-y-3">
            <InfoBox>
              Краткие RAW-объяснения для соло и стола. Полные тексты также во вкладке Способности.
            </InfoBox>
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
              <div className="font-display text-base text-primary">{VENTRUE_LORE.title}</div>
              <p className="mt-1 text-muted">{VENTRUE_LORE.description}</p>
              <ul className="mt-2 space-y-1 text-xs text-faint">
                {VENTRUE_FEATURES.filter((f) => f.level <= level).map((f) => (
                  <li key={f.id}>
                    ур.{f.level} · {f.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {step === "finish" && (
          <div className="space-y-4">
            <div className="rounded-[var(--radius)] border border-accent/40 bg-accent/5 p-4">
              <h3 className="font-display text-lg">{character.name || "Без имени"}</h3>
              <p className="text-sm text-muted">
                Человек · Вентру · Kindred {level}
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
                  ХП ≈ {hpPreview} · ОБК {bpPreview} · Сл {spellDc} · БМ {formatMod(pb)}
                </li>
                <li>Био: {bg.name} · Origin: {originFeatById(character.originFeatId)?.name}</li>
                <li>
                  Черты сородича:{" "}
                  {character.selectedFeats
                    .map((id) => KINDRED_FEATS.find((f) => f.id === id)?.name ?? id)
                    .join(", ") || "—"}
                </li>
                <li>Bane: {character.preferredBlood || "не выбран"}</li>
              </ul>
            </div>
            <Button type="button" variant="blood" className="h-12 w-full text-base" onClick={applyToSheet}>
              <Sparkles className="size-4" />
              Применить билд к листу
            </Button>
            <p className="text-center text-xs text-muted">
              После применения играйте во вкладке Бой. Можно вернуться в билдер и пересобрать.
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-between gap-2 border-t border-border pt-4">
          <Button
            type="button"
            variant="secondary"
            disabled={stepIndex === 0}
            onClick={() => go(-1)}
          >
            <ChevronLeft className="size-4" /> Назад
          </Button>
          {step !== "finish" ? (
            <Button type="button" variant="blood" onClick={() => go(1)}>
              Далее <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button type="button" variant="secondary" onClick={applyToSheet}>
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

function buildFeatNotes(
  level: number,
  feats: string[],
  origin: string,
  bgFeat: string,
) {
  const lines = [
    `Человек · origin: ${originFeatById(origin)?.name ?? origin}`,
    `Био · ${originFeatById(bgFeat)?.name ?? bgFeat}`,
    ...feats.map((id) => KINDRED_FEATS.find((f) => f.id === id)?.name ?? id),
    `Уровень ${level}`,
  ];
  return lines.join("\n");
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
